import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  badge,
  badgeTone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  badge?: string;
  badgeTone?: "default" | "danger" | "primary";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {badge ? (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold border",
              badgeTone === "danger" &&
                "border-destructive/20 bg-error-container text-destructive",
              badgeTone === "primary" &&
                "border-border bg-surface-container text-[color:var(--primary)]",
              badgeTone === "default" &&
                "border-border bg-surface-container text-[color:var(--primary)]",
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="my-1 flex items-baseline gap-2">
        <span className="text-[1.75rem] font-semibold leading-8 tracking-[-0.03em] tabular-nums">
          {value}
        </span>
      </div>
      {hint ? (
        <div className="flex items-center gap-1.5 border-t border-border/50 pt-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary-container" />
          <span>{hint}</span>
        </div>
      ) : null}
    </div>
  );
}
