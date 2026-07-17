import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { ParsedOrder } from "@/lib/email/types";

export type DraftDTO = {
  id: string;
  retailerGuess: string | null;
  confidence: number;
  subject: string;
  fromAddress: string;
  receivedAt: string;
  parsed: ParsedOrder;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listDrafts(): Promise<DraftDTO[]> {
  const userId = await requireUserId();
  const drafts = await db.parsedOrderDraft.findMany({
    where: { userId, status: "NEEDS_REVIEW" },
    include: { rawEmail: true },
    orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
  });
  return drafts.map((d) => ({
    id: d.id,
    retailerGuess: d.retailerGuess,
    confidence: d.confidence,
    subject: d.rawEmail.subject,
    fromAddress: d.rawEmail.fromAddress,
    receivedAt: d.rawEmail.receivedAt.toISOString(),
    parsed: d.extractedJson as unknown as ParsedOrder,
  }));
}

export async function countDrafts(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return db.parsedOrderDraft.count({
    where: { userId: session.user.id, status: "NEEDS_REVIEW" },
  });
}
