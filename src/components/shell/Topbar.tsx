"use client";

import { Search, Command, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[--color-border] bg-[--color-bg]/70 px-4 backdrop-blur-xl md:px-6">
      <h1 className="font-display text-[17px] font-semibold text-fg">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button className="group hidden items-center gap-2 rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-3 py-2 text-[13px] text-fg-faint transition-colors hover:border-[--color-hover] hover:text-fg-muted sm:flex">
          <Search size={15} />
          <span>Search or jump to…</span>
          <span className="ml-6 flex items-center gap-0.5 rounded border border-[--color-border] bg-[--color-bg] px-1.5 py-0.5 text-[10.5px] font-medium">
            <Command size={10} />K
          </span>
        </button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={17} />
        </Button>

        <Button size="sm" className="gap-1.5">
          <Plus size={16} />
          <span className="hidden sm:inline">New order</span>
        </Button>
      </div>
    </header>
  );
}
