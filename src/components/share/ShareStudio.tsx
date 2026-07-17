"use client";

import * as React from "react";
import { Download, Film, RefreshCw, ImagePlus, Sparkles } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { ShareData, SharePeriod } from "@/lib/share";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ShareCard,
  STAT_META,
  BACKGROUNDS,
  type StatKey,
  type ShareConfig,
} from "./ShareCard";

const PERIODS: { id: SharePeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "lifetime", label: "Lifetime" },
];

const ALL_KEYS = Object.keys(STAT_META) as StatKey[];

export function ShareStudio({ data }: { data: ShareData }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [period, setPeriod] = React.useState<SharePeriod>("lifetime");
  const [keys, setKeys] = React.useState<StatKey[]>(["totalSpent", "orders", "stickRate"]);
  const [background, setBackground] = React.useState("brand");
  const [customBg, setCustomBg] = React.useState<string | null>(null);
  const [glass, setGlass] = React.useState(true);
  const [username, setUsername] = React.useState(data.user.name);
  const [showAvatar, setShowAvatar] = React.useState(true);
  const [progress, setProgress] = React.useState(1);
  const [busy, setBusy] = React.useState<null | "png" | "gif">(null);
  const rafRef = React.useRef<number | null>(null);

  const config: ShareConfig = {
    keys,
    background,
    customBg,
    glass,
    username,
    avatar: data.user.image,
    showAvatar,
    period,
  };
  const stats = data.periods[period];

  const animate = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  React.useEffect(() => {
    animate();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // replay when the period changes
  }, [period, animate]);

  const toggleKey = (k: StatKey) =>
    setKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : prev.length >= 5 ? prev : [...prev, k]
    );

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBg(reader.result as string);
      setBackground("custom");
    };
    reader.readAsDataURL(file);
  };

  const download = (dataUrl: string, ext: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `velora-${period}-${Date.now()}.${ext}`;
    a.click();
  };

  const exportPng = async () => {
    if (!cardRef.current) return;
    setBusy("png");
    setProgress(1);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const url = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      download(url, "png");
    } finally {
      setBusy(null);
      animate();
    }
  };

  const exportGif = async () => {
    if (!cardRef.current) return;
    setBusy("gif");
    const node = cardRef.current;
    const frames = 24;
    const gif = GIFEncoder();

    const setP = async (p: number) => {
      setProgress(p);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };

    try {
      for (let f = 0; f <= frames; f++) {
        await setP(f / frames);
        const canvas = await htmlToImage.toCanvas(node, { pixelRatio: 1, cacheBust: true });
        const ctx = canvas.getContext("2d")!;
        const { data: rgba, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);
        gif.writeFrame(index, width, height, { palette, delay: 60 });
      }
      // hold the final frame
      const canvas = await htmlToImage.toCanvas(node, { pixelRatio: 1, cacheBust: true });
      const ctx = canvas.getContext("2d")!;
      const { data: rgba, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const palette = quantize(rgba, 256);
      const index = applyPalette(rgba, palette);
      gif.writeFrame(index, width, height, { palette, delay: 1200 });

      gif.finish();
      const blob = new Blob([gif.bytesView() as unknown as BlobPart], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      download(url, "gif");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setBusy(null);
      animate();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Preview */}
      <div className="flex flex-col items-center">
        <div className="origin-top scale-[0.85] sm:scale-100">
          <ShareCard ref={cardRef} stats={stats} config={config} progress={progress} />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={animate} disabled={!!busy} className="gap-1.5">
            <RefreshCw size={14} /> Replay
          </Button>
          <Button size="sm" onClick={exportPng} disabled={!!busy} className="gap-1.5">
            <Download size={14} /> {busy === "png" ? "Rendering…" : "Export PNG"}
          </Button>
          <Button size="sm" variant="secondary" onClick={exportGif} disabled={!!busy} className="gap-1.5">
            <Film size={14} /> {busy === "gif" ? "Rendering GIF…" : "Export GIF"}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-fg">Time window</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={
                  "rounded-[--radius-sm] px-2 py-2 text-[12px] font-medium transition-colors " +
                  (period === p.id
                    ? "bg-[--color-brand] text-white"
                    : "bg-[--color-surface-2] text-fg-muted hover:text-fg")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-1 text-[13px] font-semibold text-fg">Stats</h3>
          <p className="mb-3 text-[11.5px] text-fg-faint">First pick is the hero. Up to 5.</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => toggleKey(k)}
                className={
                  "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors " +
                  (keys.includes(k)
                    ? "bg-[--color-brand]/15 text-[--color-brand-soft]"
                    : "bg-[--color-surface-2] text-fg-faint hover:text-fg-muted")
                }
              >
                {STAT_META[k].label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-fg">Background</h3>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBackground(b.id)}
                className={
                  "h-12 rounded-[--radius-sm] border-2 transition-all " +
                  (background === b.id ? "border-white/80" : "border-transparent")
                }
                style={{ background: b.css }}
                title={b.label}
              />
            ))}
            <label
              className={
                "flex h-12 cursor-pointer items-center justify-center rounded-[--radius-sm] border-2 border-dashed text-fg-faint hover:text-fg " +
                (background === "custom" ? "border-white/80" : "border-[--color-border]")
              }
            >
              <ImagePlus size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] text-fg-muted">
            <input type="checkbox" checked={glass} onChange={(e) => setGlass(e.target.checked)} className="accent-[--color-brand]" />
            Glass panel
          </label>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-fg">Identity</h3>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Display name" />
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] text-fg-muted">
            <input type="checkbox" checked={showAvatar} onChange={(e) => setShowAvatar(e.target.checked)} className="accent-[--color-brand]" />
            Show avatar
          </label>
        </Card>

        <p className="flex items-center gap-1.5 text-[11.5px] text-fg-faint">
          <Sparkles size={12} /> Numbers animate counting up — exported as an animated GIF.
        </p>
      </div>
    </div>
  );
}
