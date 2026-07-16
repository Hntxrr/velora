import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency. */
export function formatCurrency(value: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(value);
}

/** Format a whole number with thousands separators. */
export function formatNumber(value: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-US", {
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : 0,
  }).format(value);
}

/** Format a ratio (0.6) as a percentage string ("60%"). */
export function formatPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}
