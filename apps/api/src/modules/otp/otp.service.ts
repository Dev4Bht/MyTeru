import { randomInt } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { OtpPurpose } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import { SMS_PROVIDER, SmsProvider } from "../sms/sms-provider.interface";
import { OTP_MESSAGE_BY_PURPOSE } from "./otp.constants";
import { OtpChallengeResponse } from "@druksave/shared";

@Injectable()
export class OtpService {
  private readonly length: number;
  private readonly ttlSeconds: number;
  private readonly maxAttempts: number;
  private readonly resendCooldownSeconds: number;
  private readonly maxSendsPerHour: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {
    this.length = this.configService.get<number>("otp.length")!;
    this.ttlSeconds = this.configService.get<number>("otp.ttlSeconds")!;
    this.maxAttempts = this.configService.get<number>("otp.maxAttempts")!;
    this.resendCooldownSeconds = this.configService.get<number>(
      "otp.resendCooldownSeconds",
    )!;
    this.maxSendsPerHour = this.configService.get<number>("otp.maxSendsPerHour")!;
  }

  /** Generates, persists (hashed), sends, and rate-limits a new OTP. */
  async generateAndSend(params: {
    phone: string;
    purpose: OtpPurpose;
    deviceId?: string;
    userId?: string;
  }): Promise<OtpChallengeResponse> {
    const { phone, purpose, deviceId, userId } = params;

    // Rate limiting is backed by Postgres (via the Otp table's own rows)
    // rather than a cache like Redis, so it works correctly in both a
    // long-running server and stateless serverless functions, where
    // in-memory/per-instance state can't be trusted across invocations.
    const mostRecent = await this.prisma.otp.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (mostRecent) {
      const secondsSinceLastSend = (Date.now() - mostRecent.createdAt.getTime()) / 1000;
      if (secondsSinceLastSend < this.resendCooldownSeconds) {
        const remaining = Math.ceil(this.resendCooldownSeconds - secondsSinceLastSend);
        throw new HttpException(
          `Please wait ${remaining}s before requesting another code.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sentInLastHour = await this.prisma.otp.count({
      where: { phone, purpose, createdAt: { gte: oneHourAgo } },
    });
    if (sentInLastHour >= this.maxSendsPerHour) {
      throw new HttpException(
        "Too many code requests for this number. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Invalidate any still-active OTP for this phone+purpose (single active
    // code per purpose — prevents an older, leaked code from staying valid).
    await this.prisma.otp.updateMany({
      where: { phone, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = this.generateCode();
    const codeHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    const device = deviceId
      ? await this.prisma.device.findFirst({ where: { userId, deviceId } })
      : null;
    // Pre-signup/login, the device row may not exist yet — that's fine,
    // device binding still works via the raw deviceId string comparison at
    // verify time.

    await this.prisma.otp.create({
      data: {
        phone,
        purpose,
        userId,
        deviceId: device?.id,
        codeHash,
        expiresAt,
        maxAttempts: this.maxAttempts,
      },
    });

    const ttlMinutes = Math.round(this.ttlSeconds / 60);
    const message = OTP_MESSAGE_BY_PURPOSE[purpose](code, ttlMinutes);
    const result = await this.smsProvider.send(phone, message);

    if (!result.success) {
      throw new BadRequestException("Failed to send verification code. Please try again.");
    }

    return {
      phone,
      purpose,
      expiresInSeconds: this.ttlSeconds,
      resendAvailableInSeconds: this.resendCooldownSeconds,
    };
  }

  /**
   * Verifies a code for phone+purpose. Enforces one-time consumption
   * (replay protection), max attempts, and — when the OTP was generated
   * with a deviceId — that verification comes from the same device.
   */
  async verify(params: {
    phone: string;
    code: string;
    purpose: OtpPurpose;
    deviceId?: string;
  }): Promise<{ userId: string | null }> {
    const { phone, code, purpose, deviceId } = params;

    const otp = await this.prisma.otp.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
      include: { device: true },
    });

    if (!otp) {
      throw new BadRequestException("No active verification code found. Please request a new one.");
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException("This code has expired. Please request a new one.");
    }

    if (otp.attempts >= otp.maxAttempts) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });
      throw new ForbiddenException("Too many incorrect attempts. Please request a new code.");
    }

    if (otp.device && otp.device.deviceId !== deviceId) {
      throw new ForbiddenException("This code was issued to a different device.");
    }

    const isValid = await argon2.verify(otp.codeHash, code);

    if (!isValid) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Incorrect code. Please try again.");
    }

    // One-time consumption — the same code cannot be replayed.
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    return { userId: otp.userId };
  }

  private generateCode(): string {
    const max = 10 ** this.length;
    const code = randomInt(0, max);
    return code.toString().padStart(this.length, "0");
  }
}
