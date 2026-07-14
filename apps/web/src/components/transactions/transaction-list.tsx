"use client";

import { useState } from "react";
import { formatNu, TransactionDto } from "@druksave/shared";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteTransaction } from "@/lib/queries/use-transactions";
import { cn } from "@/lib/utils";
import { TransactionForm } from "./transaction-form";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-BT", { day: "numeric", month: "short" });
}

function CategoryAvatar({ transaction, size = "default" }: { transaction: TransactionDto; size?: "default" | "sm" }) {
  const isIncome = transaction.type === "INCOME";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "h-8 w-8 text-sm" : "h-11 w-11 text-lg",
        isIncome ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      {transaction.category?.icon ? (
        transaction.category.icon
      ) : isIncome ? (
        <ArrowDownLeft className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <ArrowUpRight className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </span>
  );
}

export function TransactionList({ transactions }: { transactions: TransactionDto[] }) {
  const [editing, setEditing] = useState<TransactionDto | null>(null);
  const deleteTransaction = useDeleteTransaction();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <p className="text-sm font-medium">No transactions yet</p>
        <p className="text-sm text-muted-foreground">Add your first one to see it here.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            <button
              type="button"
              onClick={() => setEditing(transaction)}
              className="-mx-1 flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left transition-colors active:bg-secondary/60"
            >
              <CategoryAvatar transaction={transaction} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  {transaction.merchantName || transaction.description || transaction.category?.name || "Uncategorized"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatDate(transaction.occurredAt)}
                  {transaction.category ? ` · ${transaction.category.name}` : ""}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 font-tnum text-[15px] font-semibold",
                  transaction.type === "INCOME" ? "text-success" : "text-foreground",
                )}
              >
                {transaction.type === "INCOME" ? "+" : "-"}
                {formatNu(transaction.amountNu)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Merchant / Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-muted-foreground">{formatDate(transaction.occurredAt)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <CategoryAvatar transaction={transaction} size="sm" />
                    {transaction.category?.name ?? "Uncategorized"}
                  </span>
                </TableCell>
                <TableCell>{transaction.merchantName || transaction.description || "—"}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-tnum font-semibold",
                    transaction.type === "INCOME" ? "text-success" : "text-foreground",
                  )}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatNu(transaction.amountNu)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(transaction)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTransaction.mutate(transaction.id)}
                      aria-label="Delete"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <TransactionForm transaction={editing} onDone={() => setEditing(null)} />
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  deleteTransaction.mutate(editing.id);
                  setEditing(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete transaction
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
