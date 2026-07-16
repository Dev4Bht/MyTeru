import { z } from "zod";

export const goalStatusSchema = z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]);

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, "Give your goal a name").max(80),
  targetAmountNu: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  targetDate: z.string().optional(),
});
export type CreateGoalDto = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema.partial().extend({ status: goalStatusSchema.optional() });
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;

export const createGoalContributionSchema = z.object({
  amountNu: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  note: z.string().trim().max(200).optional(),
});
export type CreateGoalContributionDto = z.infer<typeof createGoalContributionSchema>;
