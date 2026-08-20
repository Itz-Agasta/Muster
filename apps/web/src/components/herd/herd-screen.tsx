"use client";

import { useMemo, useState } from "react";

import { HERD, HERD_STATS, type HealthStatus } from "@/lib/data/herd";
import { delta, kg, num } from "@/lib/format";
import { cn } from "@Muster/ui/lib/utils";

import { AnimalCard } from "./animal-card";
import { Beeswarm } from "./beeswarm";
import { DivergenceChart } from "./divergence-chart";
import { Measured } from "./measured";
import { ViewAllCard } from "./view-all-card";

type Filter = "faults" | "flagged" | "monitoring" | "all";

const CARD_LIMIT = 11;

const FILTERS: { id: Filter; label: string; count: number }[] = [
  { id: "faults", label: "Needs attention", count: HERD_STATS.flagged + HERD_STATS.monitoring },
  { id: "flagged", label: "Flagged", count: HERD_STATS.flagged },
  { id: "monitoring", label: "Monitoring", count: HERD_STATS.monitoring },
  { id: "all", label: "All head", count: HERD_STATS.total },
];

const MATCH: Record<Filter, (s: HealthStatus) => boolean> = {
  faults: (s) => s !== "healthy",
  flagged: (s) => s === "flagged",
  monitoring: (s) => s === "monitoring",
  all: () => true,
};

export function HerdScreen() {
  const [filter, setFilter] = useState<Filter>("faults");

  // Faults first, then the worst gainers. Never a raw slice of the herd order.
  // Eleven cards plus the view-all tile fills the grid without turning the
  // screen into a scroll of animals nobody needs to look at.
  const { cards, remaining } = useMemo(() => {
    const matching = HERD.filter((a) => MATCH[filter](a.status)).sort((a, b) => a.drift - b.drift);
    return {
      cards: matching.slice(0, CARD_LIMIT),
      remaining: Math.max(0, matching.length - CARD_LIMIT),
    };
  }, [filter]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <section className="grid flex-none grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Head monitored" value={num(HERD_STATS.total)} />
        <Stat label="Avg weight" value={kg(HERD_STATS.avgWeight)} />
        <Stat label="Flagged" value={String(HERD_STATS.flagged)} tone="bad" />
        <Stat
          label="Avg gain / day"
          value={`${delta(HERD_STATS.avgGainPerDay, 2)} kg`}
          tone="good"
        />
      </section>

      <section className="bg-card border-border flex-none rounded-md border p-3.5">
        <header className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-foreground text-[0.78rem] font-semibold tracking-[-0.01em]">
            Every head on the property
          </h2>
          <p className="text-muted-foreground text-[11px]">
            One dot per animal, counted on this morning&rsquo;s flight
          </p>
        </header>
        <Measured>{(w) => <Beeswarm width={w} />}</Measured>
      </section>

      <section className="bg-card border-border flex-none rounded-md border p-3.5">
        <header className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-foreground text-[0.78rem] font-semibold tracking-[-0.01em]">
            Where the mob is going, and who is not
          </h2>
          <p className="text-muted-foreground text-[11px]">
            Flagged animals leave the band before a rider would see it
          </p>
        </header>
        <Measured>{(w) => <DivergenceChart width={w} />}</Measured>
      </section>

      <section className="flex flex-none flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
                filter === f.id
                  ? "border-border bg-accent text-foreground"
                  : "border-outline-soft text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label}
              <span className="text-ink-faint ml-1.5 font-mono text-[9.5px] tabular">
                {num(f.count)}
              </span>
            </button>
          ))}
        </div>

        {cards.length === 0 ? (
          <p className="border-outline-soft text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-[11.5px]">
            Nothing in this state. The mob is holding condition.
          </p>
        ) : (
          <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(238px,1fr))]">
            {cards.map((a) => (
              <AnimalCard key={a.tag} animal={a} />
            ))}
            {remaining > 0 && <ViewAllCard remaining={remaining} />}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" | "good" }) {
  return (
    <div className="bg-card border-border flex flex-col gap-1 rounded-md border p-3">
      <span className="field-label">{label}</span>
      <span
        className={cn(
          "font-mono text-[19px] leading-none font-medium tabular",
          tone === "bad"
            ? "text-destructive"
            : tone === "good"
              ? "text-primary"
              : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
