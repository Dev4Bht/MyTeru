import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { profile: true } });
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

  create(params: { email: string; passwordHash: string; fullName: string }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        profile: { create: { fullName: params.fullName } },
        settings: { create: {} },
      },
      include: { profile: true },
    });
  }

  async recordFailedLogin(userId: string, maxAttempts: number, lockoutMinutes: number) {
    // A single atomic UPDATE — incrementing the count and conditionally
    // setting lockedUntil in one statement avoids a race where concurrent
    // failed attempts could each read a pre-increment count and skip locking.
    await this.prisma.$executeRaw`
      UPDATE "users"
      SET
        "failedLoginCount" = "failedLoginCount" + 1,
        "lockedUntil" = CASE
          WHEN "failedLoginCount" + 1 >= ${maxAttempts}
          THEN ${new Date(Date.now() + lockoutMinutes * 60 * 1000)}
          ELSE "lockedUntil"
        END
      WHERE "id" = ${userId}
    `;
  }

  resetFailedLogins(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }
}
