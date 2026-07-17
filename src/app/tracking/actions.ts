"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { ShipmentStatus } from "@prisma/client";
import { detectCarrier, trackingUrl } from "@/lib/carriers";
import { materializeInventoryForOrder } from "@/lib/inventory-materialize";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/** Map a shipment status onto the parent order's status. */
function orderStatusFor(shipmentStatus: ShipmentStatus) {
  switch (shipmentStatus) {
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY" as const;
    case "DELIVERED":
      return "DELIVERED" as const;
    case "IN_TRANSIT":
    case "PENDING":
      return "SHIPPED" as const;
    default:
      return null;
  }
}

export async function addShipment(input: {
  orderId: string;
  trackingNumber: string;
  carrier?: string | null;
  status?: ShipmentStatus;
}) {
  const userId = await requireUserId();
  const order = await db.order.findFirst({ where: { id: input.orderId, userId } });
  if (!order) throw new Error("Order not found");

  const carrier = input.carrier || detectCarrier(input.trackingNumber);
  const status = input.status ?? "IN_TRANSIT";

  await db.shipment.create({
    data: {
      userId,
      orderId: input.orderId,
      trackingNumber: input.trackingNumber.trim(),
      carrier,
      status,
      statusUpdatedAt: new Date(),
      trackingUrl: trackingUrl(input.trackingNumber, carrier as never),
    },
  });

  // Advance the order status if the shipment implies progress.
  const nextOrderStatus = orderStatusFor(status);
  if (nextOrderStatus && order.status === "CONFIRMED") {
    await db.order.update({ where: { id: order.id }, data: { status: nextOrderStatus } });
  }

  revalidatePath("/tracking");
  revalidatePath(`/orders/${input.orderId}`);
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus) {
  const userId = await requireUserId();
  const shipment = await db.shipment.findFirst({ where: { id, userId } });
  if (!shipment) throw new Error("Shipment not found");

  await db.shipment.update({
    where: { id },
    data: { status, statusUpdatedAt: new Date() },
  });

  const nextOrderStatus = orderStatusFor(status);
  if (nextOrderStatus) {
    const data: { status: typeof nextOrderStatus; deliveryDateActual?: Date } = {
      status: nextOrderStatus,
    };
    if (status === "DELIVERED") data.deliveryDateActual = new Date();
    await db.order.update({ where: { id: shipment.orderId }, data });
  }

  if (status === "DELIVERED") {
    await materializeInventoryForOrder(userId, shipment.orderId);
    revalidatePath("/inventory");
  }

  revalidatePath("/tracking");
  revalidatePath(`/orders/${shipment.orderId}`);
}

export async function deleteShipment(id: string) {
  const userId = await requireUserId();
  const shipment = await db.shipment.findFirst({ where: { id, userId } });
  if (!shipment) return;
  await db.shipment.delete({ where: { id } });
  revalidatePath("/tracking");
  revalidatePath(`/orders/${shipment.orderId}`);
}
