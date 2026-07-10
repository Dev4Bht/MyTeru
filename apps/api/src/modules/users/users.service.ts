import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone }, include: { profile: true } });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  existsByPhone(phone: string) {
    return this.prisma.user
      .findUnique({ where: { phone }, select: { id: true } })
      .then(Boolean);
  }

  create(params: {
    phone: string;
    passwordHash: string;
    email?: string;
    fullName: string;
  }) {
    return this.prisma.user.create({
      data: {
        phone: params.phone,
        passwordHash: params.passwordHash,
        email: params.email,
        isPhoneVerified: true,
        profile: { create: { fullName: params.fullName } },
        settings: { create: {} },
      },
      include: { profile: true },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  updatePhone(userId: string, phone: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { phone } });
  }

  async recordFailedLogin(userId: string, maxAttempts: number, lockoutMinutes: number) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
    });

    if (user.failedLoginCount >= maxAttempts) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() + lockoutMinutes * 60 * 1000),
        },
      });
    }
  }

  resetFailedLogins(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }
}
