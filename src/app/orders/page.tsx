import { AppShell } from "@/components/shell/AppShell";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await listOrders();
  return (
    <AppShell title="Orders">
      <OrdersTable orders={orders} />
    </AppShell>
  );
}
