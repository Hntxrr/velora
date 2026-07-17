"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { InboxDTO } from "@/lib/inboxes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { connectInbox, disconnectInbox, syncNow } from "@/app/settings/actions";

export function InboxManager({ inboxes }: { inboxes: InboxDTO[] }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const add = () => {
    setMsg(null);
    startTransition(async () => {
      try {
        await connectInbox({ emailAddress: email, appPassword });
        setEmail("");
        setAppPassword("");
        setMsg({ ok: true, text: "Inbox connected. Hit Sync to pull in orders." });
        router.refresh();
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to connect" });
      }
    });
  };

  const sync = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await syncNow();
      setMsg(
        res.error
          ? { ok: false, text: res.error }
          : { ok: true, text: `Synced. ${res.newDrafts} new order(s) in the Review Queue.` }
      );
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Disconnect this inbox?")) return;
    startTransition(async () => {
      await disconnectInbox(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg">Connected inboxes</h3>
            <p className="mt-0.5 text-[12.5px] text-fg-faint">
              Forward your order emails here, or connect the inbox you forward them to.
            </p>
          </div>
          {inboxes.length > 0 && (
            <Button variant="secondary" size="sm" onClick={sync} disabled={pending} className="gap-1.5">
              <RefreshCw size={14} className={pending ? "animate-spin" : ""} /> Sync now
            </Button>
          )}
        </div>

        {inboxes.length === 0 ? (
          <p className="rounded-[--radius-sm] border border-dashed border-[--color-border] px-4 py-6 text-center text-[13px] text-fg-faint">
            No inboxes connected yet.
          </p>
        ) : (
          <div className="space-y-2">
            {inboxes.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-fg-faint" />
                  <div>
                    <p className="text-[13px] font-medium text-fg">{i.emailAddress}</p>
                    <p className="text-[11.5px] text-fg-faint">
                      {i.lastSyncedAt ? `Last synced ${i.lastSyncedAt.slice(0, 10)}` : "Never synced"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1 text-[11.5px]"
                    style={{ color: i.status === "ERROR" ? "#f04444" : "#5ad98a" }}
                  >
                    {i.status === "ERROR" ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                    {i.status.toLowerCase()}
                  </span>
                  <button
                    onClick={() => remove(i.id)}
                    className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]"
                    aria-label="Disconnect"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-fg">Connect a Gmail inbox</h3>
        <p className="mb-4 text-[12.5px] leading-relaxed text-fg-faint">
          Use a Google{" "}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--color-brand-soft] underline"
          >
            app password
          </a>{" "}
          (requires 2-step verification). Your credential is encrypted at rest and only used
          to read order emails.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Gmail address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
            />
          </div>
          <div>
            <Label>App password</Label>
            <Input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="font-mono"
            />
          </div>
        </div>
        {msg && (
          <p
            className="mt-3 text-[12.5px]"
            style={{ color: msg.ok ? "#5ad98a" : "#f58080" }}
          >
            {msg.text}
          </p>
        )}
        <Button onClick={add} disabled={pending || !email || !appPassword} className="mt-4 gap-1.5">
          <Plus size={15} /> Connect inbox
        </Button>
      </Card>
    </div>
  );
}
