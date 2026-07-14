import { z } from "zod";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amountNu: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  categoryId: z.string().uuid().optional(),
  merchantName: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  occurredAt: z.string().min(1, "Select a date"),
});
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.partial();
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().trim().max(200).optional(),
});
export type ListTransactionsQueryDto = z.infer<typeof listTransactionsQuerySchema>;
