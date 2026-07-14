import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RecurrenceFrequency, RecurringTransaction } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import { CreateRecurringTransactionDto, UpdateRecurringTransactionDto } from "./dto";

const RECURRING_INCLUDE = { category: true } as const;

/** Safety cap on how many missed cycles a single recurring template will back-post in one pass. */
const MAX_CATCH_UP_CYCLES = 36;

function advanceDate(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: RECURRING_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    const recurring = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        type: dto.type,
        amountNu: dto.amountNu,
        categoryId: dto.categoryId,
        description: dto.description,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        nextRunAt: new Date(dto.startDate),
      },
    });

    await this.materialize(recurring);

    return this.prisma.recurringTransaction.findUniqueOrThrow({
      where: { id: recurring.id },
      include: RECURRING_INCLUDE,
    });
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    await this.findOwnedOrThrow(userId, id);

    const nextRunAt = dto.startDate ? new Date(dto.startDate) : undefined;

    const recurring = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        type: dto.type,
        amountNu: dto.amountNu,
        categoryId: dto.categoryId,
        description: dto.description,
        frequency: dto.frequency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
        nextRunAt,
      },
    });

    if (recurring.isActive) {
      await this.materialize(recurring);
    }

    return this.prisma.recurringTransaction.findUniqueOrThrow({
      where: { id },
      include: RECURRING_INCLUDE,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwnedOrThrow(userId, id);
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }

  /** Runs hourly: posts a real transaction for every recurring template whose schedule has come due. */
  @Cron(CronExpression.EVERY_HOUR)
  async processDue(): Promise<void> {
    const due = await this.prisma.recurringTransaction.findMany({
      where: { isActive: true, nextRunAt: { lte: new Date() } },
    });

    for (const recurring of due) {
      try {
        await this.materialize(recurring);
      } catch (error) {
        this.logger.error(`Failed to materialize recurring transaction ${recurring.id}`, error as Error);
      }
    }
  }

  /**
   * Posts one real Transaction per elapsed cycle between a recurring template's
   * nextRunAt and now (capped), then advances nextRunAt past "now". This is what
   * turns a recurring template into an actual automatic transaction, rather than
   * an inert row nothing ever reads.
   */
  private async materialize(recurring: RecurringTransaction): Promise<void> {
    const now = new Date();
    let cursor = recurring.nextRunAt;
    let cycles = 0;

    while (cursor.getTime() <= now.getTime() && cycles < MAX_CATCH_UP_CYCLES) {
      if (recurring.endDate && cursor.getTime() > recurring.endDate.getTime()) {
        await this.prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
        return;
      }

      await this.prisma.transaction.create({
        data: {
          userId: recurring.userId,
          type: recurring.type,
          amountNu: recurring.amountNu,
          categoryId: recurring.categoryId,
          description: recurring.description,
          source: "RECURRING",
          recurringId: recurring.id,
          occurredAt: cursor,
        },
      });

      cursor = advanceDate(cursor, recurring.frequency);
      cycles += 1;
    }

    if (cycles > 0) {
      await this.prisma.recurringTransaction.update({
        where: { id: recurring.id },
        data: { nextRunAt: cursor },
      });
    }
  }

  /** Immediately posts any due cycles for one template — used when budget automation just turned autoPost on. */
  async materializeNow(id: string): Promise<void> {
    const recurring = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (recurring && recurring.isActive) {
      await this.materialize(recurring);
    }
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const recurring = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!recurring) {
      throw new NotFoundException("Recurring transaction not found");
    }
    if (recurring.userId !== userId) {
      throw new ForbiddenException("You cannot access another user's recurring transaction");
    }
    return recurring;
  }
}
