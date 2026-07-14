import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BudgetPlanDto, BudgetPlanLineDto } from "@druksave/shared";
import { Prisma, TransactionType } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import { RecurringTransactionsService } from "../recurring-transactions/recurring-transactions.service";
import { SaveBudgetPlanDto } from "./dto";
import { BudgetPlanLineDto as BudgetPlanLineInput } from "./dto/budget-plan-line.dto";

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

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurringTransactionsService: RecurringTransactionsService,
  ) {}

  async getPlan(userId: string, month?: string): Promise<BudgetPlanDto> {
    const { monthKey, start, end } = resolveMonthRange(month);

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        period: "MONTHLY",
        startDate: { lt: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    const categoryIds = budgets
      .map((budget) => budget.categoryId)
      .filter((id): id is string => Boolean(id));

    const [actuals, recurrings] = await Promise.all([
      categoryIds.length
        ? this.prisma.transaction.groupBy({
            by: ["categoryId"],
            where: { userId, categoryId: { in: categoryIds }, occurredAt: { gte: start, lt: end } },
            _sum: { amountNu: true },
          })
        : Promise.resolve([]),
      categoryIds.length
        ? this.prisma.recurringTransaction.findMany({
            where: { userId, categoryId: { in: categoryIds }, frequency: "MONTHLY", isActive: true },
          })
        : Promise.resolve([]),
    ]);

    const actualByCategory = new Map(
      actuals.map((row) => [row.categoryId as string, row._sum.amountNu ?? ZERO]),
    );
    const autoPostCategories = new Set(recurrings.map((r) => r.categoryId));

    const income: BudgetPlanLineDto[] = [];
    const allocations: BudgetPlanLineDto[] = [];

    for (const budget of budgets) {
      if (!budget.categoryId || !budget.category) continue;

      const plannedNu = budget.limitNu;
      const actualNu = actualByCategory.get(budget.categoryId) ?? ZERO;

      const line: BudgetPlanLineDto = {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        name: budget.category.name,
        icon: budget.category.icon ?? null,
        plannedNu: plannedNu.toString(),
        actualNu: actualNu.toString(),
        remainingNu: plannedNu.sub(actualNu).toString(),
        autoPost: autoPostCategories.has(budget.categoryId),
      };

      if (budget.category.type === "INCOME") {
        income.push(line);
      } else {
        allocations.push(line);
      }
    }

    const sumPlanned = (lines: BudgetPlanLineDto[]) =>
      lines.reduce((acc, line) => acc.add(new Prisma.Decimal(line.plannedNu)), ZERO);
    const sumActual = (lines: BudgetPlanLineDto[]) =>
      lines.reduce((acc, line) => acc.add(new Prisma.Decimal(line.actualNu)), ZERO);

    const plannedIncomeNu = sumPlanned(income);
    const actualIncomeNu = sumActual(income);
    const plannedAllocatedNu = sumPlanned(allocations);
    const actualSpentNu = sumActual(allocations);

    return {
      month: monthKey,
      income,
      allocations,
      totals: {
        plannedIncomeNu: plannedIncomeNu.toString(),
        actualIncomeNu: actualIncomeNu.toString(),
        plannedAllocatedNu: plannedAllocatedNu.toString(),
        actualSpentNu: actualSpentNu.toString(),
        unallocatedNu: plannedIncomeNu.sub(plannedAllocatedNu).toString(),
      },
    };
  }

  async savePlan(userId: string, dto: SaveBudgetPlanDto): Promise<BudgetPlanDto> {
    const { start: monthStart } = resolveMonthRange();

    for (const line of dto.income) {
      await this.saveLine(userId, "INCOME", line, monthStart);
    }
    for (const line of dto.allocations) {
      await this.saveLine(userId, "EXPENSE", line, monthStart);
    }

    return this.getPlan(userId);
  }

  async removeLine(userId: string, budgetId: string): Promise<void> {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) {
      throw new NotFoundException("Budget line not found");
    }
    if (budget.userId !== userId) {
      throw new ForbiddenException("You cannot modify another user's budget");
    }

    if (budget.categoryId) {
      const recurring = await this.prisma.recurringTransaction.findFirst({
        where: { userId, categoryId: budget.categoryId, frequency: "MONTHLY", isActive: true },
      });
      if (recurring) {
        await this.prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
      }
    }

    await this.prisma.budget.delete({ where: { id: budgetId } });
  }

  private async saveLine(
    userId: string,
    type: TransactionType,
    line: BudgetPlanLineInput,
    monthStart: Date,
  ): Promise<void> {
    const category = await this.resolveCategory(userId, type, line);
    await this.upsertBudgetRow(userId, category.id, line.amountNu, monthStart, line.budgetId);
    await this.syncRecurring(userId, type, category.id, line.name, line.amountNu, line.autoPost, monthStart);
  }

  private async resolveCategory(userId: string, type: TransactionType, line: BudgetPlanLineInput) {
    if (line.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: line.categoryId } });
      if (!category) {
        throw new NotFoundException(`Category not found for "${line.name}"`);
      }
      if (category.userId && category.userId !== userId) {
        throw new ForbiddenException(`You cannot use another user's category for "${line.name}"`);
      }
      return category;
    }

    const existing = await this.prisma.category.findFirst({
      where: { type, OR: [{ userId }, { userId: null }], name: { equals: line.name, mode: "insensitive" } },
    });
    if (existing) return existing;

    return this.prisma.category.create({
      data: { userId, name: line.name, type, icon: line.icon },
    });
  }

  private async upsertBudgetRow(
    userId: string,
    categoryId: string,
    limitNu: number,
    monthStart: Date,
    budgetId?: string,
  ) {
    if (budgetId) {
      const existing = await this.prisma.budget.findUnique({ where: { id: budgetId } });
      if (existing && existing.userId === userId) {
        return this.prisma.budget.update({ where: { id: budgetId }, data: { categoryId, limitNu } });
      }
    }

    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId, period: "MONTHLY", endDate: null },
    });
    if (existing) {
      return this.prisma.budget.update({ where: { id: existing.id }, data: { limitNu } });
    }

    return this.prisma.budget.create({
      data: { userId, categoryId, period: "MONTHLY", limitNu, startDate: monthStart },
    });
  }

  private async syncRecurring(
    userId: string,
    type: TransactionType,
    categoryId: string,
    name: string,
    amountNu: number,
    autoPost: boolean,
    monthStart: Date,
  ): Promise<void> {
    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { userId, categoryId, frequency: "MONTHLY" },
    });

    if (!autoPost) {
      if (existing && existing.isActive) {
        await this.prisma.recurringTransaction.update({ where: { id: existing.id }, data: { isActive: false } });
      }
      return;
    }

    if (existing) {
      await this.prisma.recurringTransaction.update({
        where: { id: existing.id },
        data: { amountNu, description: name, isActive: true },
      });
      await this.recurringTransactionsService.materializeNow(existing.id);
      return;
    }

    const created = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        type,
        categoryId,
        amountNu,
        description: name,
        frequency: "MONTHLY",
        startDate: monthStart,
        nextRunAt: monthStart,
      },
    });
    await this.recurringTransactionsService.materializeNow(created.id);
  }
}
