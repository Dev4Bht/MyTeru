"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, CreateTransactionDto, TransactionDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/queries/use-categories";
import { useCreateTransaction, useUpdateTransaction } from "@/lib/queries/use-transactions";

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function TransactionForm({
  transaction,
  onDone,
}: {
  transaction?: TransactionDto;
  onDone: () => void;
}) {
  const isEditing = Boolean(transaction);

  const form = useForm<CreateTransactionDto>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amountNu: Number(transaction.amountNu),
          categoryId: transaction.categoryId ?? undefined,
          merchantName: transaction.merchantName ?? undefined,
          description: transaction.description ?? undefined,
          occurredAt: toDateInputValue(transaction.occurredAt),
        }
      : {
          type: "EXPENSE",
          occurredAt: toDateInputValue(new Date().toISOString()),
        },
  });

  const type = form.watch("type");
  const { data: categories } = useCategories(type);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;

  const onSubmit = async (values: CreateTransactionDto) => {
    if (isEditing && transaction) {
      await updateTransaction.mutateAsync({ id: transaction.id, dto: values });
    } else {
      await createTransaction.mutateAsync(values);
    }
    onDone();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === "EXPENSE" ? "default" : "outline"}
          onClick={() => form.setValue("type", "EXPENSE")}
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={type === "INCOME" ? "default" : "outline"}
          onClick={() => form.setValue("type", "INCOME")}
        >
          Income
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountNu">Amount (Nu.)</Label>
        <Input
          id="amountNu"
          type="number"
          step="0.01"
          {...form.register("amountNu", { valueAsNumber: true })}
        />
        {form.formState.errors.amountNu && (
          <p className="text-sm text-destructive">{form.formState.errors.amountNu.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={form.watch("categoryId")}
          onValueChange={(value) => form.setValue("categoryId", value)}
        >
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchantName">Merchant (optional)</Label>
        <Input id="merchantName" placeholder="e.g. Bhutan Telecom" {...form.register("merchantName")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" {...form.register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occurredAt">Date</Label>
        <Input id="occurredAt" type="date" {...form.register("occurredAt")} />
        {form.formState.errors.occurredAt && (
          <p className="text-sm text-destructive">{form.formState.errors.occurredAt.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add transaction"}
      </Button>
    </form>
  );
}
