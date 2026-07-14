import { Injectable } from "@nestjs/common";
import { AuthResponse } from "@druksave/shared";
import { UsersService } from "../users/users.service";
import { toAuthenticatedUser } from "../users/users.mapper";
import { DevicesService } from "../devices/devices.service";
import { SessionsService } from "../sessions/sessions.service";
import { AuditService } from "../audit/audit.service";
import { GoogleAuthService } from "./google-auth.service";
import { TokensService } from "./tokens.service";
import { GoogleLoginDto } from "./dto";

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly tokensService: TokensService,
  ) {}

  async loginWithGoogle(dto: GoogleLoginDto, ctx: RequestContext): Promise<AuthResponse> {
    const profile = await this.googleAuthService.verifyIdToken(dto.idToken);
    const user = await this.usersService.findOrCreateFromGoogle(profile);

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

    await this.usersService.recordLogin(user.id);

    const { accessToken, expiresAt } = this.tokensService.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.sessionId,
    });

    await this.auditService.record({
      userId: user.id,
      action: "auth.google.login",
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
