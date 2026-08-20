"use client";

import { scaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";

import { pastureTrend } from "@/lib/data/pasture-series";
import { paddock, RANCH } from "@/lib/data/ranch";
import { delta, ha } from "@/lib/format";
import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

const W = 196;
const H = 46;

/**
 * Click a paddock under PastureView and this reads its eighteen weeks against
 * the cover the co-op rotates on. The map answers how much feed is out there;
 * this answers which way it is moving, which is the number that decides whether
 * the mob goes there next.
 */
export function PastureReadout() {
  const layer = useSim((s) => s.layer);
  const inspectedId = useSim((s) => s.inspectedId);
  const inspect = useSim((s) => s.inspect);

  if (layer !== "pasture" || !inspectedId) return null;

  const p = paddock(inspectedId);
  const trend = pastureTrend(inspectedId);
  const target = RANCH.targetCover;

  const lows = Math.min(...trend.series, target);
  const highs = Math.max(...trend.series, target);
  const x = scaleLinear()
    .domain([0, trend.series.length - 1])
    .range([1, W - 1]);
  const y = scaleLinear()
    .domain([lows * 0.92, highs * 1.06])
    .range([H - 2, 2]);
  const path =
    line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX)(trend.series) ?? "";

  return (
    <section
      className="glass border-border flex flex-col gap-2.5 rounded-lg border p-2.5 shadow-md"
      style={{ animation: "mst-in .28s ease-out both" }}
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-foreground truncate text-[12px] font-medium">{p.name}</h2>
        <button
          type="button"
          onClick={() => inspect(null)}
          className="field-label hover:text-foreground transition-colors"
        >
          Close
        </button>
      </header>

      <p className="text-foreground metric flex items-baseline gap-1.5">
        {trend.current.toFixed(1)}
        <span className="field-label">t DM / ha</span>
      </p>

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Standing dry matter over eighteen weeks, now ${trend.current.toFixed(1)} tonnes per hectare against a target of ${target}`}
      >
        <line
          x1={0}
          x2={W}
          y1={y(target)}
          y2={y(target)}
          stroke="var(--ink-faint)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={320}
          style={{ animation: "mst-draw .6s ease-out both", ["--draw-length" as string]: 320 }}
        />
        <circle
          cx={x(trend.series.length - 1)}
          cy={y(trend.current)}
          r={2.6}
          fill="var(--primary)"
        />
      </svg>

      <div className="text-ink-faint flex justify-between font-mono text-[9px]">
        <span>18 weeks ago</span>
        <span>Target {target} t</span>
        <span>Now</span>
      </div>

      <dl className="border-outline-soft grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t pt-2.5">
        <Row k="Growth">
          <span className={cn(trend.growthKgPerDay >= 0 ? "text-primary" : "text-warning")}>
            {delta(trend.growthKgPerDay, 0)} kg/day
          </span>
        </Row>
        <Row k="Cover">
          <span className={cn(trend.aboveTarget ? "text-primary" : "text-warning")}>
            {trend.aboveTarget ? "Above target" : "Below target"}
          </span>
        </Row>
        <Row k="Rest">{p.restNote}</Row>
        <Row k="Area">{ha(p.areaHa)}</Row>
      </dl>
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="field-label self-center">{k}</dt>
      <dd className="text-foreground text-right font-mono text-[11px] tabular">{children}</dd>
    </>
  );
}
