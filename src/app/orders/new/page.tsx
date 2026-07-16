import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { OrderForm } from "@/components/orders/OrderForm";
import { listRetailers } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const retailers = await listRetailers();
  return (
    <AppShell title="New order">
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={15} /> Back to orders
      </Link>
      <OrderForm retailers={retailers.map((r) => ({ id: r.id, name: r.name }))} />
    </AppShell>
  );
}
