"use client";

import { statusColor, STATUS_LABEL, useChartPalette } from "@/lib/chart/palette";
import { faultNote, sparkSeries, type Animal } from "@/lib/data/herd";
import { paddock } from "@/lib/data/ranch";
import { delta, eid, kg, relativeTime } from "@/lib/format";
import { cn } from "@Muster/ui/lib/utils";

export function AnimalCard({ animal }: { animal: Animal }) {
  const palette = useChartPalette();
  const flagged = animal.status === "flagged";
  const colour = statusColor(palette, animal.status);
  const note = faultNote(animal.tag);

  return (
    <article
      className={cn(
        "bg-card flex flex-col gap-3 rounded-md border p-3.5 transition-colors",
        flagged
          ? "border-danger-outline hover:border-destructive"
          : "border-border hover:border-ink-faint",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground flex items-center gap-2 font-mono text-[13px]">
            {flagged && (
              <span
                className="size-1.5 flex-none animate-[mst-live_1.8s_ease-in-out_infinite] rounded-full"
                style={{ background: colour }}
              />
            )}
            {animal.tag}
          </p>
          <p className="meta-mono truncate">
            {animal.sex} · {animal.ageMonths} mo · {animal.breed}
          </p>
        </div>
        <span
          className="flex-none rounded-full border px-2 py-1 text-[9.5px] font-semibold whitespace-nowrap"
          style={{
            color: colour,
            borderColor: colour,
            background: `color-mix(in oklab, ${colour} 12%, transparent)`,
          }}
        >
          {STATUS_LABEL[animal.status]}
        </span>
      </header>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-foreground font-mono text-[19px] leading-none font-medium tabular">
            {kg(animal.weight)}
          </p>
          <p
            className="mt-1 font-mono text-[10px] tabular"
            style={{ color: animal.drift < 0 ? colour : undefined }}
          >
            <span className={animal.drift < 0 ? "" : "text-muted-foreground"}>
              {delta(animal.drift, 1)} kg / 30d
            </span>
          </p>
        </div>
        <Sparkline values={sparkSeries(animal)} colour={animal.drift < 0 ? colour : palette.axis} />
      </div>

      {flagged && note && (
        <p
          className="rounded-md border px-2.5 py-2 text-[10.5px] leading-[1.45]"
          style={{
            color: colour,
            borderColor: `color-mix(in oklab, ${colour} 40%, transparent)`,
            background: `color-mix(in oklab, ${colour} 8%, transparent)`,
          }}
        >
          {note}
        </p>
      )}

      <footer className="border-outline-soft flex items-center justify-between gap-2 border-t pt-2.5">
        <span className="text-muted-foreground truncate text-[10.5px]">
          {paddock(animal.paddockId).name}
        </span>
        <span className="meta-mono flex-none">{relativeTime(animal.minutesSinceSeen)}</span>
      </footer>

      <span className="sr-only">{eid(animal.tag)}</span>
    </article>
  );
}

/**
 * Raw SVG rather than a chart library: no axes, no tooltip, no legend, and a
 * dozen of them on screen at once. The draw-in uses stroke-dashoffset, which a
 * charting wrapper would only get in the way of.
 */
function Sparkline({ values, colour }: { values: number[]; colour: string }) {
  const w = 88;
  const h = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${((i * w) / (values.length - 1)).toFixed(1)},${(h - ((v - min) / span) * (h - 4) - 2).toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="flex-none">
      <polyline
        points={points}
        fill="none"
        stroke={colour}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={100}
        style={{ animation: "mst-draw 1.1s ease-out both", ["--draw-length" as string]: 100 }}
      />
    </svg>
  );
}
