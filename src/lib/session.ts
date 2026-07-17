import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Plan } from "@prisma/client";

/** Get the current session in a server component / server action. */
export async function getSession() {
  return auth();
}

/** Current user's plan, read from the DB (source of truth, reflects upgrades immediately). */
export async function getPlan(): Promise<Plan | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  return user?.plan ?? "FREE";
}

/** True when the signed-in user is on the Pro plan (gates paid features). */
export async function isPro(): Promise<boolean> {
  return (await getPlan()) === "PRO";
}
