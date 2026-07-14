import { RecurringTransactionDto } from "@druksave/shared";
import { Category, RecurringTransaction } from "@druksave/database";
import { toCategoryDto } from "../categories/categories.mapper";

type RecurringTransactionWithRelations = RecurringTransaction & {
  category: Category | null;
};

export function toRecurringTransactionDto(
  recurring: RecurringTransactionWithRelations,
): RecurringTransactionDto {
  return {
    id: recurring.id,
    type: recurring.type,
    amountNu: recurring.amountNu.toString(),
    categoryId: recurring.categoryId,
    category: recurring.category ? toCategoryDto(recurring.category) : null,
    description: recurring.description,
    frequency: recurring.frequency,
    startDate: recurring.startDate.toISOString(),
    endDate: recurring.endDate?.toISOString() ?? null,
    nextRunAt: recurring.nextRunAt.toISOString(),
    isActive: recurring.isActive,
    createdAt: recurring.createdAt.toISOString(),
    updatedAt: recurring.updatedAt.toISOString(),
  };
}
