"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2, Truck } from "lucide-react";
import type { ShipmentStatus } from "@prisma/client";
import type { ShipmentDTO } from "@/lib/tracking";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { updateShipmentStatus, deleteShipment } from "@/app/tracking/actions";

const STATUSES: ShipmentStatus[] = [
  "PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "RETURNED",
];

const GROUPS: { title: string; match: ShipmentStatus[] }[] = [
  { title: "Out for delivery", match: ["OUT_FOR_DELIVERY"] },
  { title: "In transit", match: ["IN_TRANSIT", "PENDING"] },
  { title: "Delivered", match: ["DELIVERED"] },
  { title: "Needs attention", match: ["EXCEPTION", "RETURNED"] },
];

export function TrackingBoard({ shipments }: { shipments: ShipmentDTO[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (shipments.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No shipments yet"
        description="Add a tracking number to an order and it appears here. Velora auto-detects the carrier and links straight to their tracking page."
      />
    );
  }

  const onStatus = (id: string, status: ShipmentStatus) =>
    startTransition(async () => {
      await updateShipmentStatus(id, status);
      router.refresh();
    });

  const onDelete = (id: string) => {
    if (!confirm("Remove this tracking?")) return;
    startTransition(async () => {
      await deleteShipment(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const rows = shipments.filter((s) => group.match.includes(s.status));
        if (rows.length === 0) return null;
        return (
          <div key={group.title}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-fg">{group.title}</h3>
              <span className="tabular rounded-full bg-[--color-surface-2] px-2 py-0.5 text-[11px] text-fg-faint">
                {rows.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/orders/${s.orderId}`}
                        className="block truncate text-[14px] font-semibold text-fg hover:text-[--color-brand-soft]"
                      >
                        {s.retailerName ?? "Order"}
                      </Link>
                      <p className="truncate font-mono text-[11.5px] text-fg-faint">
                        #{s.orderNumber}
                      </p>
                    </div>
                    <ShipmentStatusBadge status={s.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-fg-faint">{s.carrierName}</p>
                      <p className="truncate font-mono text-[12px] text-fg-muted">
                        {s.trackingNumber}
                      </p>
                    </div>
                    <a
                      href={s.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 rounded-[--radius-xs] px-2 py-1.5 text-[12px] font-medium text-[--color-brand-soft] hover:bg-[--color-hover]"
                    >
                      Track <ExternalLink size={13} />
                    </a>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <select
                      value={s.status}
                      disabled={pending}
                      onChange={(e) => onStatus(s.id, e.target.value as ShipmentStatus)}
                      className="cursor-pointer rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-2 py-1.5 text-[12px] text-fg-muted focus:outline-none"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, " ").toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onDelete(s.id)}
                      disabled={pending}
                      className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]"
                      aria-label="Remove tracking"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
