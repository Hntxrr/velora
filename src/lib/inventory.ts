import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";

const dec = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

export type StackDTO = {
  id: string;
  productId: string;
  productName: string;
  quantityAvailable: number;
  quantityInitial: number;
  avgCostBasis: number;
  currentValue: number | null;
  unrealized: number; // (currentValue - costBasis) * qty
  locationLabel: string | null;
  notes: string | null;
};

export type SaleDTO = {
  id: string;
  productName: string;
  saleDate: string;
  marketplace: string | null;
  quantity: number;
  salePriceEach: number;
  fees: number;
  outboundShipping: number;
  costBasisEach: number;
  profit: number;
  roi: number;
};

export type InventorySummary = {
  unitsInStock: number;
  inventoryCost: number;
  inventoryMarketValue: number;
  revenue: number;
  matchedExpenses: number;
  profit: number;
  roi: number;
  salesCount: number;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listStacks(includeEmpty = false): Promise<StackDTO[]> {
  const userId = await requireUserId();
  const stacks = await db.inventoryStack.findMany({
    where: { userId, ...(includeEmpty ? {} : { quantityAvailable: { gt: 0 } }) },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return stacks.map((s) => {
    const cost = dec(s.avgCostBasis);
    const market = s.currentValue == null ? null : dec(s.currentValue);
    return {
      id: s.id,
      productId: s.productId,
      productName: s.product.canonicalName,
      quantityAvailable: s.quantityAvailable,
      quantityInitial: s.quantityInitial,
      avgCostBasis: cost,
      currentValue: market,
      unrealized: market == null ? 0 : (market - cost) * s.quantityAvailable,
      locationLabel: s.locationLabel,
      notes: s.notes,
    };
  });
}

export async function listSales(): Promise<SaleDTO[]> {
  const userId = await requireUserId();
  const sales = await db.sale.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { saleDate: "desc" },
  });
  return sales.map((s) => {
    const cost = dec(s.costBasisEach) * s.quantity;
    const profit = dec(s.profit);
    return {
      id: s.id,
      productName: s.product?.canonicalName ?? "—",
      saleDate: s.saleDate.toISOString(),
      marketplace: s.marketplace,
      quantity: s.quantity,
      salePriceEach: dec(s.salePriceEach),
      fees: dec(s.fees),
      outboundShipping: dec(s.outboundShipping),
      costBasisEach: dec(s.costBasisEach),
      profit,
      roi: cost > 0 ? profit / cost : 0,
    };
  });
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const [stacks, sales] = await Promise.all([listStacks(), listSales()]);

  const unitsInStock = stacks.reduce((a, s) => a + s.quantityAvailable, 0);
  const inventoryCost = stacks.reduce((a, s) => a + s.avgCostBasis * s.quantityAvailable, 0);
  const inventoryMarketValue = stacks.reduce(
    (a, s) => a + (s.currentValue ?? s.avgCostBasis) * s.quantityAvailable,
    0
  );

  const revenue = sales.reduce((a, s) => a + s.salePriceEach * s.quantity, 0);
  const matchedExpenses = sales.reduce(
    (a, s) => a + s.costBasisEach * s.quantity + s.fees + s.outboundShipping,
    0
  );
  const costOfSold = sales.reduce((a, s) => a + s.costBasisEach * s.quantity, 0);
  const profit = revenue - matchedExpenses;

  return {
    unitsInStock,
    inventoryCost,
    inventoryMarketValue,
    revenue,
    matchedExpenses,
    profit,
    roi: costOfSold > 0 ? profit / costOfSold : 0,
    salesCount: sales.length,
  };
}
