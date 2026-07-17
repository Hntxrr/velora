import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpendProfitChart } from "@/components/charts/SpendProfitChart";
import { RetailerDonut } from "@/components/charts/RetailerDonut";
import {
  getOverview,
  getSpendProfitTrend,
  getRetailerBreakdown,
  getDeliveryPerformance,
} from "@/lib/analytics";
import { isPro } from "@/lib/session";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  if (!(await isPro())) {
    return (
      <AppShell title="Analytics">
        <UpgradePrompt feature="Analytics" />
      </AppShell>
    );
  }
  const [overview, trend, retailers, delivery] = await Promise.all([
    getOverview(),
    getSpendProfitTrend(6),
    getRetailerBreakdown(),
    getDeliveryPerformance(),
  ]);

  const hasData = overview.ordersCount > 0;

  return (
    <AppShell title="Analytics">
      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data to chart yet"
          description="Add or import a few orders and your spend, profit, retailer breakdown and delivery performance will populate here."
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Lifetime spend" value={formatCurrency(overview.totalSpentLifetime)} accent />
            <StatCard label="Revenue" value={formatCurrency(overview.revenue)} />
            <StatCard label="Profit" value={formatCurrency(overview.profit)} />
            <StatCard label="Stick rate" value={formatPercent(overview.stickRate)} hint="confirmed vs cancelled" />
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Spend &amp; Profit</CardTitle>
              <span className="text-[12px] text-fg-faint">Last 6 months</span>
            </CardHeader>
            <CardContent>
              <SpendProfitChart data={trend} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spend by retailer</CardTitle>
              </CardHeader>
              <CardContent>
                <RetailerDonut data={retailers} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <PerfStat label="Avg days" value={String(delivery.avgDays)} />
                  <PerfStat label="On time" value={delivery.delivered ? formatPercent(delivery.onTimePct) : "—"} />
                  <PerfStat label="Delivered" value={String(delivery.delivered)} />
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-fg-faint">
                  Average time from purchase to delivery across delivered orders, and how often
                  they arrived by their estimated date.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[--radius-md] border border-[--color-border-soft] bg-[--color-surface-2] py-4 text-center">
      <p className="tabular font-display text-[24px] font-semibold text-fg">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-fg-faint">{label}</p>
    </div>
  );
}
