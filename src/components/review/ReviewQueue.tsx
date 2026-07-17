"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Package, Sparkles } from "lucide-react";
import type { DraftDTO } from "@/lib/review";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { approveDraft, rejectDraft } from "@/app/review/actions";

function confidenceLabel(c: number) {
  if (c >= 0.75) return { label: "High confidence", color: "#22c55e", bg: "rgba(34,197,94,0.13)" };
  if (c >= 0.5) return { label: "Medium confidence", color: "#f5a524", bg: "rgba(245,165,36,0.13)" };
  return { label: "Low — please check", color: "#f04444", bg: "rgba(240,68,68,0.13)" };
}

export function ReviewQueue({ drafts }: { drafts: DraftDTO[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Inbox zero"
        description="Parsed orders from your forwarded emails show up here for one-click approval. Connect an inbox in Settings and hit Sync to pull them in."
      />
    );
  }

  const act = (id: string, fn: () => Promise<unknown>) => {
    setPendingId(id);
    fn().finally(() => {
      setPendingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-fg-muted">
        {drafts.length} order{drafts.length === 1 ? "" : "s"} waiting for review. Approve to
        add to your orders, or reject to discard.
      </p>

      {drafts.map((d) => {
        const p = d.parsed;
        const conf = confidenceLabel(d.confidence);
        const busy = pendingId === d.id;
        return (
          <Card key={d.id} className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Extracted order */}
              <div className="p-5 lg:col-span-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[--color-surface-2] px-2 py-1 text-[12px] font-semibold text-fg">
                    {p.retailerSlug ?? d.retailerGuess ?? "Unknown retailer"}
                  </span>
                  {p.orderNumber && (
                    <span className="font-mono text-[12px] text-fg-muted">#{p.orderNumber}</span>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: conf.bg, color: conf.color }}
                  >
                    {conf.label}
                  </span>
                </div>

                {p.items.length > 0 ? (
                  <div className="mb-3 divide-y divide-[--color-border-soft] rounded-[--radius-sm] border border-[--color-border-soft]">
                    {p.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
                        <span className="text-fg">
                          <span className="tabular text-fg-muted">{it.quantity}×</span> {it.name}
                        </span>
                        <span className="tabular text-fg-muted">{formatCurrency(it.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-3 flex items-center gap-2 rounded-[--radius-sm] border border-dashed border-[--color-border] px-3 py-2 text-[12.5px] text-fg-faint">
                    <Package size={14} /> No line items detected — you can add them after approving.
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-fg-muted">
                  <span>Total <b className="tabular text-fg">{formatCurrency(p.grandTotal)}</b></span>
                  <span>Tax <span className="tabular">{formatCurrency(p.taxTotal)}</span></span>
                  <span>Shipping <span className="tabular">{formatCurrency(p.shippingTotal)}</span></span>
                  {p.trackingNumbers.length > 0 && (
                    <span className="text-[--color-brand-soft]">
                      {p.trackingNumbers.length} tracking #
                    </span>
                  )}
                </div>
              </div>

              {/* Source + actions */}
              <div className="flex flex-col justify-between gap-4 border-t border-[--color-border] bg-[--color-bg-2] p-5 lg:border-l lg:border-t-0">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-fg-faint">From email</p>
                  <p className="mt-1 truncate text-[12.5px] text-fg-muted" title={d.subject}>
                    {d.subject || "(no subject)"}
                  </p>
                  <p className="truncate text-[11.5px] text-fg-faint" title={d.fromAddress}>
                    {d.fromAddress}
                  </p>
                  <p className="mt-1 text-[11.5px] text-fg-faint">
                    {d.receivedAt.slice(0, 10)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => act(d.id, () => approveDraft(d.id))}
                    disabled={busy}
                    className="flex-1 gap-1.5"
                  >
                    <Check size={15} /> Approve
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => act(d.id, () => rejectDraft(d.id))}
                    disabled={busy}
                    aria-label="Reject"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
