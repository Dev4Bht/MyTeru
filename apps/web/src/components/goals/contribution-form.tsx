"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGoalContributionSchema, CreateGoalContributionDto } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddGoalContribution } from "@/lib/queries/use-goals";

export function ContributionForm({ goalId, onDone }: { goalId: string; onDone: () => void }) {
  const form = useForm<CreateGoalContributionDto>({ resolver: zodResolver(createGoalContributionSchema) });
  const addContribution = useAddGoalContribution();

  const onSubmit = async (values: CreateGoalContributionDto) => {
    await addContribution.mutateAsync({ id: goalId, dto: values });
    form.reset();
    onDone();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4">
      <div className="space-y-2">
        <Label htmlFor="contribution-amount">Add money (Nu.)</Label>
        <Input
          id="contribution-amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          className="font-tnum"
          {...form.register("amountNu", { valueAsNumber: true })}
        />
        {form.formState.errors.amountNu && (
          <p className="text-xs text-destructive">{form.formState.errors.amountNu.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contribution-note">Note (optional)</Label>
        <Input id="contribution-note" placeholder="e.g. Bonus from work" {...form.register("note")} />
      </div>
      <Button type="submit" size="sm" disabled={addContribution.isPending}>
        {addContribution.isPending ? "Adding..." : "Add to goal"}
      </Button>
    </form>
  );
}
