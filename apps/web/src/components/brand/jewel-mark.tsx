import { cn } from "@/lib/utils";

/** The Norbu wish-fulfilling jewel — a Bhutanese motif of prosperity, used as DrukSave's mark. */
export function JewelMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-current [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]",
        className,
      )}
    />
  );
}
