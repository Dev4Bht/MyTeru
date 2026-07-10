import { Injectable } from "@nestjs/common";
import { Prisma } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/** Write-only audit trail for security-relevant events (auth, devices). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  }
}
