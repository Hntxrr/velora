import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-[13.5px] text-fg placeholder:text-fg-faint transition-colors focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30 disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-[80px] resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "cursor-pointer appearance-none bg-no-repeat pr-8", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236c6c82' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
      backgroundPosition: "right 10px center",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[12.5px] font-medium text-fg-muted", className)}
      {...props}
    />
  );
}
