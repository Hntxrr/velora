import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

export default function ReviewPage() {
  return (
    <AppShell title="Review Queue" reviewCount={3}>
      <EmptyState
        icon={Inbox}
        title="Parsed orders land here"
        description="Forwarded order emails are parsed into drafts you approve with one click before they become orders — the trust layer that keeps your numbers accurate."
      />
    </AppShell>
  );
}
