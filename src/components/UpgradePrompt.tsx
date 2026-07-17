import Link from "next/link";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const PRO_FEATURES = [
  "Full analytics dashboard & profit reports",
  "Inventory & sales with true ROI",
  "Product library with lifetime stats",
  "Share Studio (animated GIF cards)",
  "Unlimited orders & connected inboxes",
];

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="relative overflow-hidden rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface] p-8 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "var(--gradient-brand)" }} />
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[--radius-lg]"
          style={{ background: "var(--gradient-brand-soft)" }}
        >
          <Sparkles size={26} className="text-[--color-brand-soft]" />
        </div>
        <h2 className="font-display text-[22px] font-bold text-fg">
          {feature} is a <span className="text-gradient">Pro</span> feature
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-fg-muted">
          The free plan covers order &amp; shipment tracking. Upgrade to unlock profit,
          inventory, analytics and more.
        </p>

        <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-fg-muted">
              <Check size={16} className="mt-0.5 shrink-0 text-[--color-success]" />
              {f}
            </li>
          ))}
        </ul>

        <Link href="/settings">
          <Button className="mt-7 gap-1.5">
            Upgrade to Pro <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
