import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications" reviewCount={3}>
      <EmptyState
        icon={Bell}
        title="Stay in the loop"
        description="In-app alerts, web push, and Discord webhooks for new orders and shipping updates arrive in the Notifications feature build."
      />
    </AppShell>
  );
}
