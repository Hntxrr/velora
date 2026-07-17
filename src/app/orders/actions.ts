"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { allocateCosts } from "@/lib/costing";
import { matchProductId } from "@/lib/product-match";
import { materializeInventoryForOrder } from "@/lib/inventory-materialize";
import { notify } from "@/lib/notify";
import type { OrderStatus } from "@prisma/client";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export type OrderItemInput = {
  rawName: string;
  quantity: number;
  unitPrice: number;
  productId?: string | null;
};

export type OrderInput = {
  orderNumber: string;
  retailerId?: string | null;
  storeLabel?: string | null;
  status: OrderStatus;
  priority?: "LOW" | "NORMAL" | "HIGH";
  purchaseDate: string; // ISO date
  deliveryDateEst?: string | null;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  tags: string[];
  notes?: string | null;
  items: OrderItemInput[];
};

function buildItemData(input: OrderInput) {
  const alloc = allocateCosts({
    items: input.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    taxTotal: input.taxTotal,
    shippingTotal: input.shippingTotal,
    discountTotal: input.discountTotal,
  });
  const items = input.items.map((it, idx) => ({
    rawName: it.rawName,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    productId: it.productId ?? null,
    allocatedTax: alloc.lines[idx].allocatedTax,
    allocatedShipping: alloc.lines[idx].allocatedShipping,
    allocatedDiscount: alloc.lines[idx].allocatedDiscount,
    effectiveUnitCost: alloc.lines[idx].effectiveUnitCost,
  }));
  return { items, subtotal: alloc.subtotal, grandTotal: alloc.grandTotal };
}

async function resolveProductIds(
  userId: string,
  items: ReturnType<typeof buildItemData>["items"]
) {
  return Promise.all(
    items.map(async (i) => ({
      ...i,
      productId: i.productId ?? (await matchProductId(userId, i.rawName)),
    }))
  );
}

export async function createOrder(input: OrderInput) {
  const userId = await requireUserId();
  const { items: rawItems, subtotal, grandTotal } = buildItemData(input);
  const items = await resolveProductIds(userId, rawItems);

  const order = await db.order.create({
    data: {
      userId,
      orderNumber: input.orderNumber,
      retailerId: input.retailerId || null,
      storeLabel: input.storeLabel || null,
      status: input.status,
      priority: input.priority ?? "NORMAL",
      purchaseDate: new Date(input.purchaseDate),
      deliveryDateEst: input.deliveryDateEst ? new Date(input.deliveryDateEst) : null,
      subtotal,
      taxTotal: input.taxTotal,
      shippingTotal: input.shippingTotal,
      discountTotal: input.discountTotal,
      grandTotal,
      tags: input.tags,
      notes: input.notes || null,
      source: "MANUAL",
      items: { create: items.map((i) => ({ ...i, userId })) },
    },
  });

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

export async function updateOrder(id: string, input: OrderInput) {
  const userId = await requireUserId();
  const existing = await db.order.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Order not found");

  const { items: rawItems, subtotal, grandTotal } = buildItemData(input);
  const items = await resolveProductIds(userId, rawItems);

  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId: id } }),
    db.order.update({
      where: { id },
      data: {
        orderNumber: input.orderNumber,
        retailerId: input.retailerId || null,
        storeLabel: input.storeLabel || null,
        status: input.status,
        priority: input.priority ?? "NORMAL",
        purchaseDate: new Date(input.purchaseDate),
        deliveryDateEst: input.deliveryDateEst ? new Date(input.deliveryDateEst) : null,
        subtotal,
        taxTotal: input.taxTotal,
        shippingTotal: input.shippingTotal,
        discountTotal: input.discountTotal,
        grandTotal,
        tags: input.tags,
        notes: input.notes || null,
        items: { create: items.map((i) => ({ ...i, userId })) },
      },
    }),
  ]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const userId = await requireUserId();
  await db.order.updateMany({ where: { id, userId }, data: { status } });
  if (status === "DELIVERED") {
    await materializeInventoryForOrder(userId, id);
    revalidatePath("/inventory");
  }
  if (status === "CANCELLED") {
    const order = await db.order.findUnique({ where: { id }, include: { retailer: true } });
    const who = order?.retailer?.name ?? order?.storeLabel ?? "An order";
    await notify(userId, "ORDER_CANCELLED", `${who} cancelled`, `Order #${order?.orderNumber ?? ""}`);
  }
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function bulkUpdateStatus(ids: string[], status: OrderStatus) {
  const userId = await requireUserId();
  await db.order.updateMany({ where: { id: { in: ids }, userId }, data: { status } });
  revalidatePath("/orders");
}

export async function deleteOrders(ids: string[]) {
  const userId = await requireUserId();
  await db.order.deleteMany({ where: { id: { in: ids }, userId } });
  revalidatePath("/orders");
}
