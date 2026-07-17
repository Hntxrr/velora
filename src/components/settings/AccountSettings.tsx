"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Download, Trash2, ArrowDownCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { updateProfile, setPlan, deleteAccount } from "@/app/settings/actions";

export function AccountSettings({
  name,
  email,
  plan,
}: {
  name: string;
  email: string;
  plan: "FREE" | "PRO";
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(name);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const saveName = () =>
    startTransition(async () => {
      await updateProfile({ name: displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });

  const changePlan = (p: "FREE" | "PRO") =>
    startTransition(async () => {
      await setPlan(p);
      router.refresh();
    });

  const remove = () => {
    if (!confirm("Permanently delete your account and ALL data? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Everything will be erased.")) return;
    startTransition(async () => {
      await deleteAccount();
    });
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-fg">Profile</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
        </div>
        <Button size="sm" onClick={saveName} disabled={pending} className="mt-4 gap-1.5">
          {saved ? <Check size={14} /> : null} {saved ? "Saved" : "Save profile"}
        </Button>
      </Card>

      {/* Plan */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Subscription</h3>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={
              plan === "PRO"
                ? { background: "var(--gradient-brand-soft)", color: "var(--color-brand-soft)" }
                : { background: "var(--color-surface-2)", color: "var(--color-fg-muted)" }
            }
          >
            <Crown size={12} /> {plan === "PRO" ? "Pro" : "Free"}
          </span>
        </div>

        {plan === "FREE" ? (
          <div>
            <p className="mb-4 text-[13px] text-fg-muted">
              You&apos;re on the free plan (order &amp; shipment tracking). Upgrade to unlock
              analytics, inventory, profit tracking, products and Share Studio.
            </p>
            <Button onClick={() => changePlan("PRO")} disabled={pending} className="gap-1.5">
              <Crown size={15} /> Upgrade to Pro
            </Button>
            <p className="mt-2 text-[11px] text-fg-faint">
              Demo upgrade (no charge). Real billing integrates here later.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-[13px] text-fg-muted">
              You have full access to every Velora feature. Thanks for being Pro.
            </p>
            <Button variant="secondary" size="sm" onClick={() => changePlan("FREE")} disabled={pending} className="gap-1.5">
              <ArrowDownCircle size={14} /> Switch to Free
            </Button>
          </div>
        )}
      </Card>

      {/* Data & danger zone */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-fg">Your data</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/api/account/export" download>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Download size={14} /> Export all data (JSON)
            </Button>
          </a>
          <a href="/api/orders/export" download>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Download size={14} /> Export orders (CSV)
            </Button>
          </a>
        </div>

        <div className="mt-5 rounded-[--radius-md] border border-[--color-danger]/30 bg-[--color-danger]/5 p-4">
          <p className="text-[13px] font-semibold text-fg">Delete account</p>
          <p className="mt-0.5 text-[12.5px] text-fg-muted">
            Permanently erase your account and all orders, inventory, and sales.
          </p>
          <Button variant="danger" size="sm" onClick={remove} disabled={pending} className="mt-3 gap-1.5">
            <Trash2 size={14} /> Delete account
          </Button>
        </div>
      </Card>
    </div>
  );
}
