"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, CreateCategoryDto } from "@druksave/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4">
      <SegmentedControl
        options={[
          { label: "Expense", value: "EXPENSE" as const, activeClassName: "text-destructive" },
          { label: "Income", value: "INCOME" as const, activeClassName: "text-success" },
        ]}
        value={type}
        onChange={(value) => form.setValue("type", value)}
      />

      <div className="flex items-end gap-2">
        <div className="w-16 space-y-1">
          <Label htmlFor="icon">Icon</Label>
          <Input id="icon" placeholder="🥾" className="text-center" {...form.register("icon")} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="name">Category name</Label>
          <Input id="name" placeholder="Weekend Hikes" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={createCategory.isPending}>
        <Plus className="h-4 w-4" />
        {createCategory.isPending ? "Adding..." : "Add category"}
      </Button>
    </form>
  );
}
