import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { OrderStatus, OrderPriority, Prisma } from "@prisma/client";

/** Plain (serializable) shapes passed to client components. */
export type OrderItemDTO = {
  id: string;
  rawName: string;
  quantity: number;
  unitPrice: number;
  allocatedTax: number;
  allocatedShipping: number;
  allocatedDiscount: number;
  effectiveUnitCost: number;
  productId: string | null;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  retailerId: string | null;
  retailerName: string | null;
  storeLabel: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  purchaseDate: string;
  deliveryDateEst: string | null;
  deliveryDateActual: string | null;
  shippingAddress: string | null;
  accountEmail: string | null;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  tags: string[];
  notes: string | null;
  source: string;
  itemCount: number;
  unitCount: number;
  items: OrderItemDTO[];
  createdAt: string;
};

const dec = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { retailer: true; items: true };
}>;

function toDTO(o: OrderWithRelations): OrderDTO {
  const items = o.items.map((it) => ({
    id: it.id,
    rawName: it.rawName,
    quantity: it.quantity,
    unitPrice: dec(it.unitPrice),
    allocatedTax: dec(it.allocatedTax),
    allocatedShipping: dec(it.allocatedShipping),
    allocatedDiscount: dec(it.allocatedDiscount),
    effectiveUnitCost: dec(it.effectiveUnitCost),
    productId: it.productId,
  }));
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    retailerId: o.retailerId,
    retailerName: o.retailer?.name ?? null,
    storeLabel: o.storeLabel,
    status: o.status,
    priority: o.priority,
    purchaseDate: o.purchaseDate.toISOString(),
    deliveryDateEst: o.deliveryDateEst?.toISOString() ?? null,
    deliveryDateActual: o.deliveryDateActual?.toISOString() ?? null,
    shippingAddress: o.shippingAddress,
    accountEmail: o.accountEmail,
    subtotal: dec(o.subtotal),
    taxTotal: dec(o.taxTotal),
    shippingTotal: dec(o.shippingTotal),
    discountTotal: dec(o.discountTotal),
    grandTotal: dec(o.grandTotal),
    tags: o.tags,
    notes: o.notes,
    source: o.source,
    itemCount: items.length,
    unitCount: items.reduce((a, b) => a + b.quantity, 0),
    items,
    createdAt: o.createdAt.toISOString(),
  };
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export type OrderListFilters = {
  status?: OrderStatus;
  search?: string;
  sort?: "purchaseDate" | "grandTotal" | "orderNumber" | "status";
  dir?: "asc" | "desc";
};

export async function listOrders(filters: OrderListFilters = {}): Promise<OrderDTO[]> {
  const userId = await requireUserId();
  const where: Prisma.OrderWhereInput = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: "insensitive" } },
      { retailer: { name: { contains: filters.search, mode: "insensitive" } } },
      { items: { some: { rawName: { contains: filters.search, mode: "insensitive" } } } },
    ];
  }
  const sort = filters.sort ?? "purchaseDate";
  const dir = filters.dir ?? "desc";

  const orders = await db.order.findMany({
    where,
    include: { retailer: true, items: true },
    orderBy: { [sort]: dir },
  });
  return orders.map(toDTO);
}

export async function getOrder(id: string): Promise<OrderDTO | null> {
  const userId = await requireUserId();
  const order = await db.order.findFirst({
    where: { id, userId },
    include: { retailer: true, items: true },
  });
  return order ? toDTO(order) : null;
}

export async function listRetailers() {
  return db.retailer.findMany({ orderBy: { name: "asc" } });
}
