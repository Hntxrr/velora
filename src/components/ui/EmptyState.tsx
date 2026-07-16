import { type LucideIcon } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-[--color-border] bg-[--color-surface]/40 px-6 py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-[--radius-lg]"
        style={{ background: "var(--gradient-brand-soft)" }}
      >
        <Icon size={24} className="text-[--color-brand-soft]" />
      </div>
      <h3 className="font-display text-[17px] font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-fg-muted">
        {description}
      </p>
      {action && (
        <Button className="mt-5" size="sm">
          {action}
        </Button>
      )}
    </div>
  );
}
