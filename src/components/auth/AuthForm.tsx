"use client";

import * as React from "react";
import { useActionState } from "react";
import { authenticate, type AuthState } from "@/app/login/actions";

export function AuthForm() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(authenticate, {});

  return (
    <div>
      {/* Mode toggle */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface-2] p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              "rounded-[--radius-xs] py-2 text-[12.5px] font-medium transition-colors " +
              (mode === m ? "bg-[--color-elevated] text-fg" : "text-fg-muted hover:text-fg")
            }
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-2.5">
        <input type="hidden" name="mode" value={mode} />

        {mode === "signup" && (
          <input
            name="name"
            placeholder="Name (optional)"
            autoComplete="name"
            className="w-full rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30"
          />
        )}
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30"
        />
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="Password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30"
        />

        {state?.error && (
          <p className="rounded-[--radius-sm] border border-[--color-danger]/40 bg-[--color-danger]/10 px-3 py-2 text-[12.5px] text-[--color-danger]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          style={{ background: "var(--gradient-brand)" }}
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
