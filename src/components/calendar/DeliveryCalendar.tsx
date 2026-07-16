"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DeliveryEvent } from "@/lib/tracking";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function DeliveryCalendar({
  monthISO,
  events,
}: {
  monthISO: string; // YYYY-MM-01
  events: DeliveryEvent[];
}) {
  const router = useRouter();
  const first = new Date(monthISO + "T00:00:00");
  const year = first.getFullYear();
  const month = first.getMonth();

  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const todayKey = new Date().toISOString().slice(0, 10);

  // Group events by day-of-month.
  const byDay = new Map<number, DeliveryEvent[]>();
  for (const e of events) {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), e]);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-semibold text-fg">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/calendar?month=${ym(prev)}`)}
            className="rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] p-2 text-fg-muted hover:bg-[--color-hover] hover:text-fg"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => router.push("/calendar")}
            className="rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-3 py-2 text-[12.5px] text-fg-muted hover:bg-[--color-hover] hover:text-fg"
          >
            Today
          </button>
          <button
            onClick={() => router.push(`/calendar?month=${ym(next)}`)}
            className="rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] p-2 text-fg-muted hover:bg-[--color-hover] hover:text-fg"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-border]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-[--color-bg-2] px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          const dayEvents = day ? byDay.get(day) ?? [] : [];
          const dateKey = day
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          const isToday = dateKey === todayKey;
          return (
            <div
              key={i}
              className={`min-h-[92px] bg-[--color-surface] p-1.5 ${day ? "" : "opacity-40"}`}
            >
              {day && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11.5px] ${
                        isToday ? "font-bold text-white" : "text-fg-muted"
                      }`}
                      style={isToday ? { background: "var(--gradient-brand)" } : undefined}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="tabular text-[10px] font-semibold text-[--color-brand-soft]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <Link
                        key={e.orderId}
                        href={`/orders/${e.orderId}`}
                        className="block truncate rounded-[--radius-xs] px-1.5 py-0.5 text-[10.5px] font-medium text-fg"
                        style={{
                          background: e.actual
                            ? "rgba(34,197,94,0.14)"
                            : "var(--gradient-brand-soft)",
                        }}
                        title={`${e.retailerName ?? "Order"} #${e.orderNumber}`}
                      >
                        {e.retailerName ?? `#${e.orderNumber}`}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="px-1.5 text-[10px] text-fg-faint">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11.5px] text-fg-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--gradient-brand-soft)" }} />
          Expected delivery
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(34,197,94,0.4)" }} />
          Delivered
        </span>
      </div>
    </div>
  );
}
