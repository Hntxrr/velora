"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function markRead(id: string) {
  const userId = await requireUserId();
  await db.notification.updateMany({ where: { id, userId }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function markAllRead() {
  const userId = await requireUserId();
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function deleteNotification(id: string) {
  const userId = await requireUserId();
  await db.notification.deleteMany({ where: { id, userId } });
  revalidatePath("/notifications");
}

export async function clearNotifications() {
  const userId = await requireUserId();
  await db.notification.deleteMany({ where: { userId } });
  revalidatePath("/notifications");
}
