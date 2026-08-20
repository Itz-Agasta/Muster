"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";

import { HERD, type Animal } from "@/lib/data/herd";
import { statusColor, STATUS_LABEL, useChartPalette } from "@/lib/chart/palette";
import { kg } from "@/lib/format";
import { useSim } from "@/lib/sim/store";

const HEIGHT = 190;
const PAD = { top: 14, right: 16, bottom: 26, left: 16 };
const DOT = 2.3;

type Placed = { a: Animal; x: number; y: number };

/**
 * Every head on the property, one dot each, positioned by weight for age and
 * coloured by status. The mob is a dense green mass; the animals in trouble sit
 * out on the left where you cannot miss them.
 *
 * Layout is a dodge: sweep left to right and drop each dot into the nearest free
 * slot above or below the centre line, so overlapping animals stack instead of
 * hiding each other.
 */
export function Beeswarm({ width = 900 }: { width?: number }) {
  const palette = useChartPalette();
  const [hover, setHover] = useState<Placed | null>(null);
  // Weights drift as the sim runs; re-lay out on the slow tick, not per frame.
  const tick = useSim((s) => s.slowTick);

  const { placed, x } = useMemo(() => {
    const scale = scaleLinear()
      .domain([-3.2, 3.2])
      .range([PAD.left, width - PAD.right])
      .clamp(true);

    const mid = PAD.top + (HEIGHT - PAD.top - PAD.bottom) / 2;
    const step = DOT * 2 + 0.6;
    // One bucket per dot-width of x, holding how many dots already sit there.
    const buckets = new Map<number, number>();

    const out: Placed[] = HERD.map((a) => {
      const px = scale(a.z);
      const key = Math.round(px / step);
      const n = buckets.get(key) ?? 0;
      buckets.set(key, n + 1);
      // 0 centre, then alternate above and below.
      const rank = Math.ceil(n / 2) * (n % 2 === 0 ? -1 : 1);
      return { a, x: px, y: mid + rank * step };
    });

    return { placed: out, x: scale };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, tick]);

  const ticks = [-2, -1, 0, 1, 2];
  const labelled = useMemo(
    () => placed.filter((p) => p.a.status === "flagged").sort((a, b) => a.x - b.x),
    [placed],
  );

  return (
    <figure className="relative m-0">
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Weight for age across ${HERD.length} head, one dot per animal`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={PAD.top - 6}
              y2={HEIGHT - PAD.bottom + 2}
              stroke={palette.grid}
              strokeWidth={1}
            />
            <text
              x={x(t)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-ink-faint font-mono text-[9px]"
            >
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        ))}

        {placed.map((p) => {
          const flagged = p.a.status !== "healthy";
          return (
            <circle
              key={p.a.tag}
              cx={p.x}
              cy={p.y}
              r={flagged ? DOT + 1.4 : DOT}
              fill={statusColor(palette, p.a.status)}
              fillOpacity={p.a.status === "healthy" ? 0.62 : 1}
              stroke={flagged ? palette.surface : "none"}
              strokeWidth={flagged ? 1.5 : 0}
              onMouseEnter={() => setHover(p)}
            />
          );
        })}

        {/*
          The three flagged animals are named on the chart, not just coloured.
          They cluster at the light end, so labels are stepped apart vertically
          and given a leader line rather than allowed to overprint each other.
        */}
        {labelled.map((p, i) => {
          const ly = PAD.top + 4 + i * 11;
          return (
            <g key={`l-${p.a.tag}`}>
              <line
                x1={p.x}
                y1={p.y - DOT - 2}
                x2={p.x}
                y2={ly + 3}
                stroke={palette.flagged}
                strokeWidth={0.75}
                strokeOpacity={0.5}
              />
              <text
                x={p.x}
                y={ly}
                textAnchor="middle"
                className="font-mono text-[9px]"
                fill={palette.flagged}
              >
                {p.a.tag}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="field-label mt-1 text-center">
        Weight for age, standard deviations from the mob mean
      </figcaption>

      {hover && (
        <div
          className="glass border-border pointer-events-none absolute z-10 rounded-md border px-2.5 py-1.5 shadow-md"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: hover.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-foreground font-mono text-[11px]">{hover.a.tag}</p>
          <p className="text-muted-foreground font-mono text-[9.5px]">
            {kg(hover.a.weight)} · {STATUS_LABEL[hover.a.status]}
          </p>
        </div>
      )}
    </figure>
  );
}
