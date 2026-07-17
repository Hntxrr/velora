import Link from "next/link";
import { Tags, Boxes, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchingPanel } from "@/components/products/MatchingPanel";
import { NewProductButton } from "@/components/products/NewProductButton";
import { listProducts, getUnmatchedGroups } from "@/lib/products";
import { isPro } from "@/lib/session";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  if (!(await isPro())) {
    return (
      <AppShell title="Products">
        <UpgradePrompt feature="The product library" />
      </AppShell>
    );
  }
  const [products, groups] = await Promise.all([listProducts(), getUnmatchedGroups()]);

  return (
    <AppShell title="Products">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13.5px] text-fg-muted">
          Your product library with lifetime purchase stats.
        </p>
        <NewProductButton />
      </div>

      <MatchingPanel
        groups={groups}
        products={products.map((p) => ({ id: p.id, name: p.canonicalName }))}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No products yet"
          description="Create a product, or approve orders and match their line items here to build your library and lifetime stats."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card interactive className="h-full p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14.5px] font-semibold text-fg">
                      {p.canonicalName}
                    </h3>
                    {p.category && (
                      <span className="text-[11.5px] text-fg-faint">{p.category}</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Bought" value={String(p.lifetimeQty)} />
                  <Stat label="In stock" value={String(p.currentInventory)} />
                  <Stat label="Sold" value={String(p.soldCount)} />
                </div>

                <div className="mt-3 space-y-1 border-t border-[--color-border-soft] pt-3 text-[12px]">
                  <Row icon={<TrendingUp size={12} />} label="Avg cost" value={formatCurrency(p.avgUnitCost)} />
                  <Row
                    icon={<Boxes size={12} />}
                    label="Price range"
                    value={
                      p.lowUnitPrice
                        ? `${formatCurrency(p.lowUnitPrice)} – ${formatCurrency(p.highUnitPrice)}`
                        : "—"
                    }
                  />
                </div>

                {p.retailers.length > 0 && (
                  <p className="mt-2 truncate text-[11px] text-fg-faint">
                    {p.retailers.join(" · ")}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[--radius-sm] bg-[--color-surface-2] py-2">
      <p className="tabular font-display text-[17px] font-semibold text-fg">{value}</p>
      <p className="text-[10.5px] uppercase tracking-wide text-fg-faint">{label}</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-fg-faint">
        {icon} {label}
      </span>
      <span className="tabular text-fg">{value}</span>
    </div>
  );
}
