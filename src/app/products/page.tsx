import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tags } from "lucide-react";

export default function ProductsPage() {
  return (
    <AppShell title="Products" reviewCount={3}>
      <EmptyState
        icon={Tags}
        title="Your product library"
        description="Per-product lifetime stats — quantity purchased, average/low/high cost, retailers bought from — with assisted matching to unify differently-named line items."
      />
    </AppShell>
  );
}
