import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-[--radius-sm] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_6px_20px_-6px_rgba(124,92,255,0.6)] hover:brightness-110",
  secondary:
    "bg-[--color-elevated] text-fg border border-[--color-border] hover:bg-[--color-hover]",
  outline:
    "bg-transparent text-fg border border-[--color-border] hover:bg-[--color-surface-2]",
  ghost: "bg-transparent text-fg-muted hover:bg-[--color-hover] hover:text-fg",
  danger:
    "bg-[--color-danger] text-white hover:brightness-110 shadow-[0_6px_20px_-6px_rgba(240,68,68,0.55)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", style, ...props }, ref) => {
    const brandStyle: React.CSSProperties | undefined =
      variant === "primary"
        ? { background: "var(--gradient-brand)", ...style }
        : style;
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        style={brandStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
