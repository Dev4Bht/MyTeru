import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryDto, CreateCategoryDto, TransactionType } from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => apiFetch<CategoryDto[]>("/categories", { params: { type } }),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) =>
      apiFetch<CategoryDto>("/categories", { method: "POST", body: dto }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
