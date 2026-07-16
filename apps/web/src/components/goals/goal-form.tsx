"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGoalSchema, CreateGoalDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGoal } from "@/lib/queries/use-goals";

export function GoalForm({ onDone }: { onDone: () => void }) {
  const form = useForm<CreateGoalDto>({ resolver: zodResolver(createGoalSchema) });
  const createGoal = useCreateGoal();

  const onSubmit = async (values: CreateGoalDto) => {
    await createGoal.mutateAsync({ ...values, targetDate: values.targetDate || undefined });
    onDone();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">What are you saving for?</Label>
        <Input id="name" placeholder="e.g. Emergency Fund" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAmountNu">Target amount (Nu.)</Label>
        <Input
          id="targetAmountNu"
          type="number"
          step="0.01"
          inputMode="decimal"
          className="font-tnum text-lg"
          {...form.register("targetAmountNu", { valueAsNumber: true })}
        />
        {form.formState.errors.targetAmountNu && (
          <p className="text-sm text-destructive">{form.formState.errors.targetAmountNu.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Target date (optional)</Label>
        <Input id="targetDate" type="date" {...form.register("targetDate")} />
      </div>

      <Button type="submit" className="w-full" disabled={createGoal.isPending}>
        {createGoal.isPending ? "Creating..." : "Create goal"}
      </Button>
    </form>
  );
}
