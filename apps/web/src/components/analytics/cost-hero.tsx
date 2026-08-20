"use client";

import NumberFlow from "@number-flow/react";

import { useSim } from "@/lib/sim/store";

/**
 * Rupees not spent on jeeps, fuel and hired herders since the start of the
 * season. The counter ticks against the live sim, so it is visibly still running
 * while a judge reads the rest of the screen.
 */
export function CostHero() {
  const costSaved = useSim((s) => s.costSaved);
  const tick = useSim((s) => s.slowTick);

  return (
    <section className="border-border relative overflow-hidden rounded-md border p-5">
      {/* The one gradient the design allows: a 60% fade behind the hero metric. */}
      <div
        aria-hidden
        className="from-primary/25 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent to-60%"
      />
      <div className="relative flex flex-col gap-2">
        <p className="field-label">Mustering cost avoided this season</p>
        <NumberFlow
          value={Math.round(costSaved)}
          format={{ style: "currency", currency: "INR", maximumFractionDigits: 0 }}
          locales="en-IN"
          className="metric-xl text-foreground"
          aria-label="Rupees saved this season"
        />
        <p className="text-muted-foreground text-[11.5px]">
          Against 41 musters run the old way with jeeps, fuel and hired herders. Accruing at about{" "}
          {"₹"}2.84 a second while the fleet is up.
        </p>
        <span className="sr-only" aria-live="off">
          tick {tick}
        </span>
      </div>
    </section>
  );
}
