"use client";

import { useState } from "react";
import { formatNu } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { RecurringForm } from "@/components/recurring/recurring-form";
import {
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useUpdateRecurringTransaction,
} from "@/lib/queries/use-recurring-transactions";

export default function RecurringPage() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: recurring, isLoading } = useRecurringTransactions();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <DashboardNav />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recurring transactions</CardTitle>
            <CardDescription>Templates for salary, rent, and other regular income/expenses.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add recurring
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recurring && recurring.length > 0 ? (
            <ul className="divide-y divide-border">
              {recurring.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {item.description || (item.category ? item.category.name : "Untitled")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.frequency.toLowerCase()} · starts {new Date(item.startDate).toLocaleDateString("en-BT")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        item.type === "INCOME" ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {item.type === "INCOME" ? "+" : "-"}
                      {formatNu(item.amountNu)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateRecurring.mutate({ id: item.id, dto: { isActive: !item.isActive } })
                      }
                    >
                      {item.isActive ? "Pause" : "Resume"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRecurring.mutate(item.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recurring transactions yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add recurring transaction</DialogTitle>
          </DialogHeader>
          <RecurringForm onDone={() => setIsAdding(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
