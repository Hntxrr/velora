import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { normalizeName } from "@/lib/product-match";

const dec = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

export type ProductDTO = {
  id: string;
  canonicalName: string;
  category: string | null;
  imageUrl: string | null;
  aliases: string[];
  lifetimeQty: number;
  orderCount: number;
  avgUnitCost: number;
  lowUnitPrice: number;
  highUnitPrice: number;
  retailers: string[];
  currentInventory: number;
  soldCount: number;
};

export type UnmatchedGroup = {
  normalizedName: string;
  sampleName: string;
  units: number;
  lines: number;
  itemIds: string[];
  retailers: string[];
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listProducts(): Promise<ProductDTO[]> {
  const userId = await requireUserId();
  const products = await db.product.findMany({
    where: { userId },
    include: {
      orderItems: { include: { order: { include: { retailer: true } } } },
      inventoryStacks: true,
      sales: true,
    },
    orderBy: { canonicalName: "asc" },
  });

  return products.map((p) => {
    const qty = p.orderItems.reduce((a, i) => a + i.quantity, 0);
    const costs = p.orderItems.map((i) => dec(i.effectiveUnitCost)).filter((n) => n > 0);
    const prices = p.orderItems.map((i) => dec(i.unitPrice)).filter((n) => n > 0);
    const avgUnitCost =
      costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    const retailers = Array.from(
      new Set(
        p.orderItems
          .map((i) => i.order.retailer?.name ?? i.order.storeLabel)
          .filter((x): x is string => !!x)
      )
    );
    return {
      id: p.id,
      canonicalName: p.canonicalName,
      category: p.category,
      imageUrl: p.imageUrl,
      aliases: p.aliases,
      lifetimeQty: qty,
      orderCount: new Set(p.orderItems.map((i) => i.orderId)).size,
      avgUnitCost,
      lowUnitPrice: prices.length ? Math.min(...prices) : 0,
      highUnitPrice: prices.length ? Math.max(...prices) : 0,
      retailers,
      currentInventory: p.inventoryStacks.reduce((a, s) => a + s.quantityAvailable, 0),
      soldCount: p.sales.reduce((a, s) => a + s.quantity, 0),
    };
  });
}

export async function getProduct(id: string) {
  const userId = await requireUserId();
  const products = await listProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return null;

  const items = await db.orderItem.findMany({
    where: { userId, productId: id },
    include: { order: { include: { retailer: true } } },
    orderBy: { order: { purchaseDate: "desc" } },
  });

  return {
    product,
    history: items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      rawName: i.rawName,
      retailer: i.order.retailer?.name ?? i.order.storeLabel ?? "—",
      quantity: i.quantity,
      unitPrice: dec(i.unitPrice),
      effectiveUnitCost: dec(i.effectiveUnitCost),
      purchaseDate: i.order.purchaseDate.toISOString(),
    })),
  };
}

/** Order items not yet linked to a product, grouped by normalized name. */
export async function getUnmatchedGroups(): Promise<UnmatchedGroup[]> {
  const userId = await requireUserId();
  const items = await db.orderItem.findMany({
    where: { userId, productId: null },
    include: { order: { include: { retailer: true } } },
  });

  const groups = new Map<string, UnmatchedGroup>();
  for (const it of items) {
    const key = normalizeName(it.rawName);
    if (!key) continue;
    const g = groups.get(key) ?? {
      normalizedName: key,
      sampleName: it.rawName,
      units: 0,
      lines: 0,
      itemIds: [],
      retailers: [],
    };
    g.units += it.quantity;
    g.lines += 1;
    g.itemIds.push(it.id);
    const retailer = it.order.retailer?.name ?? it.order.storeLabel;
    if (retailer && !g.retailers.includes(retailer)) g.retailers.push(retailer);
    groups.set(key, g);
  }

  return Array.from(groups.values()).sort((a, b) => b.units - a.units);
}
