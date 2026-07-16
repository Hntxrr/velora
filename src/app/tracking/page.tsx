import { AppShell } from "@/components/shell/AppShell";
import { TrackingBoard } from "@/components/tracking/TrackingBoard";
import { listShipments } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const shipments = await listShipments();
  return (
    <AppShell title="Tracking">
      <TrackingBoard shipments={shipments} />
    </AppShell>
  );
}
