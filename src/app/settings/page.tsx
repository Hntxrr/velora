import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" reviewCount={3}>
      <EmptyState
        icon={Settings}
        title="Settings"
        description="Account, connected inboxes (Gmail app password), notification preferences, Discord webhooks, subscription, and data export/delete."
      />
    </AppShell>
  );
}
