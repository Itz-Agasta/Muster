"use client";

import { WATER_ASSETS } from "@/lib/data/operations";
import { pct } from "@/lib/format";
import { cn } from "@Muster/ui/lib/utils";

const THRESHOLD = 25;

/**
 * Trough and bore levels. Below 25 percent is a fault, below 40 is approaching
 * one. Bore water is the real constraint on this country, so the threshold is
 * drawn on every gauge rather than left implied by colour.
 */
export function WaterGauges() {
  const low = WATER_ASSETS.filter((w) => w.pct < THRESHOLD).length;

  return (
    <section className="bg-card border-border rounded-md border p-3.5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-foreground text-[0.78rem] font-semibold tracking-[-0.01em]">Water</h2>
        <p className={cn("text-[11px]", low ? "text-destructive" : "text-muted-foreground")}>
          {low ? `${low} below threshold` : "All above threshold"}
        </p>
      </header>

      <ul className="grid grid-cols-4 gap-2.5 lg:grid-cols-8">
        {WATER_ASSETS.map((w, i) => {
          const state = w.pct < THRESHOLD ? "bad" : w.pct < 40 ? "warn" : "ok";
          return (
            <li key={w.name} className="flex flex-col items-center gap-1.5">
              <div className="bg-secondary border-outline-soft relative h-[76px] w-full overflow-hidden rounded-[3px] border">
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0",
                    state === "bad"
                      ? "bg-destructive"
                      : state === "warn"
                        ? "bg-warning"
                        : "bg-primary/60",
                  )}
                  style={{
                    height: `${w.pct}%`,
                    animation: `mst-in .4s ease-out ${i * 0.04}s both`,
                  }}
                />
                <div
                  aria-hidden
                  className="border-ink-faint absolute inset-x-0 border-t border-dashed opacity-70"
                  style={{ bottom: `${THRESHOLD}%` }}
                />
              </div>
              <span
                className={cn(
                  "font-mono text-[11.5px] tabular",
                  state === "bad"
                    ? "text-destructive"
                    : state === "warn"
                      ? "text-warning"
                      : "text-foreground",
                )}
              >
                {pct(w.pct)}
              </span>
              <span className="text-ink-faint w-full truncate text-center text-[9.5px]">
                {w.name}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
