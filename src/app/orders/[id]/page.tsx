import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderDetailActions } from "@/components/orders/OrderDetailActions";
import { getOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <AppShell title="Order">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={15} /> Back to orders
        </Link>
        <OrderDetailActions id={order.id} status={order.status} />
      </div>

      {/* Header */}
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[22px] font-bold text-fg">
                {order.retailerName ?? order.storeLabel ?? "Order"}
              </h2>
              <StatusPill status={order.status.toLowerCase() as never} />
            </div>
            <p className="mt-1 font-mono text-[13px] text-fg-muted">#{order.orderNumber}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {order.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[--color-surface-2] px-2.5 py-0.5 text-[11.5px] text-fg-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-fg-faint">Grand total</p>
            <p className="tabular font-display text-[28px] font-semibold text-fg">
              {formatCurrency(order.grandTotal)}
            </p>
            <p className="text-[12px] text-fg-faint">
              Purchased {order.purchaseDate.slice(0, 10)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <OrderTimeline status={order.status} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Line items */}
        <Card className="lg:col-span-2">
          <div className="border-b border-[--color-border] px-5 py-3">
            <h3 className="text-sm font-semibold text-fg">Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[--color-border-soft] text-[11.5px] uppercase tracking-wide text-fg-faint">
                  <th className="px-5 py-2.5 font-semibold">Item</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Qty</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Unit</th>
                  <th className="px-5 py-2.5 text-right font-semibold">True unit cost</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-b border-[--color-border-soft] last:border-0">
                    <td className="px-5 py-3 font-medium text-fg">{it.rawName}</td>
                    <td className="tabular px-5 py-3 text-right text-fg-muted">{it.quantity}</td>
                    <td className="tabular px-5 py-3 text-right text-fg-muted">
                      {formatCurrency(it.unitPrice)}
                    </td>
                    <td className="tabular px-5 py-3 text-right font-medium text-fg">
                      {formatCurrency(it.effectiveUnitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.notes && (
            <div className="border-t border-[--color-border] px-5 py-4">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-[13px] text-fg-muted">{order.notes}</p>
            </div>
          )}
        </Card>

        {/* Totals */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-fg">Cost breakdown</h3>
          <dl className="space-y-2 text-[13px]">
            <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Row label="Tax" value={formatCurrency(order.taxTotal)} />
            <Row label="Shipping" value={formatCurrency(order.shippingTotal)} />
            <Row label="Discount" value={`− ${formatCurrency(order.discountTotal)}`} />
            <div className="my-2 border-t border-[--color-border]" />
            <div className="flex items-center justify-between">
              <dt className="font-semibold text-fg">Grand total</dt>
              <dd className="tabular font-display text-[17px] font-semibold text-fg">
                {formatCurrency(order.grandTotal)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-1 text-[12px] text-fg-faint">
            <p>{order.itemCount} line items · {order.unitCount} units</p>
            <p>Source: {order.source.toLowerCase()}</p>
            {order.deliveryDateEst && (
              <p>Est. delivery: {order.deliveryDateEst.slice(0, 10)}</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="tabular text-fg">{value}</dd>
    </div>
  );
}
