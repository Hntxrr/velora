import { db } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/** Full JSON export of the signed-in user's data (GDPR-style portability). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const [user, orders, products, inventory, sales, shipments, notifications] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, name: true, plan: true, createdAt: true } }),
    db.order.findMany({ where: { userId }, include: { items: true } }),
    db.product.findMany({ where: { userId } }),
    db.inventoryStack.findMany({ where: { userId } }),
    db.sale.findMany({ where: { userId } }),
    db.shipment.findMany({ where: { userId } }),
    db.notification.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    orders,
    products,
    inventory,
    sales,
    shipments,
    notifications,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="velora-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
