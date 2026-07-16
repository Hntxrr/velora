import {
  LayoutDashboard,
  Package,
  Truck,
  Boxes,
  Tags,
  BarChart3,
  Calendar,
  Bell,
  Sparkles,
  Inbox,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pro-only feature (gated for free tier). Free tier = tracking only. */
  pro?: boolean;
  badgeKey?: "review";
};

export type NavSection = { title?: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, pro: true },
      { label: "Orders", href: "/orders", icon: Package },
      { label: "Tracking", href: "/tracking", icon: Truck },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "Reselling",
    items: [
      { label: "Products", href: "/products", icon: Tags, pro: true },
      { label: "Inventory", href: "/inventory", icon: Boxes, pro: true },
      { label: "Analytics", href: "/analytics", icon: BarChart3, pro: true },
      { label: "Share Studio", href: "/share", icon: Sparkles, pro: true },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Review Queue", href: "/review", icon: Inbox, badgeKey: "review" },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
