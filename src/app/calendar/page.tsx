import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <AppShell title="Calendar" reviewCount={3}>
      <EmptyState
        icon={Calendar}
        title="Delivery calendar"
        description="See exactly what's arriving each day — like 2 orders arriving Tuesday. Built alongside the Tracking feature."
      />
    </AppShell>
  );
}
