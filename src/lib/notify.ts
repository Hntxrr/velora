import "server-only";
import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";
import { sendDiscord } from "@/lib/webhooks";

/**
 * Create an in-app notification and fan out to the user's Discord webhooks that
 * subscribe to this event type. Fails soft so it never blocks the main action.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string
) {
  try {
    await db.notification.create({
      data: { userId, type, title, body: body ?? null },
    });

    const hooks = await db.webhookConfig.findMany({
      where: { userId, kind: "DISCORD", enabled: true },
    });
    await Promise.all(
      hooks
        .filter((h) => h.events.length === 0 || h.events.includes(type))
        .map((h) => sendDiscord(h.url, { title, description: body }))
    );
  } catch {
    // Never let notifications break the primary flow.
  }
}
