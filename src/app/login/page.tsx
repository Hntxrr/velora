import { signIn } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { GoogleIcon, AppleIcon, DiscordIcon } from "@/components/brand/ProviderIcons";

export const metadata = { title: "Sign in — Velora" };

async function signInWith(provider: "google" | "apple" | "discord") {
  "use server";
  await signIn(provider, { redirectTo: "/dashboard" });
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
            Your order &amp; profit command center. Sign in to pick up where you
            left off.
          </p>
        </div>

        <div className="rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface] p-5 shadow-[var(--shadow-card)]">
          <div className="space-y-2.5">
            <form action={signInWith.bind(null, "google")}>
              <ProviderButton icon={<GoogleIcon />} label="Continue with Google" />
            </form>
            <form action={signInWith.bind(null, "apple")}>
              <ProviderButton icon={<AppleIcon />} label="Continue with Apple" />
            </form>
            <form action={signInWith.bind(null, "discord")}>
              <ProviderButton icon={<DiscordIcon />} label="Continue with Discord" />
            </form>
          </div>

          <p className="mt-5 text-center text-[11.5px] leading-relaxed text-fg-faint">
            By continuing you agree to Velora&apos;s Terms of Service and Privacy
            Policy.
          </p>
        </div>

        <p className="mt-6 text-center text-[12.5px] text-fg-faint">
          New here? Signing in with any provider creates your account.
        </p>
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
