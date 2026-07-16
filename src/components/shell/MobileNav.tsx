"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, BarChart3, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Tracking", href: "/tracking", icon: Truck },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Review", href: "/review", icon: Inbox },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-[--color-border] bg-[--color-bg]/90 backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-medium",
              active ? "text-[--color-brand-soft]" : "text-fg-faint"
            )}
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
