import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import { listStacks, listSales, getInventorySummary } from "@/lib/inventory";
import { listProducts } from "@/lib/products";
import { isPro } from "@/lib/session";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  if (!(await isPro())) {
    return (
      <AppShell title="Inventory">
        <UpgradePrompt feature="Inventory & sales" />
      </AppShell>
    );
  }
  const [stacks, sales, summary, products] = await Promise.all([
    listStacks(),
    listSales(),
    getInventorySummary(),
    listProducts(),
  ]);

  return (
    <AppShell title="Inventory">
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Inventory value" value={formatCurrency(summary.inventoryMarketValue)} accent hint={`${summary.unitsInStock} units`} />
        <StatCard label="Cost in stock" value={formatCurrency(summary.inventoryCost)} />
        <StatCard label="Revenue" value={formatCurrency(summary.revenue)} hint={`${summary.salesCount} sales`} />
        <StatCard label="Expenses" value={formatCurrency(summary.matchedExpenses)} hint="cost + fees + shipping" />
        <StatCard
          label="Profit"
          value={formatCurrency(summary.profit)}
          delta={summary.profit !== 0 ? { value: formatPercent(summary.roi), positive: summary.profit >= 0 } : undefined}
        />
        <StatCard label="ROI" value={summary.salesCount ? formatPercent(summary.roi) : "—"} />
      </div>

      <InventoryManager
        stacks={stacks}
        sales={sales}
        products={products.map((p) => ({ id: p.id, name: p.canonicalName }))}
      />
    </AppShell>
  );
}
