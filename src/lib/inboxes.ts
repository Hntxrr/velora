import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type InboxDTO = {
  id: string;
  emailAddress: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listInboxes(): Promise<InboxDTO[]> {
  const userId = await requireUserId();
  const rows = await db.emailConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((c) => ({
    id: c.id,
    emailAddress: c.emailAddress,
    provider: c.provider,
    status: c.status,
    lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
  }));
}
