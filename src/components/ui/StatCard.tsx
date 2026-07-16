import { cn } from "@/lib/utils";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  delta,
  hint,
  accent = false,
  icon,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  hint?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      {accent && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}
      <div className="flex items-start justify-between">
        <span className="text-[12.5px] font-medium text-fg-muted">{label}</span>
        {icon && (
          <span className="text-fg-faint" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="tabular font-display text-[26px] font-semibold leading-none text-fg">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "tabular mb-0.5 text-[12.5px] font-medium",
              delta.positive ? "text-[--color-success]" : "text-[--color-danger]"
            )}
          >
            {delta.positive ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[12px] text-fg-faint">{hint}</p>}
    </Card>
  );
}
