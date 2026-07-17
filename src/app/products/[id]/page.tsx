import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ProductDetailActions } from "@/components/products/ProductDetailActions";
import { getProduct, listProducts } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, all] = await Promise.all([getProduct(id), listProducts()]);
  if (!data) notFound();
  const { product, history } = data;
  const others = all.filter((p) => p.id !== id).map((p) => ({ id: p.id, name: p.canonicalName }));

  return (
    <AppShell title="Product">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
          <ArrowLeft size={15} /> Back to products
        </Link>
        <ProductDetailActions id={product.id} name={product.canonicalName} category={product.category} others={others} />
      </div>

      <div className="mb-4">
        <h2 className="font-display text-[24px] font-bold text-fg">{product.canonicalName}</h2>
        {product.category && <p className="text-[13px] text-fg-muted">{product.category}</p>}
        {product.aliases.length > 0 && (
          <p className="mt-1 text-[11.5px] text-fg-faint">
            Also seen as: {product.aliases.join(", ")}
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Lifetime bought" value={String(product.lifetimeQty)} accent />
        <StatCard label="Avg unit cost" value={formatCurrency(product.avgUnitCost)} />
        <StatCard
          label="Price range"
          value={product.lowUnitPrice ? formatCurrency(product.lowUnitPrice) : "—"}
          hint={product.highUnitPrice ? `up to ${formatCurrency(product.highUnitPrice)}` : undefined}
        />
        <StatCard label="In stock" value={String(product.currentInventory)} />
        <StatCard label="Sold" value={String(product.soldCount)} />
        <StatCard label="Orders" value={String(product.orderCount)} />
      </div>

      <Card>
        <div className="border-b border-[--color-border] px-5 py-3">
          <h3 className="text-sm font-semibold text-fg">Purchase history</h3>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-fg-faint">
            No linked purchases yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[--color-border-soft] text-[11.5px] uppercase tracking-wide text-fg-faint">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="px-5 py-2.5 font-semibold">Retailer</th>
                  <th className="px-5 py-2.5 font-semibold">As named</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Qty</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Unit</th>
                  <th className="px-5 py-2.5 text-right font-semibold">True cost</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-surface-2]">
                    <td className="px-5 py-3 text-fg-muted">{h.purchaseDate.slice(0, 10)}</td>
                    <td className="px-5 py-3 text-fg">{h.retailer}</td>
                    <td className="px-5 py-3 text-fg-muted">
                      <Link href={`/orders/${h.orderId}`} className="hover:text-[--color-brand-soft]">
                        {h.rawName}
                      </Link>
                    </td>
                    <td className="tabular px-5 py-3 text-right text-fg-muted">{h.quantity}</td>
                    <td className="tabular px-5 py-3 text-right text-fg-muted">{formatCurrency(h.unitPrice)}</td>
                    <td className="tabular px-5 py-3 text-right font-medium text-fg">{formatCurrency(h.effectiveUnitCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
