"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Package, Truck, CheckCircle2, XCircle, Sparkles, Bell, Trash2, CheckCheck,
} from "lucide-react";
import type { NotificationDTO } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { markRead, markAllRead, deleteNotification, clearNotifications } from "@/app/notifications/actions";

const ICONS: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  ORDER_PARSED: { icon: Sparkles, color: "#7c5cff" },
  ORDER_SHIPPED: { icon: Truck, color: "#38bdf8" },
  ORDER_OUT_FOR_DELIVERY: { icon: Truck, color: "#f5a524" },
  ORDER_DELIVERED: { icon: CheckCircle2, color: "#22c55e" },
  ORDER_CANCELLED: { icon: XCircle, color: "#f04444" },
  SYSTEM: { icon: Package, color: "#a6a6bd" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsList({ notifications }: { notifications: NotificationDTO[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const hasUnread = notifications.some((n) => !n.read);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="Order updates — new parsed orders, shipping progress, deliveries and cancellations — will appear here and can be pushed to Discord."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={!hasUnread} onClick={() => markAllRead().then(refresh)} className="gap-1.5">
          <CheckCheck size={14} /> Mark all read
        </Button>
        <Button variant="ghost" size="sm" onClick={() => confirm("Clear all notifications?") && clearNotifications().then(refresh)} className="gap-1.5">
          <Trash2 size={14} /> Clear all
        </Button>
      </div>

      <div className="space-y-1.5">
        {notifications.map((n) => {
          const cfg = ICONS[n.type];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={
                "group flex items-start gap-3 rounded-[--radius-md] border px-4 py-3 transition-colors " +
                (n.read
                  ? "border-[--color-border-soft] bg-[--color-surface]"
                  : "border-[--color-brand]/30 bg-[--color-surface-2]")
              }
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[--radius-sm]"
                style={{ background: `${cfg.color}22`, color: cfg.color }}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-medium text-fg">{n.title}</p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[--color-brand]" />}
                </div>
                {n.body && <p className="truncate text-[12.5px] text-fg-muted">{n.body}</p>}
                <p className="mt-0.5 text-[11px] text-fg-faint">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!n.read && (
                  <button onClick={() => markRead(n.id).then(refresh)} className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-fg" aria-label="Mark read">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id).then(refresh)} className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
