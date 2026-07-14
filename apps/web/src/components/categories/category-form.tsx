"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, CreateCategoryDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCategory } from "@/lib/queries/use-categories";

export function CategoryForm({ onDone }: { onDone: () => void }) {
  const form = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { type: "EXPENSE" },
  });
  const createCategory = useCreateCategory();
  const type = form.watch("type");

  const onSubmit = async (values: CreateCategoryDto) => {
    await createCategory.mutateAsync(values);
    form.reset({ type: values.type });
    onDone();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant={type === "EXPENSE" ? "default" : "outline"}
          onClick={() => form.setValue("type", "EXPENSE")}
        >
          Expense
        </Button>
        <Button
          type="button"
          size="sm"
          variant={type === "INCOME" ? "default" : "outline"}
          onClick={() => form.setValue("type", "INCOME")}
        >
          Income
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="icon">Icon</Label>
        <Input id="icon" placeholder="🥾" className="w-16" {...form.register("icon")} />
      </div>

      <div className="min-w-[10rem] flex-1 space-y-1">
        <Label htmlFor="name">Category name</Label>
        <Input id="name" placeholder="Weekend Hikes" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <Button type="submit" disabled={createCategory.isPending}>
        {createCategory.isPending ? "Adding..." : "Add category"}
      </Button>
    </form>
  );
}
