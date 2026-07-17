import "server-only";
import { db } from "@/lib/db";
import { normalizeName, matchProductId } from "@/lib/product-match";

/**
 * Turn a delivered order's items into inventory stacks.
 *
 * Called when an order (or its shipment) reaches DELIVERED. Idempotent: a stack
 * is only created once per order item (tracked via sourceOrderItemId). Items
 * without a matched product get one auto-created (with a sticky match rule) so
 * inventory always materializes and the product library fills naturally.
 */
export async function materializeInventoryForOrder(userId: string, orderId: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
  if (!order) return;

  for (const item of order.items) {
    // Skip if a stack already exists for this item.
    const existing = await db.inventoryStack.findFirst({
      where: { userId, sourceOrderItemId: item.id },
    });
    if (existing) continue;

    // Resolve or create the product.
    let productId = item.productId ?? (await matchProductId(userId, item.rawName));
    if (!productId) {
      const product = await db.product.create({
        data: { userId, canonicalName: item.rawName, aliases: [] },
      });
      productId = product.id;
      const normalized = normalizeName(item.rawName);
      if (normalized) {
        await db.productMatchRule.create({
          data: { userId, productId, matchPattern: normalized },
        });
      }
      // Backfill the order item link.
      await db.orderItem.update({ where: { id: item.id }, data: { productId } });
    } else if (!item.productId) {
      await db.orderItem.update({ where: { id: item.id }, data: { productId } });
    }

    await db.inventoryStack.create({
      data: {
        userId,
        productId,
        sourceOrderItemId: item.id,
        quantityInitial: item.quantity,
        quantityAvailable: item.quantity,
        avgCostBasis: item.effectiveUnitCost,
        status: "SEALED",
      },
    });
  }
}
