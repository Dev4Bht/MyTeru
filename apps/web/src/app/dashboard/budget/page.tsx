"use client";

import { useEffect, useState } from "react";
import { formatNu } from "@druksave/shared";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlanLineDraft, PlanLineRow } from "@/components/budget/plan-line-row";
import { useBudgetPlan, useRemoveBudgetLine, useSaveBudgetPlan } from "@/lib/queries/use-budgets";

const ALLOCATION_PRESETS = [
  { name: "Rent", icon: "🏠" },
  { name: "Transportation", icon: "🚌" },
  { name: "Outing", icon: "🎉" },
  { name: "Family", icon: "👨‍👩‍👧" },
  { name: "Self Free Spending", icon: "🧘" },
  { name: "Saving", icon: "💰" },
];

function toDrafts(lines: { budgetId: string; categoryId: string; name: string; icon: string | null; plannedNu: string; actualNu: string; autoPost: boolean }[]): PlanLineDraft[] {
  return lines.map((line) => ({
    budgetId: line.budgetId,
    categoryId: line.categoryId,
    name: line.name,
    icon: line.icon ?? undefined,
    amountNu: line.plannedNu,
    autoPost: line.autoPost,
    actualNu: line.actualNu,
  }));
}

export default function BudgetPlanPage() {
  const { data: plan, isLoading } = useBudgetPlan();
  const saveMutation = useSaveBudgetPlan();
  const removeLine = useRemoveBudgetLine();

  const [income, setIncome] = useState<PlanLineDraft[]>([]);
  const [allocations, setAllocations] = useState<PlanLineDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (plan && !hydrated) {
      setIncome(toDrafts(plan.income));
      setAllocations(toDrafts(plan.allocations));
      setHydrated(true);
    }
  }, [plan, hydrated]);

  const plannedIncome = income.reduce((sum, r) => sum + (Number(r.amountNu) || 0), 0);
  const plannedAllocated = allocations.reduce((sum, r) => sum + (Number(r.amountNu) || 0), 0);
  const unallocated = plannedIncome - plannedAllocated;

  const presetsAvailable = ALLOCATION_PRESETS.filter(
    (preset) => !allocations.some((row) => row.name.trim().toLowerCase() === preset.name.toLowerCase()),
  );

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<PlanLineDraft[]>>,
    index: number,
    patch: Partial<PlanLineDraft>,
  ) => setter((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeRow = (
    setter: React.Dispatch<React.SetStateAction<PlanLineDraft[]>>,
    index: number,
    row: PlanLineDraft,
  ) => {
    if (row.budgetId) removeLine.mutate(row.budgetId);
    setter((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const toPayload = (rows: PlanLineDraft[]) =>
      rows
        .filter((r) => r.name.trim() && Number(r.amountNu) > 0)
        .map((r) => ({
          budgetId: r.budgetId,
          categoryId: r.categoryId,
          name: r.name.trim(),
          icon: r.icon,
          amountNu: Number(r.amountNu),
          autoPost: r.autoPost,
        }));

    const result = await saveMutation.mutateAsync({
      income: toPayload(income),
      allocations: toPayload(allocations),
    });

    setIncome(toDrafts(result.income));
    setAllocations(toDrafts(result.allocations));
  };

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading your plan...</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Monthly plan</h1>
        <p className="text-sm text-muted-foreground">
          Set your income once — we&apos;ll draw every allocation from it and post the fixed ones for you.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-lift">
        <div className="pattern-clouds pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
            {unallocated >= 0 ? "Unallocated" : "Over-allocated by"}
          </p>
          <p className="mt-1 font-tnum font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatNu(Math.abs(unallocated))}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Planned income</p>
              <p className="mt-1 font-tnum text-lg font-semibold">{formatNu(plannedIncome)}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Allocated</p>
              <p className="mt-1 font-tnum text-lg font-semibold">{formatNu(plannedAllocated)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income</CardTitle>
          <CardDescription>Salary and any other regular income, all drawn from the same pool.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {income.map((row, i) => (
            <PlanLineRow
              key={row.budgetId ?? `new-income-${i}`}
              line={row}
              tone="income"
              onChange={(patch) => updateRow(setIncome, i, patch)}
              onRemove={() => removeRow(setIncome, i, row)}
            />
          ))}
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="self-start"
            onClick={() =>
              setIncome((rows) => [...rows, { name: "", amountNu: "", autoPost: true, icon: "💵" }])
            }
          >
            <Plus className="h-4 w-4" />
            Add income source
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allocations</CardTitle>
          <CardDescription>Fixed amounts for rent, transport, saving, and everyday spending.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {presetsAvailable.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presetsAvailable.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    setAllocations((rows) => [
                      ...rows,
                      { name: preset.name, icon: preset.icon, amountNu: "", autoPost: false },
                    ])
                  }
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                >
                  <span>{preset.icon}</span>
                  {preset.name}
                  <Plus className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {allocations.map((row, i) => (
            <PlanLineRow
              key={row.budgetId ?? `new-allocation-${i}`}
              line={row}
              tone="expense"
              onChange={(patch) => updateRow(setAllocations, i, patch)}
              onRemove={() => removeRow(setAllocations, i, row)}
            />
          ))}
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="self-start"
            onClick={() => setAllocations((rows) => [...rows, { name: "", amountNu: "", autoPost: false }])}
          >
            <Plus className="h-4 w-4" />
            Add allocation
          </Button>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full shadow-lift md:w-auto md:self-center md:px-12"
        onClick={handleSave}
        disabled={saveMutation.isPending}
      >
        <Wallet className="h-4 w-4" />
        {saveMutation.isPending ? "Saving..." : "Save my plan"}
      </Button>
    </div>
  );
}
