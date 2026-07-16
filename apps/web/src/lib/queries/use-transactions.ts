import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CategoryBreakdownDto,
  CreateTransactionDto,
  ListTransactionsQueryDto,
  PaginatedResult,
  TransactionDto,
  TransactionSummaryDto,
  UpdateTransactionDto,
} from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useTransactions(filters: ListTransactionsQueryDto = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      apiFetch<PaginatedResult<TransactionDto>>("/transactions", {
        params: filters as Record<string, string | number | undefined>,
      }),
  });
}

export function useTransactionSummary(month?: string) {
  return useQuery({
    queryKey: ["transactions", "summary", month],
    queryFn: () => apiFetch<TransactionSummaryDto>("/transactions/summary", { params: { month } }),
  });
}

export function useCategoryBreakdown(month?: string) {
  return useQuery({
    queryKey: ["transactions", "breakdown", month],
    queryFn: () => apiFetch<CategoryBreakdownDto>("/transactions/breakdown", { params: { month } }),
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["transactions"] });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (dto: CreateTransactionDto) =>
      apiFetch<TransactionDto>("/transactions", { method: "POST", body: dto }),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      apiFetch<TransactionDto>(`/transactions/${id}`, { method: "PATCH", body: dto }),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
