import { randomBytes, createHash } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { parseDurationMs } from "../../common/utils/duration.util";

@Injectable()
export class SessionsService {
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTtlMs = parseDurationMs(
      this.configService.get<string>("jwt.refreshTtl")!,
    );
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private generateRawToken(): string {
    return randomBytes(48).toString("hex");
  }

  async create(params: {
    userId: string;
    deviceId?: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ rawToken: string; sessionId: string; expiresAt: Date }> {
    const rawToken = this.generateRawToken();
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    const session = await this.prisma.session.create({
      data: {
        userId: params.userId,
        deviceId: params.deviceId,
        refreshTokenHash: this.hashToken(rawToken),
        userAgent: params.userAgent,
        ip: params.ip,
        expiresAt,
      },
    });

    return { rawToken, sessionId: session.id, expiresAt };
  }

  /**
   * Refresh-token rotation: the presented raw token must match an
   * unrevoked, unexpired session. On success, that session is revoked and a
   * brand-new session/token pair is issued — a reused (replayed) refresh
   * token will therefore always fail on its second use.
   */
  async rotate(rawToken: string): Promise<{
    rawToken: string;
    sessionId: string;
    userId: string;
    deviceId: string | null;
    expiresAt: Date;
  }> {
    const tokenHash = this.hashToken(rawToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }

    const next = await this.create({
      userId: session.userId,
      deviceId: session.deviceId ?? undefined,
      userAgent: session.userAgent ?? undefined,
      ip: session.ip ?? undefined,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedBySessionId: next.sessionId },
    });

    return {
      rawToken: next.rawToken,
      sessionId: next.sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      expiresAt: next.expiresAt,
    };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revoke(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  list(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { device: true },
    });
  }
}
