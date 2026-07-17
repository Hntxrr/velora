"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Send, CheckCircle2 } from "lucide-react";
import type { WebhookDTO } from "@/lib/notifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { addWebhook, deleteWebhook, toggleWebhook, testWebhook } from "@/app/settings/actions";

const EVENTS: { value: string; label: string }[] = [
  { value: "ORDER_PARSED", label: "New order parsed" },
  { value: "ORDER_SHIPPED", label: "Shipped" },
  { value: "ORDER_OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "ORDER_DELIVERED", label: "Delivered" },
  { value: "ORDER_CANCELLED", label: "Cancelled" },
];

export function WebhookManager({ webhooks }: { webhooks: WebhookDTO[] }) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(EVENTS.map((e) => e.value));
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const toggleEvent = (v: string) =>
    setEvents((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const add = () => {
    setMsg(null);
    startTransition(async () => {
      try {
        await addWebhook({ url, events });
        setUrl("");
        router.refresh();
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-fg">Discord webhooks</h3>
        <p className="mb-4 text-[12.5px] leading-relaxed text-fg-faint">
          Get order and shipping updates pushed to a Discord channel. Create a webhook in your
          server&apos;s channel settings and paste the URL.
        </p>

        {webhooks.length > 0 && (
          <div className="mb-4 space-y-2">
            {webhooks.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] text-fg-muted">{w.url.replace(/\/[\w-]+$/, "/•••")}</p>
                  <p className="text-[11px] text-fg-faint">{w.events.length} events</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => testWebhook(w.id).then((r) => setMsg(r.ok ? { ok: true, text: "Test sent!" } : { ok: false, text: "Test failed" }))}
                    className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-brand-soft]"
                    aria-label="Test"
                  >
                    <Send size={14} />
                  </button>
                  <label className="flex cursor-pointer items-center gap-1 text-[11.5px] text-fg-faint">
                    <input
                      type="checkbox"
                      checked={w.enabled}
                      onChange={(e) => toggleWebhook(w.id, e.target.checked).then(() => router.refresh())}
                      className="accent-[--color-brand]"
                    />
                    on
                  </label>
                  <button onClick={() => deleteWebhook(w.id).then(() => router.refresh())} className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <Label>Webhook URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/…" className="font-mono" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENTS.map((e) => (
            <button
              key={e.value}
              onClick={() => toggleEvent(e.value)}
              className={
                "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors " +
                (events.includes(e.value)
                  ? "bg-[--color-brand]/15 text-[--color-brand-soft]"
                  : "bg-[--color-surface-2] text-fg-faint")
              }
            >
              {events.includes(e.value) && <CheckCircle2 size={11} className="mr-1 inline" />}
              {e.label}
            </button>
          ))}
        </div>
        {msg && <p className="mt-3 text-[12.5px]" style={{ color: msg.ok ? "#5ad98a" : "#f58080" }}>{msg.text}</p>}
        <Button onClick={add} disabled={pending || !url} className="mt-4 gap-1.5">
          <Plus size={15} /> Add webhook
        </Button>
      </Card>
    </div>
  );
}
