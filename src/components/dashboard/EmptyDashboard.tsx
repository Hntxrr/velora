"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { seedSampleOrders } from "@/app/orders/actions";

export function EmptyDashboard() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const loadSamples = () =>
    startTransition(async () => {
      await seedSampleOrders();
      router.refresh();
    });

  return (
    <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-[--color-border] bg-[--color-surface]/40 px-6 py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-[--radius-lg]"
        style={{ background: "var(--gradient-brand-soft)" }}
      >
        <Package size={24} className="text-[--color-brand-soft]" />
      </div>
      <h3 className="font-display text-[17px] font-semibold text-fg">Let&apos;s add your first order</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-fg-muted">
        Add an order manually, or load some sample data to try things out — including the
        Share Studio success card.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/orders/new">
          <Button className="gap-1.5">
            <Plus size={16} /> Add an order
          </Button>
        </Link>
        <Button variant="secondary" onClick={loadSamples} disabled={pending} className="gap-1.5">
          <Wand2 size={15} /> {pending ? "Loading…" : "Load sample data"}
        </Button>
      </div>
    </div>
  );
}
