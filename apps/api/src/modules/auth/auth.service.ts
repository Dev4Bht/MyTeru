import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { OtpPurpose } from "@druksave/database";
import { AuthResponse, OtpChallengeResponse } from "@druksave/shared";
import { PrismaService } from "../../database/prisma.service";
import { UsersService } from "../users/users.service";
import { toAuthenticatedUser } from "../users/users.mapper";
import { DevicesService } from "../devices/devices.service";
import { SessionsService } from "../sessions/sessions.service";
import { AuditService } from "../audit/audit.service";
import { OtpService } from "../otp/otp.service";
import { TokensService } from "./tokens.service";
import {
  ChangePasswordDto,
  ChangePhoneConfirmDto,
  ChangePhoneDto,
  ForgotPasswordDto,
  LoginDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from "./dto";

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    private readonly otpService: OtpService,
    private readonly tokensService: TokensService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>("argon2.memoryCost"),
      timeCost: this.configService.get<number>("argon2.timeCost"),
      parallelism: this.configService.get<number>("argon2.parallelism"),
    });
  }

  async signup(dto: SignupDto, ctx: RequestContext): Promise<OtpChallengeResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing?.isPhoneVerified) {
      throw new ConflictException("This phone number is already registered");
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            email: dto.email,
            profile: { update: { fullName: dto.fullName } },
          },
        })
      : await this.usersService.create({
          phone: dto.phone,
          passwordHash,
          email: dto.email,
          fullName: dto.fullName,
        });

    // Unverified signups keep passwordHash but isPhoneVerified stays false
    // until OTP confirms the number, so this differs from `create()`'s
    // default of marking phones pre-verified for that other path.
    await this.prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: false } });

    const challenge = await this.otpService.generateAndSend({
      phone: dto.phone,
      purpose: OtpPurpose.SIGNUP,
      deviceId: dto.deviceId,
      userId: user.id,
    });

    await this.auditService.record({
      userId: user.id,
      action: "auth.signup.initiated",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return challenge;
  }

  async resendOtp(dto: ResendOtpDto): Promise<OtpChallengeResponse> {
    const user = await this.usersService.findByPhone(dto.phone);
    return this.otpService.generateAndSend({
      phone: dto.phone,
      purpose: dto.purpose,
      deviceId: dto.deviceId,
      userId: user?.id,
    });
  }

  /**
   * Handles OTP verification for SIGNUP and LOGIN purposes: both end with a
   * fully authenticated session. PASSWORD_RESET and CHANGE_PHONE OTPs are
   * consumed inline by their own dedicated flows instead (see below).
   */
  async verifyOtpAndAuthenticate(
    dto: VerifyOtpDto,
    ctx: RequestContext,
  ): Promise<AuthResponse> {
    if (dto.purpose !== OtpPurpose.SIGNUP && dto.purpose !== OtpPurpose.LOGIN) {
      throw new BadRequestException("Unsupported OTP purpose for this endpoint");
    }

    const { userId } = await this.otpService.verify({
      phone: dto.phone,
      code: dto.code,
      purpose: dto.purpose,
      deviceId: dto.deviceId,
    });

    if (!userId) {
      throw new BadRequestException("Verification code is not associated with an account");
    }

    if (dto.purpose === OtpPurpose.SIGNUP) {
      await this.prisma.user.update({ where: { id: userId }, data: { isPhoneVerified: true } });
    }

    const device = await this.devicesService.registerOrTouch({
      userId,
      deviceId: dto.deviceId,
      ip: ctx.ip,
    });
    await this.prisma.device.update({ where: { id: device.id }, data: { isTrusted: true } });

    const session = await this.sessionsService.create({
      userId,
      deviceId: device.id,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    await this.usersService.resetFailedLogins(userId);

    const user = await this.usersService.findByIdOrThrow(userId);
    const { accessToken, expiresAt } = this.tokensService.signAccessToken({
      userId,
      phone: user.phone,
      role: user.role,
      sessionId: session.sessionId,
    });

    await this.auditService.record({
      userId,
      action: `auth.${dto.purpose.toLowerCase()}.otp_verified`,
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

  async login(
    dto: LoginDto,
    ctx: RequestContext,
  ): Promise<AuthResponse | OtpChallengeResponse> {
    const user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      throw new UnauthorizedException("Invalid phone number or password");
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
      throw new UnauthorizedException("Invalid phone number or password");
    }

    const isKnownDevice = await this.devicesService.isKnownDevice(user.id, dto.deviceId);

    if (!isKnownDevice) {
      const challenge = await this.otpService.generateAndSend({
        phone: dto.phone,
        purpose: OtpPurpose.LOGIN,
        deviceId: dto.deviceId,
        userId: user.id,
      });
      await this.auditService.record({
        userId: user.id,
        action: "auth.login.otp_required",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return challenge;
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
      phone: user.phone,
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
      phone: user.phone,
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

  /** Always returns the same shape whether or not the phone is registered, to avoid user enumeration. */
  async forgotPassword(dto: ForgotPasswordDto): Promise<OtpChallengeResponse> {
    const user = await this.usersService.findByPhone(dto.phone);
    const ttlSeconds = this.configService.get<number>("otp.ttlSeconds")!;
    const resendCooldownSeconds = this.configService.get<number>(
      "otp.resendCooldownSeconds",
    )!;

    if (!user) {
      return {
        phone: dto.phone,
        purpose: OtpPurpose.PASSWORD_RESET,
        expiresInSeconds: ttlSeconds,
        resendAvailableInSeconds: resendCooldownSeconds,
      };
    }

    return this.otpService.generateAndSend({
      phone: dto.phone,
      purpose: OtpPurpose.PASSWORD_RESET,
      userId: user.id,
    });
  }

  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    await this.otpService.verify({
      phone: dto.phone,
      code: dto.code,
      purpose: OtpPurpose.PASSWORD_RESET,
    });

    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new BadRequestException("Invalid verification code");
    }

    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.sessionsService.revokeAll(user.id);

    await this.auditService.record({
      userId: user.id,
      action: "auth.password.reset",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ctx: RequestContext,
  ): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const user = await this.usersService.findByIdOrThrow(userId);
    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.sessionsService.revokeAll(userId);

    await this.auditService.record({
      userId,
      action: "auth.password.changed",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  async changePhone(
    userId: string,
    dto: ChangePhoneDto,
    ctx: RequestContext,
  ): Promise<OtpChallengeResponse> {
    const existing = await this.usersService.findByPhone(dto.newPhone);
    if (existing) {
      throw new ConflictException("This phone number is already in use");
    }

    const challenge = await this.otpService.generateAndSend({
      phone: dto.newPhone,
      purpose: OtpPurpose.CHANGE_PHONE,
      userId,
    });

    await this.auditService.record({
      userId,
      action: "auth.phone.change_initiated",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return challenge;
  }

  async changePhoneConfirm(
    userId: string,
    dto: ChangePhoneConfirmDto,
    ctx: RequestContext,
  ): Promise<void> {
    const { userId: otpUserId } = await this.otpService.verify({
      phone: dto.newPhone,
      code: dto.code,
      purpose: OtpPurpose.CHANGE_PHONE,
    });

    if (otpUserId !== userId) {
      throw new ForbiddenException("This verification code was not issued to your account");
    }

    await this.usersService.updatePhone(userId, dto.newPhone);

    await this.auditService.record({
      userId,
      action: "auth.phone.changed",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}
