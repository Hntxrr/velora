"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { updateOrderStatus, deleteOrders } from "@/app/orders/actions";

const STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderDetailActions({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onStatus = (s: OrderStatus) =>
    startTransition(async () => {
      await updateOrderStatus(id, s);
      router.refresh();
    });

  const onDelete = () => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteOrders([id]);
      router.push("/orders");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => onStatus(e.target.value as OrderStatus)}
        className="cursor-pointer rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-3 py-2 text-[13px] text-fg-muted focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <Link href={`/orders/${id}/edit`}>
        <Button variant="secondary" size="md" className="gap-1.5">
          <Pencil size={15} /> Edit
        </Button>
      </Link>
      <Button variant="ghost" size="icon" onClick={onDelete} disabled={pending} aria-label="Delete order">
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
