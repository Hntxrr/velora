"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { encryptSecret } from "@/lib/crypto";
import { syncUser } from "@/lib/email/ingest";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/** Connect a Gmail inbox using an app password (stored encrypted). */
export async function connectInbox(input: { emailAddress: string; appPassword: string }) {
  const userId = await requireUserId();
  const emailAddress = input.emailAddress.trim().toLowerCase();
  const appPassword = input.appPassword.replace(/\s+/g, "");
  if (!emailAddress || !appPassword) throw new Error("Email and app password are required");

  await db.emailConnection.create({
    data: {
      userId,
      provider: "GMAIL_IMAP",
      emailAddress,
      encryptedCredential: encryptSecret(appPassword),
      status: "ACTIVE",
    },
  });
  revalidatePath("/settings");
}

export async function disconnectInbox(id: string) {
  const userId = await requireUserId();
  await db.emailConnection.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
}

/** Trigger an on-demand sync of all the user's inboxes. */
export async function syncNow() {
  const userId = await requireUserId();
  const results = await syncUser(userId);
  revalidatePath("/settings");
  revalidatePath("/review");
  const newDrafts = results.reduce((a, r) => a + r.newDrafts, 0);
  const error = results.find((r) => r.error)?.error ?? null;
  return { newDrafts, error };
}
