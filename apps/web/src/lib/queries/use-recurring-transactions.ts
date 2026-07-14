import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateRecurringTransactionDto,
  RecurringTransactionDto,
  UpdateRecurringTransactionDto,
} from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: () => apiFetch<RecurringTransactionDto[]>("/recurring-transactions"),
  });
}

function useInvalidateRecurring() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
}

export function useCreateRecurringTransaction() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (dto: CreateRecurringTransactionDto) =>
      apiFetch<RecurringTransactionDto>("/recurring-transactions", { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}

export function useUpdateRecurringTransaction() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecurringTransactionDto }) =>
      apiFetch<RecurringTransactionDto>(`/recurring-transactions/${id}`, { method: "PATCH", body: dto }),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurringTransaction() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/recurring-transactions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
