"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { RANCH } from "@/lib/data/ranch";
import { clockTime, coords } from "@/lib/format";
import { useSim } from "@/lib/sim/store";

import { pageTitle } from "./nav-items";

export function TopBar() {
  const pathname = usePathname();
  const phase = useSim((s) => s.phase);
  const flying = phase === "flying";

  return (
    <header className="border-border bg-background flex h-14 flex-none items-center justify-between gap-4 border-b px-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <h1 className="text-foreground flex-none text-sm font-semibold tracking-[-0.01em]">
          {pageTitle(pathname)}
        </h1>
        <span className="text-ink-faint min-w-0 truncate font-mono text-[9.5px] whitespace-nowrap">
          {RANCH.name} · {RANCH.region} · {coords(RANCH.centre[0], RANCH.centre[1])}
        </span>
      </div>

      <div className="flex flex-none items-center gap-3.5">
        {flying && (
          <span className="border-primary-outline bg-accent text-primary flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px]">
            <span className="bg-primary size-1.5 flex-none animate-[mst-live_1.8s_ease-in-out_infinite] rounded-full" />
            Muster active
          </span>
        )}
        <Clock />
        <span className="bg-border h-4 w-px" />
        <ThemeToggle />
        <span className="bg-border h-4 w-px" />
        <span className="flex items-center gap-2">
          <span className="bg-accent border-border text-muted-foreground grid size-6 place-items-center rounded-full border text-[9.5px] font-semibold">
            {RANCH.operator.initials}
          </span>
          <span className="text-muted-foreground text-[11.5px]">{RANCH.operator.name}</span>
        </span>
      </div>
    </header>
  );
}

/** Renders nothing until mounted so the server and client clocks cannot disagree. */
function Clock() {
  const clock = useSim((s) => s.clock);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <span className="text-muted-foreground w-[92px] text-right font-mono text-[11px] whitespace-nowrap tabular">
      {mounted ? clockTime(clock) : "--:--:--"}
      <span className="text-ink-faint ml-1">IST</span>
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // resolvedTheme is undefined on the server, so the label has to wait for mount
  // or the markup hydrates with a different aria-label than it rendered with.
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={!mounted ? "Toggle theme" : dark ? "Switch to light mode" : "Switch to dark mode"}
      className="border-border text-muted-foreground hover:bg-accent hover:text-foreground grid size-6 place-items-center rounded-md border transition-colors"
    >
      {dark ? <Sun className="size-3" /> : <Moon className="size-3" />}
    </button>
  );
}
