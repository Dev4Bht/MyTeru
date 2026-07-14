"use client";

import { useState } from "react";
import { ListTransactionsQueryDto, TransactionType } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/queries/use-transactions";

export default function TransactionsPage() {
  const [filters, setFilters] = useState<ListTransactionsQueryDto>({ page: 1, pageSize: 20 });
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useTransactions(filters);

  const setType = (type: TransactionType | undefined) => setFilters((f) => ({ ...f, type, page: 1 }));

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <DashboardNav />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Transactions</CardTitle>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add transaction
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={filters.type === undefined ? "default" : "outline"}
                onClick={() => setType(undefined)}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filters.type === "EXPENSE" ? "default" : "outline"}
                onClick={() => setType("EXPENSE")}
              >
                Expenses
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filters.type === "INCOME" ? "default" : "outline"}
                onClick={() => setType("INCOME")}
              >
                Income
              </Button>
            </div>

            <Input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))}
              className="w-auto"
            />
            <Input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))}
              className="w-auto"
            />
            <Input
              placeholder="Search description..."
              value={filters.search ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
              className="w-48"
            />
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <TransactionList transactions={data?.items ?? []} />
          )}

          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onDone={() => setIsAdding(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
