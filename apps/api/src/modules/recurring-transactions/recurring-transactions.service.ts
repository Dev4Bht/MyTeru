import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateRecurringTransactionDto, UpdateRecurringTransactionDto } from "./dto";

const RECURRING_INCLUDE = { category: true } as const;

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: RECURRING_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, dto: CreateRecurringTransactionDto) {
    return this.prisma.recurringTransaction.create({
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
      include: RECURRING_INCLUDE,
    });
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    await this.findOwnedOrThrow(userId, id);

    const nextRunAt = dto.startDate ? new Date(dto.startDate) : undefined;

    return this.prisma.recurringTransaction.update({
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
      include: RECURRING_INCLUDE,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwnedOrThrow(userId, id);
    await this.prisma.recurringTransaction.delete({ where: { id } });
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
