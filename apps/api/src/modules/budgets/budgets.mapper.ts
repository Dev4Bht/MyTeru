import { BudgetDto } from "@druksave/shared";
import { Budget, Category } from "@druksave/database";
import { toCategoryDto } from "../categories/categories.mapper";

type BudgetWithRelations = Budget & { category: Category | null };

export function toBudgetDto(budget: BudgetWithRelations): BudgetDto {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    category: budget.category ? toCategoryDto(budget.category) : null,
    period: budget.period,
    limitNu: budget.limitNu.toString(),
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate?.toISOString() ?? null,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}
