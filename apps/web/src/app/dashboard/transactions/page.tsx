"use client";

import { useState } from "react";
import { ListTransactionsQueryDto, TransactionType } from "@druksave/shared";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/queries/use-transactions";

const TYPE_OPTIONS = [
  { label: "All", value: "ALL" as const },
  { label: "Expenses", value: "EXPENSE" as const },
  { label: "Income", value: "INCOME" as const },
];

export default function TransactionsPage() {
  const [filters, setFilters] = useState<ListTransactionsQueryDto>({ page: 1, pageSize: 20 });
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useTransactions(filters);

  const setType = (type: TransactionType | "ALL") =>
    setFilters((f) => ({ ...f, type: type === "ALL" ? undefined : type, page: 1 }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Transactions</h1>
        <Button size="sm" onClick={() => setIsAdding(true)} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={filters.type ?? "ALL"}
            onChange={setType}
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search description or merchant..."
              value={filters.search ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={filters.from ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))}
              className="flex-1"
            />
            <Input
              type="date"
              aria-label="To date"
              value={filters.to ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <TransactionList transactions={data?.items ?? []} />
          )}

          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
              <span>
                Page {data.page} of {Math.ceil(data.total / data.pageSize)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page * data.pageSize >= data.total}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        size="fab"
        onClick={() => setIsAdding(true)}
        aria-label="Add transaction"
        className="fixed bottom-24 right-5 z-30 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onDone={() => setIsAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
