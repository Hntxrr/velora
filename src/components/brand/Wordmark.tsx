import { Logo } from "./Logo";

/**
 * Logo + "Velora" wordmark lockup for the sidebar header.
 */
export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Logo size={size} />
      <span
        className="font-display text-[19px] font-bold tracking-tight text-fg"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Velora
      </span>
    </div>
  );
}
