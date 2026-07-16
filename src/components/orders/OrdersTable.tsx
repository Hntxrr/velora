"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Package,
} from "lucide-react";
import type { OrderDTO } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { bulkUpdateStatus, deleteOrders } from "@/app/orders/actions";

type SortKey = "purchaseDate" | "grandTotal" | "orderNumber" | "status";

const STATUS_OPTIONS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

export function OrdersTable({ orders }: { orders: OrderDTO[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus | "ALL">("ALL");
  const [sort, setSort] = React.useState<SortKey>("purchaseDate");
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();

  const filtered = React.useMemo(() => {
    let rows = orders;
    if (status !== "ALL") rows = rows.filter((o) => o.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.retailerName ?? "").toLowerCase().includes(q) ||
          o.items.some((i) => i.rawName.toLowerCase().includes(q))
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sort === "grandTotal") cmp = a.grandTotal - b.grandTotal;
      else if (sort === "orderNumber") cmp = a.orderNumber.localeCompare(b.orderNumber);
      else if (sort === "status") cmp = a.status.localeCompare(b.status);
      else cmp = a.purchaseDate.localeCompare(b.purchaseDate);
      return dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [orders, status, search, sort, dir]);

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((o) => o.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setSortKey = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const ids = Array.from(selected);

  const onBulkStatus = (s: OrderStatus) =>
    startTransition(async () => {
      await bulkUpdateStatus(ids, s);
      setSelected(new Set());
      router.refresh();
    });

  const onDelete = () => {
    if (!confirm(`Delete ${ids.length} order(s)? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteOrders(ids);
      setSelected(new Set());
      router.refresh();
    });
  };

  const SortHead = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => (
    <th className={`px-4 py-2.5 font-semibold ${right ? "text-right" : ""}`}>
      <button
        onClick={() => setSortKey(k)}
        className={`inline-flex items-center gap-1 hover:text-fg ${right ? "flex-row-reverse" : ""}`}
      >
        {label}
        {sort === k &&
          (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
    </th>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, retailers, items…"
            className="w-full rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] py-2 pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-faint focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "ALL")}
          className="cursor-pointer rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-3 py-2 text-[13px] text-fg-muted focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <a href="/api/orders/export" download>
          <Button variant="secondary" size="md" className="gap-1.5">
            <Download size={15} /> Export
          </Button>
        </a>
        <Link href="/orders/new">
          <Button size="md" className="gap-1.5">
            <Plus size={16} /> New order
          </Button>
        </Link>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[--radius-md] border border-[--color-brand]/40 bg-[--color-brand]/10 px-3 py-2">
          <span className="text-[13px] font-medium text-fg">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              onChange={(e) => e.target.value && onBulkStatus(e.target.value as OrderStatus)}
              defaultValue=""
              disabled={pending}
              className="cursor-pointer rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-2.5 py-1.5 text-[12.5px] text-fg-muted"
            >
              <option value="" disabled>
                Set status…
              </option>
              {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button variant="danger" size="sm" onClick={onDelete} disabled={pending} className="gap-1.5">
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={orders.length === 0 ? "No orders yet" : "No matches"}
          description={
            orders.length === 0
              ? "Add your first order manually, or connect an inbox to auto-import from forwarded emails."
              : "Try adjusting your search or status filter."
          }
          action={orders.length === 0 ? undefined : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface]">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[--color-border] text-[11.5px] uppercase tracking-wide text-fg-faint">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="accent-[--color-brand]"
                  />
                </th>
                <th className="px-4 py-2.5 font-semibold">Retailer</th>
                <SortHead label="Order" k="orderNumber" />
                <th className="px-4 py-2.5 font-semibold">Items</th>
                <th className="px-4 py-2.5 text-right font-semibold">Units</th>
                <SortHead label="Total" k="grandTotal" right />
                <SortHead label="Status" k="status" />
                <SortHead label="Purchased" k="purchaseDate" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/orders/${o.id}`)}
                  className="cursor-pointer border-b border-[--color-border-soft] transition-colors last:border-0 hover:bg-[--color-surface-2]"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleOne(o.id)}
                      className="accent-[--color-brand]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-fg">
                    {o.retailerName ?? o.storeLabel ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg-muted">
                    {o.orderNumber}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-fg-muted">
                    {o.items.map((i) => `${i.quantity}× ${i.rawName}`).join(", ") || "—"}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-fg-muted">{o.unitCount}</td>
                  <td className="tabular px-4 py-3 text-right font-medium text-fg">
                    {formatCurrency(o.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status.toLowerCase() as never} />
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {o.purchaseDate.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
