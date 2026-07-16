import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Boxes } from "lucide-react";

export default function InventoryPage() {
  return (
    <AppShell title="Inventory" reviewCount={3}>
      <EmptyState
        icon={Boxes}
        title="Inventory &amp; sales"
        description="Sealed inventory stacks appear after delivery. Record sales with marketplace, fees and outbound shipping for true profit and ROI."
      />
    </AppShell>
  );
}
