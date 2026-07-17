"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNu } from "@druksave/shared";
import { Plus, TrendingUp, TrendingDown, PiggyBank, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useCategoryBreakdown, useTransactions, useTransactionSummary } from "@/lib/queries/use-transactions";
import { useBudgetPlan } from "@/lib/queries/use-budgets";
import { useGoals } from "@/lib/queries/use-goals";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [isAdding, setIsAdding] = useState(false);

  const { data: summary } = useTransactionSummary();
  const { data: recent } = useTransactions({ pageSize: 5 });
  const { data: plan } = useBudgetPlan();
  const { data: breakdown } = useCategoryBreakdown();
  const { data: goals } = useGoals();

  const firstName = user?.fullName?.split(" ")[0];
  const hasPlan = plan && (plan.income.length > 0 || plan.allocations.length > 0);
  const unallocatedNu = plan ? Number(plan.totals.unallocatedNu) : 0;

  const topExpenses = (breakdown?.items ?? [])
    .filter((item) => item.type === "EXPENSE")
    .slice(0, 5);
  const topExpensesTotal = topExpenses.reduce((sum, item) => sum + Number(item.amountNu), 0);

  const activeGoals = (goals ?? []).filter((g) => g.status !== "CANCELLED");
  const goalsSaved = activeGoals.reduce((sum, g) => sum + Number(g.savedAmountNu), 0);
  const goalsTarget = activeGoals.reduce((sum, g) => sum + Number(g.targetAmountNu), 0);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/dashboard/budget">
          <Card className="h-full transition-colors hover:bg-secondary/40 active:bg-secondary/60">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <PiggyBank className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                {hasPlan ? (
                  <>
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                      {unallocatedNu >= 0 ? "Left to allocate" : "Over-allocated by"}
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
                    <span className="block text-xs text-muted-foreground">Income, rent, savings — automatically.</span>
                  </>
                )}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/goals">
          <Card className="h-full transition-colors hover:bg-secondary/40 active:bg-secondary/60">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Target className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                {activeGoals.length > 0 ? (
                  <>
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                      Saved towards goals
                    </span>
                    <span className="block font-tnum text-base font-semibold">
                      {formatNu(goalsSaved)}
                      <span className="text-xs font-normal text-muted-foreground"> of {formatNu(goalsTarget)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm font-medium">Start a savings goal</span>
                    <span className="block text-xs text-muted-foreground">A trip home, an emergency fund.</span>
                  </>
                )}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {topExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where your money went</CardTitle>
            <CardDescription>Top spending categories this month</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topExpenses.map((item) => {
              const amount = Number(item.amountNu);
              const pct = topExpensesTotal > 0 ? (amount / topExpensesTotal) * 100 : 0;
              return (
                <div key={item.categoryId} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm text-destructive">
                    {item.icon || "↑"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 font-tnum text-muted-foreground">{formatNu(amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-destructive/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
