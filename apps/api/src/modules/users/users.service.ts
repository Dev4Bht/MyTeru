import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GoogleProfile } from "../auth/google-auth.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId }, include: { profile: true } });
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

  /** Finds the user for a verified Google profile, creating one on first sign-in. */
  async findOrCreateFromGoogle(profile: GoogleProfile) {
    const existing = await this.findByGoogleId(profile.googleId);
    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        profile: {
          create: {
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
          },
        },
        settings: { create: {} },
      },
      include: { profile: true },
    });
  }

  recordLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
