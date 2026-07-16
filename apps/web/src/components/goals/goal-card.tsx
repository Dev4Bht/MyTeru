"use client";

import { useState } from "react";
import { formatNu, GoalDto } from "@druksave/shared";
import { PartyPopper, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteGoal, useUpdateGoal } from "@/lib/queries/use-goals";
import { ContributionForm } from "./contribution-form";
import { cn } from "@/lib/utils";

function daysLeftLabel(targetDate: string | null): string | null {
  if (!targetDate) return null;
  const diffMs = new Date(targetDate).getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return "Past target date";
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function GoalCard({ goal }: { goal: GoalDto }) {
  const [isOpen, setIsOpen] = useState(false);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const target = Number(goal.targetAmountNu);
  const saved = Number(goal.savedAmountNu);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const isCompleted = goal.status === "COMPLETED";
  const isPaused = goal.status === "PAUSED";
  const daysLeft = daysLeftLabel(goal.targetDate);

  return (
    <>
      <Card className={cn(isPaused && "opacity-60")}>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{goal.name}</p>
                {isCompleted && <Badge variant="success">Complete</Badge>}
                {isPaused && <Badge variant="outline">Paused</Badge>}
              </div>
              <p className="font-tnum text-sm text-muted-foreground">
                {formatNu(saved)} of {formatNu(target)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isCompleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isPaused ? "Resume" : "Pause"}
                  onClick={() =>
                    updateGoal.mutate({ id: goal.id, dto: { status: isPaused ? "ACTIVE" : "PAUSED" } })
                  }
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete goal"
                className="hover:bg-destructive/10 hover:text-destructive"
                onClick={() => deleteGoal.mutate(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full", isCompleted ? "bg-success" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{pct.toFixed(0)}% saved{daysLeft ? ` · ${daysLeft}` : ""}</span>
            <Button variant="soft" size="sm" onClick={() => setIsOpen(true)}>
              {isCompleted ? (
                "View activity"
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add money
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{goal.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {!isCompleted && <ContributionForm goalId={goal.id} onDone={() => setIsOpen(false)} />}

            {goal.contributions.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent activity
                </p>
                <ul className="max-h-48 divide-y divide-border overflow-y-auto">
                  {goal.contributions.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="min-w-0 truncate text-muted-foreground">
                        {c.note || new Date(c.contributedAt).toLocaleDateString("en-BT", { day: "numeric", month: "short" })}
                      </span>
                      <span className="font-tnum font-medium text-success">+{formatNu(c.amountNu)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isCompleted && (
              <p className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <PartyPopper className="h-4 w-4" />
                Goal reached — well done!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
