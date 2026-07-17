import { AppShell } from "@/components/shell/AppShell";
import { InboxManager } from "@/components/settings/InboxManager";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { listInboxes } from "@/lib/inboxes";
import { listWebhooks } from "@/lib/notifications";
import { countDrafts } from "@/lib/review";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [inboxes, webhooks, reviewCount] = await Promise.all([
    listInboxes(),
    listWebhooks(),
    countDrafts(),
  ]);
  return (
    <AppShell title="Settings" reviewCount={reviewCount}>
      <div className="max-w-3xl space-y-8">
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
