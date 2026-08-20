"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@Muster/ui/lib/utils";

import { FleetList } from "./fleet-list";
import { NAV_ITEMS } from "./nav-items";

export function SideNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-muted border-border flex min-h-0 flex-col overflow-y-auto border-r">
      <div className="border-border flex items-center justify-between gap-2 border-b px-3.5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="bg-primary grid size-6 flex-none place-items-center rounded-md">
            <span className="bg-primary-foreground size-2 rounded-[2px]" />
          </span>
          {open && (
            <span className="min-w-0">
              <span className="wordmark text-foreground block truncate text-[0.97rem] leading-tight">
                Muster
              </span>
              <span className="text-muted-foreground block truncate text-[10.5px] leading-tight">
                Rann Pastoral Co-op
              </span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Collapse navigation" : "Expand navigation"}
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground grid size-6 flex-none place-items-center rounded-md border transition-colors"
        >
          {open ? <PanelLeftClose className="size-3" /> : <PanelLeftOpen className="size-3" />}
        </button>
      </div>

      <nav className={cn("flex flex-col gap-0.5", open ? "px-2.5 pt-3.5" : "px-2 pt-2.5")}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={open ? undefined : item.label}
              className={cn(
                "flex items-center rounded-md text-[12.5px] transition-colors",
                open ? "justify-between px-2.5 py-2" : "justify-center py-2",
                active
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="truncate">{open ? item.label : item.label.charAt(0)}</span>
              {open && item.badge && (
                <span
                  className={cn(
                    "font-mono text-[9.5px] tabular",
                    active ? "text-primary" : "text-ink-faint",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {open && <FleetList />}
    </aside>
  );
}
