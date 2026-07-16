"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { NAV } from "@/lib/nav";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/utils";

export function Sidebar({ reviewCount = 0 }: { reviewCount?: number }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const isPro = user?.plan === "PRO";
  const initial = (user?.name ?? user?.email ?? "V").charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex h-dvh w-[248px] shrink-0 flex-col border-r border-[--color-border] bg-[--color-bg-2]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center px-5">
        <Wordmark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((section, i) => (
          <div key={i} className="mb-5">
            {section.title && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-[--radius-sm] px-3 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "text-fg"
                          : "text-fg-muted hover:bg-[--color-hover] hover:text-fg"
                      )}
                    >
                      {active && (
                        <span
                          className="absolute inset-0 -z-10 rounded-[--radius-sm]"
                          style={{ background: "var(--gradient-brand-soft)" }}
                        />
                      )}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                          style={{ background: "var(--gradient-brand)" }}
                        />
                      )}
                      <Icon
                        size={17}
                        className={cn(
                          "shrink-0",
                          active ? "text-[--color-brand-soft]" : ""
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badgeKey === "review" && reviewCount > 0 && (
                        <span className="tabular rounded-full bg-[--color-brand] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
                          {reviewCount}
                        </span>
                      )}
                      {item.pro && (
                        <span className="rounded bg-[--color-surface-2] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-fg-faint group-hover:text-fg-muted">
                          Pro
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[--color-border] p-3">
        <div className="flex items-center gap-3 rounded-[--radius-sm] p-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-fg">
              {user?.name ?? user?.email ?? "Account"}
            </p>
            <p className="truncate text-[11.5px] text-fg-faint">
              {isPro ? "Pro plan" : "Free plan"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            className="rounded-[--radius-xs] p-1.5 text-fg-faint transition-colors hover:bg-[--color-hover] hover:text-fg"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
