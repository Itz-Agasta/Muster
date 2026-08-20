"use client";

import { useEffect, useState } from "react";

import { useSimEngine } from "@/lib/sim/engine";

import { ActivityRail } from "./activity-rail";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

const NAV_OPEN = 220;
const NAV_SHUT = 60;
const RAIL_OPEN = 320;
const RAIL_SHUT = 46;
const STORAGE_KEY = "muster.shell.v3";

/**
 * Three column grid at full viewport height. The shell has a minimum width and
 * scrolls horizontally rather than crushing the map, which is the product.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(true);
  const [railOpen, setRailOpen] = useState(true);
  const [restored, setRestored] = useState(false);

  useSimEngine();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { navOpen?: boolean; railOpen?: boolean };
        if (typeof saved.navOpen === "boolean") setNavOpen(saved.navOpen);
        if (typeof saved.railOpen === "boolean") setRailOpen(saved.railOpen);
      }
    } catch {
      // A corrupt entry just means we open on the defaults.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ navOpen, railOpen }));
  }, [navOpen, railOpen, restored]);

  const nav = navOpen ? NAV_OPEN : NAV_SHUT;
  const rail = railOpen ? RAIL_OPEN : RAIL_SHUT;

  return (
    <div
      className="bg-background text-foreground grid h-[100dvh] w-full overflow-x-auto"
      style={{
        gridTemplateColumns: `${nav}px minmax(620px, 1fr) ${rail}px`,
        minWidth: 940 + (navOpen ? 160 : 0) + (railOpen ? 274 : 0),
      }}
    >
      <SideNav open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
      <main className="flex min-h-0 min-w-0 flex-col">
        <TopBar />
        {children}
      </main>
      <ActivityRail open={railOpen} onToggle={() => setRailOpen((v) => !v)} />
    </div>
  );
}
