import { signIn, enabledOAuth } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { GoogleIcon, AppleIcon, DiscordIcon } from "@/components/brand/ProviderIcons";

export const metadata = { title: "Sign in — Velora" };

async function signInWith(provider: "google" | "apple" | "discord") {
  "use server";
  await signIn(provider, { redirectTo: "/dashboard" });
}

async function quickSignIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  await signIn("quick", { email, redirectTo: "/dashboard" });
}

export default function LoginPage() {
  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center px-4">
      {/* Ambient brand orbs */}
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--gradient-brand)" }}
      />

      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface]"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <Logo size={38} />
          </div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-fg">
            Welcome to <span className="text-gradient">Velora</span>
          </h1>
          <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-fg-muted">
            Track your orders and shipments in one beautiful place.
          </p>
        </div>

        <div className="rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface] p-5 shadow-[var(--shadow-card)]">
          {/* Quick email sign-in — fastest way to start */}
          <form action={quickSignIn} className="space-y-2.5">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-[--color-brand] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30"
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99]"
              style={{ background: "var(--gradient-brand)" }}
            >
              Continue with email
            </button>
          </form>

          {(enabledOAuth.google || enabledOAuth.apple || enabledOAuth.discord) && (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[--color-border]" />
                <span className="text-[11px] uppercase tracking-wide text-fg-faint">or</span>
                <span className="h-px flex-1 bg-[--color-border]" />
              </div>

              <div className="space-y-2.5">
                {enabledOAuth.google && (
                  <form action={signInWith.bind(null, "google")}>
                    <ProviderButton icon={<GoogleIcon />} label="Continue with Google" />
                  </form>
                )}
                {enabledOAuth.apple && (
                  <form action={signInWith.bind(null, "apple")}>
                    <ProviderButton icon={<AppleIcon />} label="Continue with Apple" />
                  </form>
                )}
                {enabledOAuth.discord && (
                  <form action={signInWith.bind(null, "discord")}>
                    <ProviderButton icon={<DiscordIcon />} label="Continue with Discord" />
                  </form>
                )}
              </div>
            </>
          )}

          <p className="mt-5 text-center text-[11.5px] leading-relaxed text-fg-faint">
            Signing in creates your account if you don&apos;t have one.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProviderButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-3 rounded-[--radius-md] border border-[--color-border] bg-[--color-elevated] px-4 py-3 text-[14px] font-medium text-fg transition-all hover:border-[--color-hover] hover:bg-[--color-hover] active:scale-[0.99]"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}
