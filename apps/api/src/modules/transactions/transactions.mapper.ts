import { TransactionDto } from "@druksave/shared";
import { Category, Merchant, Transaction } from "@druksave/database";
import { toCategoryDto } from "../categories/categories.mapper";

type TransactionWithRelations = Transaction & {
  category: Category | null;
  merchant: Merchant | null;
};

export function toTransactionDto(transaction: TransactionWithRelations): TransactionDto {
  return {
    id: transaction.id,
    type: transaction.type,
    amountNu: transaction.amountNu.toString(),
    categoryId: transaction.categoryId,
    category: transaction.category ? toCategoryDto(transaction.category) : null,
    merchantName: transaction.merchant?.name ?? null,
    description: transaction.description,
    occurredAt: transaction.occurredAt.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
