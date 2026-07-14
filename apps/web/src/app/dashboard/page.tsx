"use client";

import { useState } from "react";
import { formatNu } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions, useTransactionSummary } from "@/lib/queries/use-transactions";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [isAdding, setIsAdding] = useState(false);

  const { data: summary } = useTransactionSummary();
  const { data: recent } = useTransactions({ pageSize: 5 });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <DashboardNav />

      <Card>
        <CardHeader>
          <CardTitle>Kuzuzangpo, {user?.fullName || "there"}</CardTitle>
          <CardDescription>Here&apos;s where your money stands this month.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Income</p>
            <p className="text-lg font-semibold text-emerald-600">
              {summary ? formatNu(summary.totalIncomeNu) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold text-destructive">
              {summary ? formatNu(summary.totalExpenseNu) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Balance</p>
            <p className="text-lg font-semibold">{summary ? formatNu(summary.balanceNu) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Your last 5 entries.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add transaction
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recent?.items ?? []} />
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
