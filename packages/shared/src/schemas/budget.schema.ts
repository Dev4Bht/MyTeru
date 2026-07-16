import { z } from "zod";

/** One line in a monthly plan — either an income source or a spending allocation. */
export const budgetPlanLineInputSchema = z.object({
  budgetId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Give it a name").max(60),
  icon: z.string().trim().max(10).optional(),
  amountNu: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  autoPost: z.boolean().default(false),
});
export type BudgetPlanLineInputDto = z.infer<typeof budgetPlanLineInputSchema>;

export const saveBudgetPlanSchema = z.object({
  income: z.array(budgetPlanLineInputSchema).max(20),
  allocations: z.array(budgetPlanLineInputSchema).max(40),
});
export type SaveBudgetPlanDto = z.infer<typeof saveBudgetPlanSchema>;
