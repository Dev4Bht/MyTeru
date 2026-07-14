import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upserts a device row on every login so it can be listed/revoked later. */
  async registerOrTouch(params: {
    userId: string;
    deviceId: string;
    name?: string;
    platform?: string;
    ip?: string;
  }) {
    return this.prisma.device.upsert({
      where: { userId_deviceId: { userId: params.userId, deviceId: params.deviceId } },
      update: { lastSeenAt: new Date(), lastIp: params.ip },
      create: {
        userId: params.userId,
        deviceId: params.deviceId,
        name: params.name,
        platform: params.platform,
        lastIp: params.ip,
      },
    });
  }

  list(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async revoke(userId: string, id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) {
      throw new NotFoundException("Device not found");
    }
    if (device.userId !== userId) {
      throw new ForbiddenException("You cannot revoke another user's device");
    }
    await this.prisma.device.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.prisma.session.updateMany({
      where: { deviceId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
