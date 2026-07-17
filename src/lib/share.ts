import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";

const dec = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

export type SharePeriod = "today" | "week" | "month" | "lifetime";

export type ShareStats = {
  totalSpent: number;
  orders: number;
  units: number;
  delivered: number;
  cancelled: number;
  stickRate: number; // 0..1
  revenue: number;
  profit: number;
  roi: number; // 0..1
  inventoryValue: number;
};

export type ShareData = {
  user: { name: string; image: string | null };
  periods: Record<SharePeriod, ShareStats>;
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

function windowStart(period: SharePeriod): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      return new Date(now.getTime() - 7 * 864e5);
    case "month":
      return new Date(now.getTime() - 30 * 864e5);
    case "lifetime":
      return new Date(0);
  }
}

export async function getShareData(): Promise<ShareData> {
  const user = await requireUser();
  const userId = user.id;

  const [orders, sales, stacks] = await Promise.all([
    db.order.findMany({ where: { userId }, include: { items: true } }),
    db.sale.findMany({ where: { userId } }),
    db.inventoryStack.findMany({ where: { userId, quantityAvailable: { gt: 0 } } }),
  ]);

  const inventoryValue = stacks.reduce(
    (a, s) => a + (s.currentValue == null ? dec(s.avgCostBasis) : dec(s.currentValue)) * s.quantityAvailable,
    0
  );

  const periods = ["today", "week", "month", "lifetime"].reduce((acc, p) => {
    const period = p as SharePeriod;
    const start = windowStart(period);

    const periodOrders = orders.filter((o) => o.purchaseDate >= start && o.status !== "REFUNDED");
    const cancelled = periodOrders.filter((o) => o.status === "CANCELLED").length;
    const delivered = periodOrders.filter((o) => o.status === "DELIVERED").length;
    const notCancelled = periodOrders.length - cancelled;
    const stickDenom = notCancelled + cancelled;

    const periodSales = sales.filter((s) => s.saleDate >= start);
    const revenue = periodSales.reduce((a, s) => a + dec(s.salePriceEach) * s.quantity, 0);
    const costOfSold = periodSales.reduce((a, s) => a + dec(s.costBasisEach) * s.quantity, 0);
    const expenses = periodSales.reduce(
      (a, s) => a + dec(s.costBasisEach) * s.quantity + dec(s.fees) + dec(s.outboundShipping),
      0
    );
    const profit = revenue - expenses;

    acc[period] = {
      totalSpent: periodOrders.reduce((a, o) => a + dec(o.grandTotal), 0),
      orders: periodOrders.length,
      units: periodOrders.reduce((a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      delivered,
      cancelled,
      stickRate: stickDenom > 0 ? notCancelled / stickDenom : 0,
      revenue,
      profit,
      roi: costOfSold > 0 ? profit / costOfSold : 0,
      inventoryValue,
    };
    return acc;
  }, {} as Record<SharePeriod, ShareStats>);

  return {
    user: { name: user.name ?? "Reseller", image: user.image ?? null },
    periods,
  };
}
