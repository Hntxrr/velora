import { Check } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

const ORDER: Record<string, number> = {
  CONFIRMED: 0,
  SHIPPED: 1,
  OUT_FOR_DELIVERY: 2,
  DELIVERED: 3,
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-2] px-4 py-3">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: status === "CANCELLED" ? "#f04444" : "#6c6c82" }}
        />
        <span className="text-[13px] font-medium text-fg-muted">
          This order was {status.toLowerCase()}.
        </span>
      </div>
    );
  }

  const current = ORDER[status] ?? 0;

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors"
                style={
                  done || active
                    ? { background: "var(--gradient-brand)", color: "#fff" }
                    : { background: "var(--color-elevated)", color: "var(--color-fg-faint)" }
                }
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`mt-1.5 whitespace-nowrap text-[11px] ${
                  active ? "font-semibold text-fg" : "text-fg-faint"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-2 h-[2px] flex-1 rounded-full"
                style={{
                  background: i < current ? "var(--color-brand)" : "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
