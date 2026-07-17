"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { normalizeName } from "@/lib/product-match";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/** Link a set of order items to a product and remember the match for the future. */
async function linkItems(
  userId: string,
  productId: string,
  itemIds: string[],
  normalizedName: string,
  sampleName: string
) {
  await db.orderItem.updateMany({
    where: { id: { in: itemIds }, userId },
    data: { productId },
  });

  // Sticky rule so future emails/orders with this name auto-link.
  if (normalizedName) {
    const existing = await db.productMatchRule.findFirst({
      where: { userId, matchPattern: normalizedName },
    });
    if (!existing) {
      await db.productMatchRule.create({
        data: { userId, productId, matchPattern: normalizedName },
      });
    } else if (existing.productId !== productId) {
      await db.productMatchRule.update({
        where: { id: existing.id },
        data: { productId },
      });
    }
  }

  // Track the raw name as an alias.
  const product = await db.product.findFirst({ where: { id: productId, userId } });
  if (product && sampleName && !product.aliases.includes(sampleName)) {
    await db.product.update({
      where: { id: productId },
      data: { aliases: { push: sampleName } },
    });
  }
}

export async function createProductFromGroup(input: {
  name: string;
  category?: string | null;
  normalizedName: string;
  sampleName: string;
  itemIds: string[];
}) {
  const userId = await requireUserId();
  const product = await db.product.create({
    data: {
      userId,
      canonicalName: input.name.trim() || input.sampleName,
      category: input.category?.trim() || null,
      aliases: [],
    },
  });
  await linkItems(userId, product.id, input.itemIds, input.normalizedName, input.sampleName);
  revalidatePath("/products");
  return { productId: product.id };
}

export async function assignGroupToProduct(input: {
  productId: string;
  normalizedName: string;
  sampleName: string;
  itemIds: string[];
}) {
  const userId = await requireUserId();
  await linkItems(userId, input.productId, input.itemIds, input.normalizedName, input.sampleName);
  revalidatePath("/products");
}

export async function createProduct(input: { name: string; category?: string | null }) {
  const userId = await requireUserId();
  const product = await db.product.create({
    data: {
      userId,
      canonicalName: input.name.trim(),
      category: input.category?.trim() || null,
      aliases: [],
    },
  });
  revalidatePath("/products");
  return { productId: product.id };
}

export async function renameProduct(id: string, name: string, category?: string | null) {
  const userId = await requireUserId();
  await db.product.updateMany({
    where: { id, userId },
    data: { canonicalName: name.trim(), category: category?.trim() || null },
  });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

/** Merge source product into target: move all references, merge aliases, delete source. */
export async function mergeProducts(sourceId: string, targetId: string) {
  const userId = await requireUserId();
  if (sourceId === targetId) return;
  const [source, target] = await Promise.all([
    db.product.findFirst({ where: { id: sourceId, userId } }),
    db.product.findFirst({ where: { id: targetId, userId } }),
  ]);
  if (!source || !target) throw new Error("Product not found");

  await db.$transaction([
    db.orderItem.updateMany({ where: { userId, productId: sourceId }, data: { productId: targetId } }),
    db.inventoryStack.updateMany({ where: { userId, productId: sourceId }, data: { productId: targetId } }),
    db.sale.updateMany({ where: { userId, productId: sourceId }, data: { productId: targetId } }),
    db.productMatchRule.updateMany({ where: { userId, productId: sourceId }, data: { productId: targetId } }),
    db.product.update({
      where: { id: targetId },
      data: {
        aliases: Array.from(new Set([...target.aliases, ...source.aliases, source.canonicalName])),
      },
    }),
    db.product.delete({ where: { id: sourceId } }),
  ]);

  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  const userId = await requireUserId();
  // Unlink references first (keep the orders/inventory, just drop the product link).
  await db.$transaction([
    db.orderItem.updateMany({ where: { userId, productId: id }, data: { productId: null } }),
    db.productMatchRule.deleteMany({ where: { userId, productId: id } }),
    db.product.deleteMany({ where: { id, userId } }),
  ]);
  revalidatePath("/products");
}
