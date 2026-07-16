import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { AuthResponse } from "@druksave/shared";
import { UsersService } from "../users/users.service";
import { toAuthenticatedUser } from "../users/users.mapper";
import { DevicesService } from "../devices/devices.service";
import { SessionsService } from "../sessions/sessions.service";
import { AuditService } from "../audit/audit.service";
import { TokensService } from "./tokens.service";
import { LoginDto, SignupDto } from "./dto";

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

// Precomputed Argon2id hash of a random value, used to keep login() timing
// consistent between "unknown email" and "wrong password" so the endpoint
// doesn't leak which emails have accounts via response latency.
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$R4keE+4gNuyuhJbMaVfgOA$K0stdP5X7k4tHYvXcPHRE0h/Kn1z4EkQR5NOZ7LKYuI";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    private readonly tokensService: TokensService,
  ) {}

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>("argon2.memoryCost"),
      timeCost: this.configService.get<number>("argon2.timeCost"),
      parallelism: this.configService.get<number>("argon2.parallelism"),
    });
  }

  async signup(dto: SignupDto, ctx: RequestContext): Promise<AuthResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

    const device = await this.devicesService.registerOrTouch({
      userId: user.id,
      deviceId: dto.deviceId,
      ip: ctx.ip,
    });

    const session = await this.sessionsService.create({
      userId: user.id,
      deviceId: device.id,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    const { accessToken, expiresAt } = this.tokensService.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.sessionId,
    });

    await this.auditService.record({
      userId: user.id,
      action: "auth.signup",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      user: toAuthenticatedUser(user),
      tokens: {
        accessToken,
        refreshToken: session.rawToken,
        accessTokenExpiresAt: expiresAt.toISOString(),
      },
    };
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // Still run an Argon2 verify against a fixed dummy hash so this takes
      // roughly as long as the "wrong password" case below — otherwise the
      // endpoint could be used to enumerate which emails have accounts via
      // response latency.
      await argon2.verify(DUMMY_PASSWORD_HASH, dto.password);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        "This account is temporarily locked due to repeated failed attempts. Please try again later.",
      );
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      await this.usersService.recordFailedLogin(
        user.id,
        this.configService.get<number>("login.maxAttempts")!,
        this.configService.get<number>("login.lockoutMinutes")!,
      );
      await this.auditService.record({
        userId: user.id,
        action: "auth.login.failed",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    const device = await this.devicesService.registerOrTouch({
      userId: user.id,
      deviceId: dto.deviceId,
      ip: ctx.ip,
    });

    const session = await this.sessionsService.create({
      userId: user.id,
      deviceId: device.id,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    await this.usersService.resetFailedLogins(user.id);

    const { accessToken, expiresAt } = this.tokensService.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.sessionId,
    });

    await this.auditService.record({
      userId: user.id,
      action: "auth.login.success",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      user: toAuthenticatedUser(user),
      tokens: {
        accessToken,
        refreshToken: session.rawToken,
        accessTokenExpiresAt: expiresAt.toISOString(),
      },
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthResponse> {
    const rotated = await this.sessionsService.rotate(rawRefreshToken);
    const user = await this.usersService.findByIdOrThrow(rotated.userId);

    const { accessToken, expiresAt } = this.tokensService.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: rotated.sessionId,
    });

    return {
      user: toAuthenticatedUser(user),
      tokens: {
        accessToken,
        refreshToken: rotated.rawToken,
        accessTokenExpiresAt: expiresAt.toISOString(),
      },
    };
  }

  async logout(rawRefreshToken: string, ctx: RequestContext, userId?: string): Promise<void> {
    await this.sessionsService.revokeByRawToken(rawRefreshToken);
    await this.auditService.record({
      userId,
      action: "auth.logout",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}
