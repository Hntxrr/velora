import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" reviewCount={3}>
      <EmptyState
        icon={BarChart3}
        title="Beautiful analytics"
        description="Spend and profit trends, retailer breakdown, and delivery performance — gradient-aware charts arrive in the Analytics feature build."
      />
    </AppShell>
  );
}
