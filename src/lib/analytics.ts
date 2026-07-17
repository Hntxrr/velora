import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";

const dec = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" });
}

export type Overview = {
  totalSpentMonth: number;
  totalSpentLifetime: number;
  revenue: number;
  profit: number;
  roi: number;
  stickRate: number;
  ordersCount: number;
  unitsCount: number;
  arrivingCount: number;
  pendingCount: number;
};

export async function getOverview(): Promise<Overview> {
  const userId = await requireUserId();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const in7 = new Date(now.getTime() + 7 * 864e5);

  const [orders, sales, confirmed, cancelled, arriving, pending] = await Promise.all([
    db.order.findMany({
      where: { userId, status: { not: "REFUNDED" } },
      include: { items: true },
    }),
    db.sale.findMany({ where: { userId } }),
    db.order.count({ where: { userId, status: { not: "REFUNDED" } } }),
    db.order.count({ where: { userId, status: "CANCELLED" } }),
    db.order.count({
      where: {
        userId,
        status: { in: ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY"] },
        deliveryDateEst: { gte: now, lte: in7 },
      },
    }),
    db.order.count({
      where: { userId, status: { in: ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY"] } },
    }),
  ]);

  const totalSpentLifetime = orders.reduce((a, o) => a + dec(o.grandTotal), 0);
  const totalSpentMonth = orders
    .filter((o) => o.purchaseDate >= monthStart)
    .reduce((a, o) => a + dec(o.grandTotal), 0);
  const unitsCount = orders.reduce(
    (a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const revenue = sales.reduce((a, s) => a + dec(s.salePriceEach) * s.quantity, 0);
  const costOfSold = sales.reduce((a, s) => a + dec(s.costBasisEach) * s.quantity, 0);
  const expenses = sales.reduce(
    (a, s) => a + dec(s.costBasisEach) * s.quantity + dec(s.fees) + dec(s.outboundShipping),
    0
  );
  const profit = revenue - expenses;

  // Stick rate = confirmed (not cancelled) / (confirmed + cancelled).
  const notCancelled = confirmed - cancelled;
  const stickDenom = notCancelled + cancelled;
  const stickRate = stickDenom > 0 ? notCancelled / stickDenom : 0;

  return {
    totalSpentMonth,
    totalSpentLifetime,
    revenue,
    profit,
    roi: costOfSold > 0 ? profit / costOfSold : 0,
    stickRate,
    ordersCount: confirmed,
    unitsCount,
    arrivingCount: arriving,
    pendingCount: pending,
  };
}

export type TrendPoint = { label: string; spend: number; profit: number };

export async function getSpendProfitTrend(months = 6): Promise<TrendPoint[]> {
  const userId = await requireUserId();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [orders, sales] = await Promise.all([
    db.order.findMany({
      where: { userId, status: { not: "REFUNDED" }, purchaseDate: { gte: start } },
      select: { purchaseDate: true, grandTotal: true },
    }),
    db.sale.findMany({
      where: { userId, saleDate: { gte: start } },
      select: { saleDate: true, salePriceEach: true, quantity: true, costBasisEach: true, fees: true, outboundShipping: true },
    }),
  ]);

  const buckets = new Map<string, TrendPoint>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    buckets.set(monthKey(d), { label: monthLabel(d), spend: 0, profit: 0 });
  }

  for (const o of orders) {
    const b = buckets.get(monthKey(o.purchaseDate));
    if (b) b.spend += dec(o.grandTotal);
  }
  for (const s of sales) {
    const b = buckets.get(monthKey(s.saleDate));
    if (b) {
      const rev = dec(s.salePriceEach) * s.quantity;
      const exp = dec(s.costBasisEach) * s.quantity + dec(s.fees) + dec(s.outboundShipping);
      b.profit += rev - exp;
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    ...b,
    spend: Math.round(b.spend),
    profit: Math.round(b.profit),
  }));
}

export type RetailerSlice = { name: string; spend: number; orders: number };

export async function getRetailerBreakdown(): Promise<RetailerSlice[]> {
  const userId = await requireUserId();
  const orders = await db.order.findMany({
    where: { userId, status: { not: "REFUNDED" } },
    include: { retailer: true },
  });
  const map = new Map<string, RetailerSlice>();
  for (const o of orders) {
    const name = o.retailer?.name ?? o.storeLabel ?? "Other";
    const s = map.get(name) ?? { name, spend: 0, orders: 0 };
    s.spend += dec(o.grandTotal);
    s.orders += 1;
    map.set(name, s);
  }
  return Array.from(map.values())
    .map((s) => ({ ...s, spend: Math.round(s.spend) }))
    .sort((a, b) => b.spend - a.spend);
}

export type DeliveryPerformance = { avgDays: number; onTimePct: number; delivered: number };

export async function getDeliveryPerformance(): Promise<DeliveryPerformance> {
  const userId = await requireUserId();
  const orders = await db.order.findMany({
    where: { userId, status: "DELIVERED", deliveryDateActual: { not: null } },
    select: { purchaseDate: true, deliveryDateActual: true, deliveryDateEst: true },
  });
  if (orders.length === 0) return { avgDays: 0, onTimePct: 0, delivered: 0 };

  let totalDays = 0;
  let onTime = 0;
  for (const o of orders) {
    const actual = o.deliveryDateActual!;
    const days = Math.max(0, Math.round((actual.getTime() - o.purchaseDate.getTime()) / 864e5));
    totalDays += days;
    if (o.deliveryDateEst && actual <= o.deliveryDateEst) onTime++;
  }
  return {
    avgDays: Math.round(totalDays / orders.length),
    onTimePct: orders.length > 0 ? onTime / orders.length : 0,
    delivered: orders.length,
  };
}
