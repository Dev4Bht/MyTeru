"use client";

import { formatNu } from "@druksave/shared";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface PlanLineDraft {
  budgetId?: string;
  categoryId?: string;
  name: string;
  icon?: string;
  amountNu: string;
  autoPost: boolean;
  actualNu?: string;
}

export function PlanLineRow({
  line,
  tone,
  onChange,
  onRemove,
}: {
  line: PlanLineDraft;
  tone: "income" | "expense";
  onChange: (patch: Partial<PlanLineDraft>) => void;
  onRemove: () => void;
}) {
  const planned = Number(line.amountNu) || 0;
  const actual = line.actualNu !== undefined ? Number(line.actualNu) : undefined;
  const hasProgress = line.budgetId !== undefined && actual !== undefined && planned > 0;
  const pct = hasProgress ? Math.min(100, (actual! / planned) * 100) : 0;
  const isOver = tone === "expense" && hasProgress && actual! > planned;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
            tone === "income" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {line.icon || (tone === "income" ? "↓" : "↑")}
        </span>
        <Input
          value={line.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={tone === "income" ? "e.g. Salary" : "e.g. Rent"}
          className="h-10 flex-1 border-none bg-transparent px-1 text-[15px] font-medium shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 pl-11">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            Nu.
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={line.amountNu}
            onChange={(e) => onChange({ amountNu: e.target.value })}
            placeholder="0.00"
            className="h-10 pl-10 font-tnum"
          />
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={line.autoPost} onCheckedChange={(checked) => onChange({ autoPost: checked })} />
          Auto-post
        </label>
      </div>

      {hasProgress && (
        <div className="pl-11">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full", isOver ? "bg-destructive" : tone === "income" ? "bg-success" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={cn("mt-1 text-xs", isOver ? "text-destructive" : "text-muted-foreground")}>
            {tone === "income"
              ? `Received ${formatNu(actual!)} of ${formatNu(planned)} expected`
              : isOver
                ? `${formatNu(actual! - planned)} over budget`
                : `${formatNu(planned - actual!)} left of ${formatNu(planned)}`}
          </p>
        </div>
      )}
    </div>
  );
}
