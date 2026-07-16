import { cn } from "@/lib/utils";

export type OrderStatus =
  | "confirmed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

const config: Record<
  OrderStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  confirmed: {
    label: "Confirmed",
    dot: "#38bdf8",
    text: "#7fd3fb",
    bg: "rgba(56,189,248,0.12)",
  },
  shipped: {
    label: "Shipped",
    dot: "#7c5cff",
    text: "#a893ff",
    bg: "rgba(124,92,255,0.14)",
  },
  out_for_delivery: {
    label: "Out for delivery",
    dot: "#f5a524",
    text: "#f6bd5d",
    bg: "rgba(245,165,36,0.13)",
  },
  delivered: {
    label: "Delivered",
    dot: "#22c55e",
    text: "#5ad98a",
    bg: "rgba(34,197,94,0.13)",
  },
  cancelled: {
    label: "Cancelled",
    dot: "#f04444",
    text: "#f58080",
    bg: "rgba(240,68,68,0.13)",
  },
  refunded: {
    label: "Refunded",
    dot: "#6c6c82",
    text: "#a6a6bd",
    bg: "rgba(108,108,130,0.14)",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
        className
      )}
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }}
      />
      {c.label}
    </span>
  );
}
