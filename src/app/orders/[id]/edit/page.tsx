import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { OrderForm } from "@/components/orders/OrderForm";
import { getOrder, listRetailers } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, retailers] = await Promise.all([getOrder(id), listRetailers()]);
  if (!order) notFound();

  return (
    <AppShell title="Edit order">
      <Link
        href={`/orders/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={15} /> Back to order
      </Link>
      <OrderForm retailers={retailers.map((r) => ({ id: r.id, name: r.name }))} order={order} />
    </AppShell>
  );
}
