import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";

export default function OrdersPage() {
  return (
    <AppShell title="Orders" reviewCount={3}>
      <EmptyState
        icon={Package}
        title="Orders live here"
        description="The full orders table — dense, sortable, resizable, with bulk actions and CSV export — arrives in the Orders feature build. Foundation is ready."
        action="Add your first order"
      />
    </AppShell>
  );
}
