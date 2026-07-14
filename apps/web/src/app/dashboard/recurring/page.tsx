"use client";

import { useState } from "react";
import { formatNu } from "@druksave/shared";
import { Plus, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecurringForm } from "@/components/recurring/recurring-form";
import {
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useUpdateRecurringTransaction,
} from "@/lib/queries/use-recurring-transactions";
import { cn } from "@/lib/utils";

export default function RecurringPage() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: recurring, isLoading } = useRecurringTransactions();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Recurring</h1>
          <p className="text-sm text-muted-foreground">Salary, rent, and other regulars.</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading...</p>
          ) : recurring && recurring.length > 0 ? (
            <ul className="divide-y divide-border">
              {recurring.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.description || (item.category ? item.category.name : "Untitled")}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant={item.isActive ? "success" : "default"} className="capitalize">
                        {item.frequency.toLowerCase()}
                      </Badge>
                      starts {new Date(item.startDate).toLocaleDateString("en-BT", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={cn(
                        "mr-1 font-tnum text-sm font-semibold",
                        item.type === "INCOME" ? "text-success" : "text-foreground",
                      )}
                    >
                      {item.type === "INCOME" ? "+" : "-"}
                      {formatNu(item.amountNu)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={item.isActive ? "Pause" : "Resume"}
                      onClick={() => updateRecurring.mutate({ id: item.id, dto: { isActive: !item.isActive } })}
                    >
                      {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteRecurring.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No recurring transactions yet.</p>
          )}
        </CardContent>
      </Card>

      <Button
        size="fab"
        onClick={() => setIsAdding(true)}
        aria-label="Add recurring transaction"
        className="fixed bottom-24 right-5 z-30 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add recurring transaction</DialogTitle>
          </DialogHeader>
          <RecurringForm onDone={() => setIsAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
