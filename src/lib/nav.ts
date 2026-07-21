import {
  LayoutDashboard,
  Package,
  Truck,
  Calendar,
  Bell,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  pro?: boolean;
  badgeKey?: "review";
};

export type NavSection = { title?: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orders", href: "/orders", icon: Package },
      { label: "Tracking", href: "/tracking", icon: Truck },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Share Studio", href: "/share", icon: Sparkles },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
