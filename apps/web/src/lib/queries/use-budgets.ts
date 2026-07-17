import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BudgetPlanDto, SaveBudgetPlanDto } from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useBudgetPlan(month?: string) {
  return useQuery({
    queryKey: ["budget-plan", month ?? "current"],
    queryFn: () => apiFetch<BudgetPlanDto>("/budgets/plan", { params: { month } }),
  });
}

// Saving or removing a plan line can create, update, or pause a real
// RecurringTransaction and materialize an actual Transaction (income posts
// immediately; auto-post allocations do too) — so every screen showing a
// balance, recent activity, or the recurring list needs to refetch, not
// just the plan itself.
function useInvalidatePlanAndMoney() {
  const queryClient = useQueryClient();
  return () =>
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["budget-plan"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] }),
    ]);
}

export function useSaveBudgetPlan() {
  const invalidate = useInvalidatePlanAndMoney();
  return useMutation({
    mutationFn: (dto: SaveBudgetPlanDto) =>
      apiFetch<BudgetPlanDto>("/budgets/plan", { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}

export function useRemoveBudgetLine() {
  const invalidate = useInvalidatePlanAndMoney();
  return useMutation({
    mutationFn: (budgetId: string) => apiFetch<void>(`/budgets/${budgetId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
