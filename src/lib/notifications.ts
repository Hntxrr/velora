import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { NotificationType } from "@prisma/client";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listNotifications(): Promise<NotificationDTO[]> {
  const userId = await requireUserId();
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function countUnread(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return db.notification.count({ where: { userId: session.user.id, read: false } });
}

export type WebhookDTO = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
};

export async function listWebhooks(): Promise<WebhookDTO[]> {
  const userId = await requireUserId();
  const rows = await db.webhookConfig.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((w) => ({ id: w.id, url: w.url, events: w.events, enabled: w.enabled }));
}
