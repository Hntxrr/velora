import "server-only";
import { db } from "@/lib/db";

/** Normalize a raw item name for grouping + matching (case/space/punct-insensitive). */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a productId for a raw item name using the user's saved match rules.
 * Used when creating orders (manual or from email) so confirmed matches stick.
 */
export async function matchProductId(userId: string, rawName: string): Promise<string | null> {
  const normalized = normalizeName(rawName);
  if (!normalized) return null;
  const rule = await db.productMatchRule.findFirst({
    where: { userId, matchPattern: normalized },
  });
  return rule?.productId ?? null;
}
