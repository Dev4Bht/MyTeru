import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateGoalContributionDto, CreateGoalDto, GoalDto, UpdateGoalDto } from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => apiFetch<GoalDto[]>("/goals"),
  });
}

function useInvalidateGoals() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["goals"] });
}

export function useCreateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (dto: CreateGoalDto) => apiFetch<GoalDto>("/goals", { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGoalDto }) =>
      apiFetch<GoalDto>(`/goals/${id}`, { method: "PATCH", body: dto }),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/goals/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useAddGoalContribution() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateGoalContributionDto }) =>
      apiFetch<GoalDto>(`/goals/${id}/contributions`, { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}
