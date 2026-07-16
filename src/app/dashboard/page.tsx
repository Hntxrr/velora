import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill, type OrderStatus } from "@/components/ui/StatusPill";
import { AreaChart } from "@/components/ui/AreaChart";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, PiggyBank, Percent, Target, Truck, ArrowRight } from "lucide-react";

// Placeholder sample data — replaced by live data once the DB + orders land.
const spendTrend = [
  { label: "Feb", value: 2200 },
  { label: "Mar", value: 3100 },
  { label: "Apr", value: 2750 },
  { label: "May", value: 4200 },
  { label: "Jun", value: 3850 },
  { label: "Jul", value: 5100 },
];

const recentOrders: {
  retailer: string;
  order: string;
  items: string;
  total: number;
  status: OrderStatus;
}[] = [
  { retailer: "Pokémon Center", order: "PC-88213", items: "2× 151 ETB, 2× Booster Bundle", total: 219.96, status: "shipped" },
  { retailer: "Best Buy", order: "BBY-4471", items: "1× PS5 Slim", total: 542.31, status: "out_for_delivery" },
  { retailer: "Target", order: "T-99120", items: "4× Prismatic ETB", total: 199.96, status: "delivered" },
  { retailer: "Walmart", order: "WM-31882", items: "1× LEGO Icons Set", total: 189.99, status: "confirmed" },
  { retailer: "Costco", order: "CO-2231", items: "1× GPU RTX Bundle", total: 1299.0, status: "cancelled" },
];

const arriving = [
  { retailer: "Pokémon Center", when: "Today", label: "2 orders" },
  { retailer: "Best Buy", when: "Tomorrow", label: "1 order" },
  { retailer: "Walmart", when: "Fri, Jul 18", label: "1 order" },
];

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" reviewCount={3}>
      {/* Intro */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-fg-muted">
            Welcome back — here&apos;s your reselling snapshot.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] p-1">
          {["Month", "YTD", "Lifetime"].map((p, i) => (
            <button
              key={p}
              className={
                "rounded-[--radius-xs] px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
                (i === 0
                  ? "bg-[--color-elevated] text-fg"
                  : "text-fg-muted hover:text-fg")
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Spent" value={formatCurrency(21100)} accent icon={<Wallet size={16} />} hint="Cash out this month" />
        <StatCard label="Revenue" value={formatCurrency(8420)} delta={{ value: "12%", positive: true }} icon={<TrendingUp size={16} />} />
        <StatCard label="Profit" value={formatCurrency(2310)} delta={{ value: "8%", positive: true }} icon={<PiggyBank size={16} />} hint="Matched to sold items" />
        <StatCard label="ROI" value="37.7%" delta={{ value: "3%", positive: true }} icon={<Percent size={16} />} />
        <StatCard label="Stick Rate" value="82%" delta={{ value: "4%", positive: false }} icon={<Target size={16} />} hint="Confirmed vs cancelled" />
        <StatCard label="Arriving" value="4" icon={<Truck size={16} />} hint="Next 7 days" />
      </div>

      {/* Charts + side rail */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend &amp; Profit</CardTitle>
            <span className="text-[12px] text-fg-faint">Last 6 months</span>
          </CardHeader>
          <CardContent>
            <AreaChart data={spendTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arriving soon</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
              Calendar <ArrowRight size={13} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {arriving.map((a) => (
              <div
                key={a.retailer + a.when}
                className="flex items-center justify-between rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] px-3 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-medium text-fg">{a.retailer}</p>
                  <p className="text-[11.5px] text-fg-faint">{a.label}</p>
                </div>
                <span className="rounded-full bg-[--color-elevated] px-2.5 py-1 text-[11.5px] font-medium text-fg-muted">
                  {a.when}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
            View all <ArrowRight size={13} />
          </Button>
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
              {recentOrders.map((o) => (
                <tr
                  key={o.order}
                  className="border-b border-[--color-border-soft] transition-colors last:border-0 hover:bg-[--color-surface-2]"
                >
                  <td className="px-5 py-3 font-medium text-fg">{o.retailer}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-fg-muted">{o.order}</td>
                  <td className="px-5 py-3 text-fg-muted">{o.items}</td>
                  <td className="tabular px-5 py-3 text-right font-medium text-fg">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
