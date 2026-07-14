import { CategoryDto } from "./transaction.types";

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export interface BudgetDto {
  id: string;
  categoryId: string | null;
  category: CategoryDto | null;
  period: BudgetPeriod;
  limitNu: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One resolved line of the current month's plan, with actuals from real transactions. */
export interface BudgetPlanLineDto {
  budgetId: string;
  categoryId: string;
  name: string;
  icon: string | null;
  plannedNu: string;
  actualNu: string;
  remainingNu: string;
  autoPost: boolean;
}

export interface BudgetPlanDto {
  month: string; // YYYY-MM
  income: BudgetPlanLineDto[];
  allocations: BudgetPlanLineDto[];
  totals: {
    plannedIncomeNu: string;
    actualIncomeNu: string;
    plannedAllocatedNu: string;
    actualSpentNu: string;
    unallocatedNu: string;
  };
}
