"use client";

import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import type { ShareStats } from "@/lib/share";
import { formatCurrency, formatNumber } from "@/lib/utils";

export type StatKey = keyof Omit<ShareStats, never>;

export const STAT_META: Record<
  StatKey,
  { label: string; kind: "currency" | "int" | "percent" }
> = {
  totalSpent: { label: "Total Spent", kind: "currency" },
  orders: { label: "Orders", kind: "int" },
  units: { label: "Units", kind: "int" },
  delivered: { label: "Delivered", kind: "int" },
  cancelled: { label: "Cancelled", kind: "int" },
  stickRate: { label: "Stick Rate", kind: "percent" },
  revenue: { label: "Revenue", kind: "currency" },
  profit: { label: "Profit", kind: "currency" },
  roi: { label: "ROI", kind: "percent" },
  inventoryValue: { label: "Inventory Value", kind: "currency" },
};

export const BACKGROUNDS: { id: string; label: string; css: string }[] = [
  { id: "brand", label: "Brand", css: "linear-gradient(135deg,#22d3ee 0%,#3b82f6 35%,#7c5cff 68%,#c026d3 100%)" },
  { id: "aurora", label: "Aurora", css: "linear-gradient(135deg,#0ea5e9 0%,#22c55e 100%)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg,#f97316 0%,#e948d6 100%)" },
  { id: "ocean", label: "Ocean", css: "linear-gradient(160deg,#0b1020 0%,#0e2a47 55%,#1e3a8a 100%)" },
  { id: "mono", label: "Mono", css: "linear-gradient(160deg,#141420 0%,#08080c 100%)" },
  { id: "grape", label: "Grape", css: "linear-gradient(135deg,#6d28d9 0%,#9333ea 50%,#c026d3 100%)" },
];

function ease(p: number) {
  // easeOutCubic for a satisfying count-up settle
  return 1 - Math.pow(1 - p, 3);
}

function formatStat(kind: string, value: number, progress: number) {
  const v = value * ease(Math.min(1, Math.max(0, progress)));
  if (kind === "currency") return formatCurrency(v);
  if (kind === "percent") return `${Math.round(v * 100)}%`;
  return formatNumber(Math.round(v));
}

const PERIOD_TITLE: Record<string, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  lifetime: "Lifetime",
};

export type ShareConfig = {
  keys: StatKey[];
  background: string; // preset id or "custom"
  customBg: string | null; // data URL
  glass: boolean;
  username: string;
  avatar: string | null;
  showAvatar: boolean;
  period: string;
};

export const ShareCard = React.forwardRef<
  HTMLDivElement,
  { stats: ShareStats; config: ShareConfig; progress: number }
>(function ShareCard({ stats, config, progress }, ref) {
  const preset = BACKGROUNDS.find((b) => b.id === config.background);
  const bgStyle: React.CSSProperties =
    config.background === "custom" && config.customBg
      ? { backgroundImage: `url(${config.customBg})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: preset?.css ?? BACKGROUNDS[0].css };

  const keys = config.keys.length ? config.keys : (["totalSpent", "orders", "stickRate"] as StatKey[]);
  const hero = keys[0];
  const rest = keys.slice(1);

  return (
    <div
      ref={ref}
      style={{ width: 540, height: 675, ...bgStyle }}
      className="relative overflow-hidden rounded-[28px]"
    >
      {/* subtle darkening for legibility on bright bg */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.45))" }} />

      <div
        className={
          "absolute inset-5 flex flex-col justify-between rounded-[22px] p-7 " +
          (config.glass ? "border border-white/15 bg-white/10 backdrop-blur-xl" : "")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {config.showAvatar &&
              (config.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full border-2 border-white/40 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-[16px] font-bold text-white">
                  {config.username.charAt(0).toUpperCase()}
                </div>
              ))}
            <div>
              <p className="text-[15px] font-bold leading-tight text-white">{config.username}</p>
              <p className="text-[12px] font-medium text-white/70">{PERIOD_TITLE[config.period] ?? ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1">
            <Logo size={18} />
            <span className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Velora
            </span>
          </div>
        </div>

        {/* Hero stat */}
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {STAT_META[hero].label}
          </p>
          <p
            className="tabular mt-1 font-bold text-white"
            style={{ fontFamily: "var(--font-display)", fontSize: 64, lineHeight: 1, textShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            {formatStat(STAT_META[hero].kind, stats[hero], progress)}
          </p>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-2.5">
          {rest.map((k) => (
            <div key={k} className="rounded-[16px] bg-black/25 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">
                {STAT_META[k].label}
              </p>
              <p className="tabular mt-0.5 text-[24px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {formatStat(STAT_META[k].kind, stats[k], progress)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
