export type TransactionType = "INCOME" | "EXPENSE";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface CategoryDto {
  id: string;
  userId: string | null;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
}

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amountNu: string;
  categoryId: string | null;
  category: CategoryDto | null;
  merchantName: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummaryDto {
  month: string; // YYYY-MM
  totalIncomeNu: string;
  totalExpenseNu: string;
  balanceNu: string;
  transactionCount: number;
}

export interface RecurringTransactionDto {
  id: string;
  type: TransactionType;
  amountNu: string;
  categoryId: string | null;
  category: CategoryDto | null;
  description: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryBreakdownItemDto {
  categoryId: string;
  name: string;
  icon: string | null;
  type: TransactionType;
  amountNu: string;
}

export interface CategoryBreakdownDto {
  month: string; // YYYY-MM
  items: CategoryBreakdownItemDto[];
}
