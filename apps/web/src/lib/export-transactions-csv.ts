import { ListTransactionsQueryDto, PaginatedResult, TransactionDto } from "@druksave/shared";
import { apiFetch } from "@/lib/api-client";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Fetches every transaction matching the given filters (looping pages) and downloads it as CSV. */
export async function exportTransactionsCsv(filters: Omit<ListTransactionsQueryDto, "page" | "pageSize">) {
  const items: TransactionDto[] = [];
  const pageSize = 100;
  let page = 1;

  while (true) {
    const result = await apiFetch<PaginatedResult<TransactionDto>>("/transactions", {
      params: { ...filters, page, pageSize } as Record<string, string | number | undefined>,
    });
    items.push(...result.items);
    if (items.length >= result.total || result.items.length === 0) break;
    page += 1;
  }

  const header = ["Date", "Type", "Category", "Merchant", "Description", "Amount (Nu.)"];
  const rows = items.map((t) => [
    t.occurredAt.slice(0, 10),
    t.type,
    t.category?.name ?? "Uncategorized",
    t.merchantName ?? "",
    t.description ?? "",
    t.amountNu,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `druksave-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
