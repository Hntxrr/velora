import { AppShell } from "@/components/shell/AppShell";
import { InboxManager } from "@/components/settings/InboxManager";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { listInboxes } from "@/lib/inboxes";
import { listWebhooks } from "@/lib/notifications";
import { countDrafts } from "@/lib/review";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [inboxes, webhooks, reviewCount, user] = await Promise.all([
    listInboxes(),
    listWebhooks(),
    countDrafts(),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, plan: true },
    }),
  ]);
  return (
    <AppShell title="Settings" reviewCount={reviewCount}>
      <div className="max-w-3xl space-y-8">
        <section>
          <h2 className="mb-1 font-display text-[17px] font-semibold text-fg">Account</h2>
          <p className="mb-5 text-[13px] text-fg-muted">Your profile, plan, and data.</p>
          <AccountSettings
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            plan={(user?.plan ?? "FREE") as "FREE" | "PRO"}
          />
        </section>

        <section>
          <h2 className="mb-1 font-display text-[17px] font-semibold text-fg">Email &amp; sync</h2>
          <p className="mb-5 text-[13px] text-fg-muted">
            Connect the inbox your order emails land in. Velora parses them into orders you
            approve in the Review Queue.
          </p>
          <InboxManager inboxes={inboxes} />
        </section>

        <section>
          <h2 className="mb-1 font-display text-[17px] font-semibold text-fg">Notifications</h2>
          <p className="mb-5 text-[13px] text-fg-muted">
            Push order and shipping updates to Discord.
          </p>
          <WebhookManager webhooks={webhooks} />
        </section>
      </div>
    </AppShell>
  );
}
