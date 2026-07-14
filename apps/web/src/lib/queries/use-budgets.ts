import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BudgetPlanDto, SaveBudgetPlanDto } from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useBudgetPlan(month?: string) {
  return useQuery({
    queryKey: ["budget-plan", month ?? "current"],
    queryFn: () => apiFetch<BudgetPlanDto>("/budgets/plan", { params: { month } }),
  });
}

function useInvalidateBudgetPlan() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["budget-plan"] });
}

export function useSaveBudgetPlan() {
  const invalidate = useInvalidateBudgetPlan();
  return useMutation({
    mutationFn: (dto: SaveBudgetPlanDto) =>
      apiFetch<BudgetPlanDto>("/budgets/plan", { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}

export function useRemoveBudgetLine() {
  const invalidate = useInvalidateBudgetPlan();
  return useMutation({
    mutationFn: (budgetId: string) => apiFetch<void>(`/budgets/${budgetId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
