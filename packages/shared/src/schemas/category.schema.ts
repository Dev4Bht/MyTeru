import { z } from "zod";
import { transactionTypeSchema } from "./transaction.schema";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Enter a category name").max(60),
  type: transactionTypeSchema,
  icon: z.string().trim().max(10).optional(),
  color: z.string().trim().max(20).optional(),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
