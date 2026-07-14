"use client";

import { useState } from "react";
import { formatNu, TransactionDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteTransaction } from "@/lib/queries/use-transactions";
import { TransactionForm } from "./transaction-form";

export function TransactionList({ transactions }: { transactions: TransactionDto[] }) {
  const [editing, setEditing] = useState<TransactionDto | null>(null);
  const deleteTransaction = useDeleteTransaction();

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>;
  }

  return (
    <>
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
              <TableCell>{new Date(transaction.occurredAt).toLocaleDateString("en-BT")}</TableCell>
              <TableCell>
                {transaction.category
                  ? `${transaction.category.icon ?? ""} ${transaction.category.name}`.trim()
                  : "Uncategorized"}
              </TableCell>
              <TableCell>{transaction.merchantName || transaction.description || "—"}</TableCell>
              <TableCell
                className={`text-right font-medium ${
                  transaction.type === "INCOME" ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {transaction.type === "INCOME" ? "+" : "-"}
                {formatNu(transaction.amountNu)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditing(transaction)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTransaction.mutate(transaction.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editing && <TransactionForm transaction={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
