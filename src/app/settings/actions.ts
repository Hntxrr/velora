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


// ─── Discord webhooks ───────────────────────────────────────────

import { sendDiscord } from "@/lib/webhooks";

export async function addWebhook(input: { url: string; events: string[] }) {
  const userId = await requireUserId();
  const url = input.url.trim();
  if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(url)) {
    throw new Error("Enter a valid Discord webhook URL");
  }
  await db.webhookConfig.create({
    data: { userId, kind: "DISCORD", url, events: input.events, enabled: true },
  });
  revalidatePath("/settings");
}

export async function toggleWebhook(id: string, enabled: boolean) {
  const userId = await requireUserId();
  await db.webhookConfig.updateMany({ where: { id, userId }, data: { enabled } });
  revalidatePath("/settings");
}

export async function deleteWebhook(id: string) {
  const userId = await requireUserId();
  await db.webhookConfig.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
}

export async function testWebhook(id: string) {
  const userId = await requireUserId();
  const hook = await db.webhookConfig.findFirst({ where: { id, userId } });
  if (!hook) throw new Error("Webhook not found");
  const ok = await sendDiscord(hook.url, {
    title: "Velora test notification",
    description: "Your Discord webhook is connected and working.",
  });
  return { ok };
}


// ─── Profile & account ──────────────────────────────────────────

import { redirect } from "next/navigation";
import { signOut } from "@/auth";

export async function updateProfile(input: { name: string }) {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { name: input.name.trim() || null } });
  revalidatePath("/settings");
}

/** Demo plan switch. Real billing (Stripe) plugs in here later. */
export async function setPlan(plan: "FREE" | "PRO") {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { plan } });
  revalidatePath("/", "layout");
}

export async function deleteAccount() {
  const userId = await requireUserId();
  // Cascades remove all user-owned rows (see schema onDelete: Cascade).
  await db.user.delete({ where: { id: userId } });
  await signOut({ redirect: false });
  redirect("/login");
}
