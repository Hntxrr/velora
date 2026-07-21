import Link from "next/link";
import { Wallet, Layers, Target, Truck, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { SpendProfitChart } from "@/components/charts/SpendProfitChart";
import { Button } from "@/components/ui/Button";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { getOverview, getSpendProfitTrend } from "@/lib/analytics";
import { listOrders } from "@/lib/orders";
import { getDeliveryEvents } from "@/lib/tracking";
import { countDrafts } from "@/lib/review";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 864e5);

  const [overview, trend, orders, arriving, reviewCount] = await Promise.all([
    getOverview(),
    getSpendProfitTrend(6),
    listOrders(),
    getDeliveryEvents(now, in7),
    countDrafts(),
  ]);

  const recent = orders.slice(0, 6);
  const empty = orders.length === 0;

  return (
    <AppShell title="Dashboard" reviewCount={reviewCount}>
      <div className="mb-5">
        <p className="text-[13.5px] text-fg-muted">
          Welcome back — here&apos;s your reselling snapshot.
        </p>
      </div>

      {empty ? (
        <EmptyDashboard />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Orders" value={String(overview.ordersCount)} accent icon={<Layers size={16} />} />
            <StatCard label="Spent (mo)" value={formatCurrency(overview.totalSpentMonth)} icon={<Wallet size={16} />} hint="This month" />
            <StatCard label="Total spent" value={formatCurrency(overview.totalSpentLifetime)} icon={<Wallet size={16} />} hint="All time" />
            <StatCard label="Units" value={String(overview.unitsCount)} icon={<Layers size={16} />} />
            <StatCard label="Arriving" value={String(overview.arrivingCount)} icon={<Truck size={16} />} hint="Next 7 days" />
            <StatCard label="Stick rate" value={formatPercent(overview.stickRate)} icon={<Target size={16} />} hint="Confirmed vs cancelled" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Spend &amp; Profit</CardTitle>
                <span className="text-[12px] text-fg-faint">Last 6 months</span>
              </CardHeader>
              <CardContent>
                <SpendProfitChart data={trend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arriving soon</CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
                    Calendar <ArrowRight size={13} />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {arriving.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-fg-faint">
                    Nothing scheduled in the next 7 days.
                  </p>
                ) : (
                  arriving.slice(0, 5).map((a) => (
                    <Link
                      key={a.orderId}
                      href={`/orders/${a.orderId}`}
                      className="flex items-center justify-between rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] px-3 py-2.5 hover:border-[--color-hover]"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-fg">{a.retailerName ?? "Order"}</p>
                        <p className="font-mono text-[11px] text-fg-faint">#{a.orderNumber}</p>
                      </div>
                      <span className="rounded-full bg-[--color-elevated] px-2.5 py-1 text-[11.5px] font-medium text-fg-muted">
                        {a.date.slice(5, 10)}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
                  View all <ArrowRight size={13} />
                </Button>
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-y border-[--color-border] text-[11.5px] uppercase tracking-wide text-fg-faint">
                    <th className="px-5 py-2.5 font-semibold">Retailer</th>
                    <th className="px-5 py-2.5 font-semibold">Order</th>
                    <th className="px-5 py-2.5 font-semibold">Items</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-[--color-border-soft] transition-colors last:border-0 hover:bg-[--color-surface-2]">
                      <td className="px-5 py-3 font-medium text-fg">
                        <Link href={`/orders/${o.id}`}>{o.retailerName ?? o.storeLabel ?? "—"}</Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px] text-fg-muted">{o.orderNumber}</td>
                      <td className="max-w-[280px] truncate px-5 py-3 text-fg-muted">
                        {o.items.map((i) => `${i.quantity}× ${i.rawName}`).join(", ") || "—"}
                      </td>
                      <td className="tabular px-5 py-3 text-right font-medium text-fg">{formatCurrency(o.grandTotal)}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={o.status.toLowerCase() as never} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
