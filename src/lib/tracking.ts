import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { ShipmentStatus, Prisma } from "@prisma/client";
import { trackingUrl, carrierName } from "@/lib/carriers";

export type ShipmentDTO = {
  id: string;
  orderId: string;
  orderNumber: string;
  retailerName: string | null;
  carrier: string | null;
  carrierName: string;
  trackingNumber: string;
  status: ShipmentStatus;
  statusUpdatedAt: string | null;
  trackingUrl: string;
};

type ShipmentWithOrder = Prisma.ShipmentGetPayload<{
  include: { order: { include: { retailer: true } } };
}>;

function toDTO(s: ShipmentWithOrder): ShipmentDTO {
  return {
    id: s.id,
    orderId: s.orderId,
    orderNumber: s.order.orderNumber,
    retailerName: s.order.retailer?.name ?? s.order.storeLabel ?? null,
    carrier: s.carrier,
    carrierName: carrierName(s.carrier),
    trackingNumber: s.trackingNumber,
    status: s.status,
    statusUpdatedAt: s.statusUpdatedAt?.toISOString() ?? null,
    trackingUrl: s.trackingUrl ?? trackingUrl(s.trackingNumber, s.carrier as never),
  };
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listShipments(): Promise<ShipmentDTO[]> {
  const userId = await requireUserId();
  const shipments = await db.shipment.findMany({
    where: { userId },
    include: { order: { include: { retailer: true } } },
    orderBy: { createdAt: "desc" },
  });
  return shipments.map(toDTO);
}

export async function listShipmentsForOrder(orderId: string): Promise<ShipmentDTO[]> {
  const userId = await requireUserId();
  const shipments = await db.shipment.findMany({
    where: { userId, orderId },
    include: { order: { include: { retailer: true } } },
    orderBy: { createdAt: "desc" },
  });
  return shipments.map(toDTO);
}

export type DeliveryEvent = {
  orderId: string;
  orderNumber: string;
  retailerName: string | null;
  date: string; // ISO
  actual: boolean; // true if delivered/actual date, false if estimate
  status: string;
};

/** Orders with an expected or actual delivery date within [start, end). */
export async function getDeliveryEvents(start: Date, end: Date): Promise<DeliveryEvent[]> {
  const userId = await requireUserId();
  const orders = await db.order.findMany({
    where: {
      userId,
      OR: [
        { deliveryDateEst: { gte: start, lt: end } },
        { deliveryDateActual: { gte: start, lt: end } },
      ],
    },
    include: { retailer: true },
  });

  return orders.map((o) => {
    const actual = !!o.deliveryDateActual;
    const date = (o.deliveryDateActual ?? o.deliveryDateEst)!;
    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      retailerName: o.retailer?.name ?? o.storeLabel ?? null,
      date: date.toISOString(),
      actual,
      status: o.status,
    };
  });
}
