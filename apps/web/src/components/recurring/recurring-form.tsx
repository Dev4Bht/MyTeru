"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecurringTransactionSchema, CreateRecurringTransactionDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/queries/use-categories";
import { useCreateRecurringTransaction } from "@/lib/queries/use-recurring-transactions";

export function RecurringForm({ onDone }: { onDone: () => void }) {
  const form = useForm<CreateRecurringTransactionDto>({
    resolver: zodResolver(createRecurringTransactionSchema),
    defaultValues: { type: "EXPENSE", frequency: "MONTHLY" },
  });
  const type = form.watch("type");
  const { data: categories } = useCategories(type);
  const createRecurring = useCreateRecurringTransaction();

  const onSubmit = async (values: CreateRecurringTransactionDto) => {
    await createRecurring.mutateAsync(values);
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
        <Input id="amountNu" type="number" step="0.01" {...form.register("amountNu", { valueAsNumber: true })} />
        {form.formState.errors.amountNu && (
          <p className="text-sm text-destructive">{form.formState.errors.amountNu.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select value={form.watch("categoryId")} onValueChange={(value) => form.setValue("categoryId", value)}>
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
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" placeholder="e.g. Government Salary" {...form.register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select
          value={form.watch("frequency")}
          onValueChange={(value) => form.setValue("frequency", value as CreateRecurringTransactionDto["frequency"])}
        >
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input id="endDate" type="date" {...form.register("endDate")} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createRecurring.isPending}>
        {createRecurring.isPending ? "Saving..." : "Add recurring transaction"}
      </Button>
    </form>
  );
}
