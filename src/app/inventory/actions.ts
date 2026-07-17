"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/auth";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Manually add an inventory stack (for items not sourced from a delivered order). */
export async function addInventory(input: {
  productId: string;
  quantity: number;
  costBasis: number;
  currentValue?: number | null;
  locationLabel?: string | null;
}) {
  const userId = await requireUserId();
  const product = await db.product.findFirst({ where: { id: input.productId, userId } });
  if (!product) throw new Error("Product not found");
  const qty = Math.max(1, Math.floor(input.quantity));

  await db.inventoryStack.create({
    data: {
      userId,
      productId: input.productId,
      quantityInitial: qty,
      quantityAvailable: qty,
      avgCostBasis: round2(input.costBasis),
      currentValue: input.currentValue != null ? round2(input.currentValue) : null,
      locationLabel: input.locationLabel?.trim() || null,
      status: "SEALED",
    },
  });
  revalidatePath("/inventory");
}

export async function updateStack(
  id: string,
  data: { currentValue?: number | null; locationLabel?: string | null; notes?: string | null }
) {
  const userId = await requireUserId();
  await db.inventoryStack.updateMany({
    where: { id, userId },
    data: {
      currentValue: data.currentValue != null ? round2(data.currentValue) : undefined,
      locationLabel: data.locationLabel ?? undefined,
      notes: data.notes ?? undefined,
    },
  });
  revalidatePath("/inventory");
}

export async function deleteStack(id: string) {
  const userId = await requireUserId();
  await db.inventoryStack.deleteMany({ where: { id, userId } });
  revalidatePath("/inventory");
}

/** Record a sale from a stack: computes true profit and decrements the stack. */
export async function recordSale(input: {
  stackId: string;
  quantity: number;
  salePriceEach: number;
  marketplace?: string | null;
  fees?: number;
  outboundShipping?: number;
  saleDate?: string | null;
}) {
  const userId = await requireUserId();
  const stack = await db.inventoryStack.findFirst({ where: { id: input.stackId, userId } });
  if (!stack) throw new Error("Inventory not found");

  const qty = Math.max(1, Math.floor(input.quantity));
  if (qty > stack.quantityAvailable) throw new Error("Not enough units in stock");

  const costBasisEach = Number(stack.avgCostBasis.toString());
  const salePriceEach = round2(input.salePriceEach);
  const fees = round2(input.fees ?? 0);
  const outboundShipping = round2(input.outboundShipping ?? 0);
  const profit = round2(salePriceEach * qty - fees - outboundShipping - costBasisEach * qty);

  await db.$transaction([
    db.sale.create({
      data: {
        userId,
        inventoryStackId: stack.id,
        productId: stack.productId,
        saleDate: input.saleDate ? new Date(input.saleDate) : new Date(),
        marketplace: input.marketplace?.trim() || null,
        quantity: qty,
        salePriceEach,
        fees,
        outboundShipping,
        costBasisEach: round2(costBasisEach),
        profit,
      },
    }),
    db.inventoryStack.update({
      where: { id: stack.id },
      data: { quantityAvailable: stack.quantityAvailable - qty },
    }),
  ]);

  revalidatePath("/inventory");
}

export async function deleteSale(id: string) {
  const userId = await requireUserId();
  const sale = await db.sale.findFirst({ where: { id, userId } });
  if (!sale) return;

  const ops: Prisma.PrismaPromise<unknown>[] = [db.sale.delete({ where: { id } })];
  // Restore units to the originating stack if it still exists.
  if (sale.inventoryStackId) {
    const stack = await db.inventoryStack.findFirst({ where: { id: sale.inventoryStackId, userId } });
    if (stack) {
      ops.push(
        db.inventoryStack.update({
          where: { id: stack.id },
          data: { quantityAvailable: stack.quantityAvailable + sale.quantity },
        })
      );
    }
  }
  await db.$transaction(ops);
  revalidatePath("/inventory");
}
