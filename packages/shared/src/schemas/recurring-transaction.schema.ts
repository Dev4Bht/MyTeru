import { z } from "zod";
import { transactionTypeSchema } from "./transaction.schema";

export const recurrenceFrequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const createRecurringTransactionSchema = z.object({
  type: transactionTypeSchema,
  amountNu: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  categoryId: z.string().uuid().optional(),
  description: z.string().trim().max(500).optional(),
  frequency: recurrenceFrequencySchema,
  startDate: z.string().min(1, "Select a start date"),
  endDate: z.string().optional(),
});
export type CreateRecurringTransactionDto = z.infer<typeof createRecurringTransactionSchema>;

export const updateRecurringTransactionSchema = createRecurringTransactionSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateRecurringTransactionDto = z.infer<typeof updateRecurringTransactionSchema>;
