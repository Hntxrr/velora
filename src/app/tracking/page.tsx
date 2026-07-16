import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Truck } from "lucide-react";

export default function TrackingPage() {
  return (
    <AppShell title="Tracking" reviewCount={3}>
      <EmptyState
        icon={Truck}
        title="All your shipments, one place"
        description="Live all-carrier tracking with in-app status (shipped, out for delivery, delivered) and click-through to the carrier arrives in the Tracking feature build."
      />
    </AppShell>
  );
}
