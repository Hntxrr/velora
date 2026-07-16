import type { ShipmentStatus } from "@prisma/client";

const cfg: Record<ShipmentStatus, { label: string; dot: string; text: string; bg: string }> = {
  PENDING: { label: "Label created", dot: "#6c6c82", text: "#a6a6bd", bg: "rgba(108,108,130,0.14)" },
  IN_TRANSIT: { label: "In transit", dot: "#7c5cff", text: "#a893ff", bg: "rgba(124,92,255,0.14)" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", dot: "#f5a524", text: "#f6bd5d", bg: "rgba(245,165,36,0.13)" },
  DELIVERED: { label: "Delivered", dot: "#22c55e", text: "#5ad98a", bg: "rgba(34,197,94,0.13)" },
  EXCEPTION: { label: "Exception", dot: "#f04444", text: "#f58080", bg: "rgba(240,68,68,0.13)" },
  RETURNED: { label: "Returned", dot: "#38bdf8", text: "#7fd3fb", bg: "rgba(56,189,248,0.12)" },
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }} />
      {c.label}
    </span>
  );
}
