import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createPrismaClientOptions, PrismaClient } from "@druksave/database";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super(createPrismaClientOptions());
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Connected to PostgreSQL via Prisma");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
