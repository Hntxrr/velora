import { AppShell } from "@/components/shell/AppShell";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { listNotifications } from "@/lib/notifications";
import { countDrafts } from "@/lib/review";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [notifications, reviewCount] = await Promise.all([listNotifications(), countDrafts()]);
  return (
    <AppShell title="Notifications" reviewCount={reviewCount}>
      <div className="max-w-2xl">
        <NotificationsList notifications={notifications} />
      </div>
    </AppShell>
  );
}
