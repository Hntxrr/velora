import "server-only";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { fetchMessages } from "./imap";
import { parseEmail } from "./parsers";
import { notify } from "@/lib/notify";

const FIRST_SYNC_WINDOW_DAYS = 90;

export type SyncResult = {
  connectionId: string;
  fetched: number;
  newDrafts: number;
  error?: string;
};

/** Sync a single email connection: fetch new mail, parse, queue drafts. */
export async function syncConnection(connectionId: string): Promise<SyncResult> {
  const connection = await db.emailConnection.findUnique({ where: { id: connectionId } });
  if (!connection) return { connectionId, fetched: 0, newDrafts: 0, error: "Connection not found" };

  await db.emailConnection.update({
    where: { id: connectionId },
    data: { status: "SYNCING" },
  });

  try {
    const password = decryptSecret(connection.encryptedCredential);
    const since =
      connection.lastSyncedAt ??
      new Date(Date.now() - FIRST_SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const messages = await fetchMessages({
      email: connection.emailAddress,
      password,
      since,
    });

    let newDrafts = 0;

    for (const msg of messages) {
      // Dedupe on (connectionId, messageId).
      const exists = await db.rawEmail.findUnique({
        where: {
          connectionId_messageId: {
            connectionId: connection.id,
            messageId: msg.messageId,
          },
        },
      });
      if (exists) continue;

      const parsed = parseEmail(msg);
      const retailer = parsed.retailerSlug
        ? await db.retailer.findUnique({ where: { slug: parsed.retailerSlug } })
        : null;

      // Only queue emails that look like orders/shipping with some signal.
      const isRelevant =
        (parsed.kind === "order" || parsed.kind === "shipping") &&
        (parsed.orderNumber !== null || parsed.grandTotal > 0 || parsed.items.length > 0);

      const raw = await db.rawEmail.create({
        data: {
          userId: connection.userId,
          connectionId: connection.id,
          messageId: msg.messageId,
          fromAddress: msg.from,
          subject: msg.subject,
          receivedAt: msg.date,
          detectedRetailerId: retailer?.id ?? null,
          parseStatus: isRelevant ? "PARSED" : "IGNORED",
        },
      });

      if (isRelevant) {
        await db.parsedOrderDraft.create({
          data: {
            userId: connection.userId,
            rawEmailId: raw.id,
            retailerGuess: parsed.retailerSlug,
            extractedJson: parsed as unknown as object,
            confidence: parsed.confidence,
            status: "NEEDS_REVIEW",
          },
        });
        newDrafts++;
        await notify(
          connection.userId,
          "ORDER_PARSED",
          `New order to review${retailer ? ` — ${retailer.name}` : ""}`,
          parsed.orderNumber ? `Order #${parsed.orderNumber}` : msg.subject
        );
      }
    }

    await db.emailConnection.update({
      where: { id: connectionId },
      data: { status: "ACTIVE", lastSyncedAt: new Date() },
    });

    return { connectionId, fetched: messages.length, newDrafts };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Sync failed";
    await db.emailConnection.update({
      where: { id: connectionId },
      data: { status: "ERROR" },
    });
    return { connectionId, fetched: 0, newDrafts: 0, error };
  }
}

/** Sync every connection for a user (used by "Sync now" and the worker). */
export async function syncUser(userId: string): Promise<SyncResult[]> {
  const connections = await db.emailConnection.findMany({
    where: { userId, status: { not: "DISCONNECTED" } },
  });
  const results: SyncResult[] = [];
  for (const c of connections) {
    results.push(await syncConnection(c.id));
  }
  return results;
}
