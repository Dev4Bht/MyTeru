"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNu } from "@druksave/shared";
import { Plus, TrendingUp, TrendingDown, PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions, useTransactionSummary } from "@/lib/queries/use-transactions";
import { useBudgetPlan } from "@/lib/queries/use-budgets";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [isAdding, setIsAdding] = useState(false);

  const { data: summary } = useTransactionSummary();
  const { data: recent } = useTransactions({ pageSize: 5 });
  const { data: plan } = useBudgetPlan();

  const firstName = user?.fullName?.split(" ")[0];
  const hasPlan = plan && (plan.income.length > 0 || plan.allocations.length > 0);
  const unallocatedNu = plan ? Number(plan.totals.unallocatedNu) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-display text-sm italic text-muted-foreground">Kuzuzangpo{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Your money, this month</h1>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-lift">
        <div className="pattern-clouds pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">Balance</p>
          <p className="mt-1 font-tnum font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {summary ? formatNu(summary.balanceNu) : "—"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
                <TrendingUp className="h-3.5 w-3.5" />
                Income
              </div>
              <p className="mt-1 font-tnum text-lg font-semibold">
                {summary ? formatNu(summary.totalIncomeNu) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
                <TrendingDown className="h-3.5 w-3.5" />
                Expenses
              </div>
              <p className="mt-1 font-tnum text-lg font-semibold">
                {summary ? formatNu(summary.totalExpenseNu) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link href="/dashboard/budget">
        <Card className="transition-colors hover:bg-secondary/40 active:bg-secondary/60">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <PiggyBank className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              {hasPlan ? (
                <>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    {unallocatedNu >= 0 ? "Unallocated this month" : "Over-allocated by"}
                  </span>
                  <span
                    className={cn(
                      "block font-tnum text-base font-semibold",
                      unallocatedNu < 0 && "text-destructive",
                    )}
                  >
                    {formatNu(Math.abs(unallocatedNu))}
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-sm font-medium">Set up your monthly plan</span>
                  <span className="block text-xs text-muted-foreground">
                    Income, rent, savings — once, automatically.
                  </span>
                </>
              )}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Your last 5 entries</CardDescription>
          </div>
          <Button size="sm" variant="soft" onClick={() => setIsAdding(true)} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recent?.items ?? []} />
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
