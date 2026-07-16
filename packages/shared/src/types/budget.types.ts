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
