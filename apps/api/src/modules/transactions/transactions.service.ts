import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  UpdateTransactionDto,
} from "./dto";

const TRANSACTION_INCLUDE = { category: true, merchant: true } as const;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.categoryId) {
      await this.assertCategoryOwned(userId, dto.categoryId);
    }

    const merchantId = dto.merchantName
      ? (await this.upsertMerchant(dto.merchantName)).id
      : undefined;

    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amountNu: dto.amountNu,
        categoryId: dto.categoryId,
        merchantId,
        description: dto.description,
        occurredAt: new Date(dto.occurredAt),
      },
      include: TRANSACTION_INCLUDE,
    });
  }

  async list(userId: string, query: ListTransactionsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.TransactionWhereInput = {
      userId,
      type: query.type,
      categoryId: query.categoryId,
      description: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
      occurredAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lt: query.to ? addDays(new Date(query.to), 1) : undefined,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: TRANSACTION_INCLUDE,
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOwnedOrThrow(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException("You cannot access another user's transaction");
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOwnedOrThrow(userId, id);
    if (dto.categoryId) {
      await this.assertCategoryOwned(userId, dto.categoryId);
    }

    const merchantId = dto.merchantName
      ? (await this.upsertMerchant(dto.merchantName)).id
      : undefined;

    return this.prisma.transaction.update({
      where: { id },
      data: {
        type: dto.type,
        amountNu: dto.amountNu,
        categoryId: dto.categoryId,
        merchantId,
        description: dto.description,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
      include: TRANSACTION_INCLUDE,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwnedOrThrow(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
  }

  async summary(userId: string, month?: string) {
    const { monthKey, start, end } = resolveMonthRange(month);

    const [income, expense, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: "INCOME", occurredAt: { gte: start, lt: end } },
        _sum: { amountNu: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", occurredAt: { gte: start, lt: end } },
        _sum: { amountNu: true },
      }),
      this.prisma.transaction.count({
        where: { userId, occurredAt: { gte: start, lt: end } },
      }),
    ]);

    const totalIncome = income._sum.amountNu ?? new Prisma.Decimal(0);
    const totalExpense = expense._sum.amountNu ?? new Prisma.Decimal(0);

    return {
      month: monthKey,
      totalIncomeNu: totalIncome.toString(),
      totalExpenseNu: totalExpense.toString(),
      balanceNu: totalIncome.sub(totalExpense).toString(),
      transactionCount,
    };
  }

  async categoryBreakdown(userId: string, month?: string) {
    const { monthKey, start, end } = resolveMonthRange(month);

    const rows = await this.prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: { userId, occurredAt: { gte: start, lt: end } },
      _sum: { amountNu: true },
    });

    const categoryIds = rows.map((row) => row.categoryId).filter((id): id is string => Boolean(id));
    const categories = categoryIds.length
      ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } } })
      : [];
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    const items = rows
      .map((row) => {
        const category = row.categoryId ? categoryById.get(row.categoryId) : undefined;
        return {
          categoryId: row.categoryId ?? "uncategorized",
          name: category?.name ?? "Uncategorized",
          icon: category?.icon ?? null,
          type: row.type,
          amountNu: (row._sum.amountNu ?? new Prisma.Decimal(0)).toString(),
        };
      })
      .sort((a, b) => Number(b.amountNu) - Number(a.amountNu));

    return { month: monthKey, items };
  }

  private async assertCategoryOwned(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    if (category.userId && category.userId !== userId) {
      throw new ForbiddenException("You cannot use another user's category");
    }
  }

  private async upsertMerchant(name: string) {
    const normalizedName = name.trim().toLowerCase();
    return this.prisma.merchant.upsert({
      where: { normalizedName },
      update: {},
      create: { name: name.trim(), normalizedName },
    });
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function resolveMonthRange(month?: string): { monthKey: string; start: Date; end: Date } {
  const now = new Date();
  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth() + 1;

  if (month) {
    const [yearPart, monthPart] = month.split("-");
    year = Number(yearPart);
    monthIndex = Number(monthPart);
  }

  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  const monthKey = `${year}-${String(monthIndex).padStart(2, "0")}`;

  return { monthKey, start, end };
}
