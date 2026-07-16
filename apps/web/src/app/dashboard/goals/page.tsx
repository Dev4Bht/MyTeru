"use client";

import { useState } from "react";
import { formatNu } from "@druksave/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { useGoals } from "@/lib/queries/use-goals";

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const [isAdding, setIsAdding] = useState(false);

  const totalSaved = goals?.reduce((sum, g) => sum + Number(g.savedAmountNu), 0) ?? 0;
  const totalTarget = goals?.reduce((sum, g) => sum + Number(g.targetAmountNu), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">Save towards something specific.</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          New goal
        </Button>
      </div>

      {goals && goals.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-lift">
          <div className="pattern-clouds pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
              Total saved
            </p>
            <p className="mt-1 font-tnum font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {formatNu(totalSaved)}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              towards {formatNu(totalTarget)} across {goals.length} goal{goals.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading your goals...</p>
      ) : goals && goals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium">No goals yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create one for anything you&apos;re saving towards — a trip home for Losar, an emergency fund,
              a new phone.
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" />
              Create your first goal
            </Button>
          </CardContent>
        </Card>
      )}

      <Button
        size="fab"
        onClick={() => setIsAdding(true)}
        aria-label="New goal"
        className="fixed bottom-24 right-5 z-30 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>
          <GoalForm onDone={() => setIsAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
