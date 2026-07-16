import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";

export default function SharePage() {
  return (
    <AppShell title="Share Studio" reviewCount={3}>
      <EmptyState
        icon={Sparkles}
        title="Share Studio"
        description="Create premium share cards of your spend and wins — uploaded or built-in backgrounds, gradients, glass effects, live preview, PNG export. No watermark."
      />
    </AppShell>
  );
}
