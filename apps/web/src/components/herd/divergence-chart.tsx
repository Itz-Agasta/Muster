"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { useEffect, useId, useMemo, useState } from "react";

import { buildTrajectories, faultNote, type TrajectoryPoint } from "@/lib/data/herd";
import { statusColor, useChartPalette } from "@/lib/chart/palette";
import { delta } from "@/lib/format";

const HEIGHT = 300;
const PAD = { top: 18, right: 92, bottom: 30, left: 44 };

/**
 * Thirty days of weight change. The mob is a p10 to p90 band with its median;
 * the three flagged animals are thin threads on top. Because every animal is
 * normalised to its own starting weight, an animal going backwards drops clean
 * out of the band, days before a person walking the paddock would have noticed.
 * That gap is the whole argument for flying the country daily.
 */
export function DivergenceChart({ width = 900 }: { width?: number }) {
  const palette = useChartPalette();
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const clipId = useId().replace(/:/g, "");
  const drawn = useDrawIn();

  const { band, threads } = useMemo(() => buildTrajectories(), []);

  const x = scaleLinear()
    .domain([0, 30])
    .range([PAD.left, width - PAD.right]);

  const lows = band.map((d) => d.p10);
  const highs = band.map((d) => d.p90);
  const threadLows = threads.flatMap((t) => t.points.map((p) => p.weight));
  const y = scaleLinear()
    .domain([Math.min(...lows, ...threadLows) - 6, Math.max(...highs) + 6])
    .range([HEIGHT - PAD.bottom, PAD.top])
    .nice();

  const bandArea = area<TrajectoryPoint>()
    .x((d) => x(d.day))
    .y0((d) => y(d.p10))
    .y1((d) => y(d.p90))
    .curve(curveMonotoneX);

  const innerArea = area<TrajectoryPoint>()
    .x((d) => x(d.day))
    .y0((d) => y(d.p25))
    .y1((d) => y(d.p75))
    .curve(curveMonotoneX);

  const medianLine = line<TrajectoryPoint>()
    .x((d) => x(d.day))
    .y((d) => y(d.median))
    .curve(curveMonotoneX);

  const threadLine = line<{ day: number; weight: number }>()
    .x((d) => x(d.day))
    .y((d) => y(d.weight))
    .curve(curveMonotoneX);

  const yTicks = y.ticks(5);
  const hovered = hoverDay === null ? null : band[hoverDay];

  return (
    <figure className="relative m-0">
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label="Thirty days of weight change: the mob range with the three flagged animals drawn separately"
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * width;
          const day = Math.round(x.invert(px));
          setHoverDay(day >= 0 && day <= 30 ? day : null);
        }}
        onMouseLeave={() => setHoverDay(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={palette.grid} />
            <text
              x={PAD.left - 8}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-ink-faint font-mono text-[9px]"
            >
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        ))}

        {/* Zero is the line that matters: below it an animal is losing condition. */}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={y(0)}
          y2={y(0)}
          stroke={palette.axis}
          strokeWidth={1}
        />

        {/*
          The chart draws itself in from day 0 to today, so the reader watches
          the mob climb and the flagged animals peel away rather than being
          handed the finished answer. One clip rect sweeps every mark at once,
          which keeps the band and the threads in step.
        */}
        <clipPath id={clipId}>
          <rect
            x={0}
            y={0}
            height={HEIGHT}
            width={drawn ? width : PAD.left}
            style={{ transition: `width ${DRAW_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` }}
          />
        </clipPath>

        <g clipPath={`url(#${clipId})`}>
          <path d={bandArea(band) ?? ""} fill={palette.band} />
          <path d={innerArea(band) ?? ""} fill={palette.band} />
          <path
            d={medianLine(band) ?? ""}
            fill="none"
            stroke={palette.median}
            strokeWidth={2}
            strokeLinecap="round"
          />

          {threads.map((t) => {
            const last = t.points[t.points.length - 1]!;
            const colour = statusColor(palette, t.status);
            return (
              <g key={t.tag}>
                <path
                  d={threadLine(t.points) ?? ""}
                  fill="none"
                  stroke={colour}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
                <circle
                  cx={x(30)}
                  cy={y(last.weight)}
                  r={3}
                  fill={colour}
                  stroke={palette.surface}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </g>

        {/* Tags land after the sweep reaches them, never ahead of their own line. */}
        {threads.map((t) => {
          const last = t.points[t.points.length - 1]!;
          return (
            <text
              key={`end-${t.tag}`}
              x={x(30) + 8}
              y={y(last.weight) + 3}
              className="font-mono text-[9.5px]"
              fill={statusColor(palette, t.status)}
              opacity={drawn ? 1 : 0}
              style={{ transition: `opacity 240ms ease-out ${Math.round(DRAW_MS * 0.75)}ms` }}
            >
              {t.tag}
            </text>
          );
        })}

        {hoverDay !== null && (
          <line
            x1={x(hoverDay)}
            x2={x(hoverDay)}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke={palette.axis}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {[0, 10, 20, 30].map((d) => (
          <text
            key={d}
            x={x(d)}
            y={HEIGHT - 10}
            textAnchor="middle"
            className="fill-ink-faint font-mono text-[9px]"
          >
            {d === 30 ? "today" : `d-${30 - d}`}
          </text>
        ))}
      </svg>

      <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Key colour={palette.median} label="Mob median" />
        <Key colour={palette.band} label="Middle 80% of the mob" solid />
        <Key colour={palette.flagged} label="Flagged" />
        <span className="text-ink-faint ml-auto font-mono text-[9px]">kg gained since day 0</span>
      </figcaption>

      {hovered && (
        <div
          className="glass border-border pointer-events-none absolute top-4 rounded-md border px-2.5 py-1.5 shadow-md"
          style={{
            left: `${(x(hovered.day) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="field-label">{hovered.day === 30 ? "Today" : `Day ${hovered.day}`}</p>
          <p className="text-foreground font-mono text-[11px] tabular">
            median {delta(hovered.median, 1)} kg
          </p>
          <p className="text-muted-foreground font-mono text-[9.5px] tabular">
            p10 {delta(hovered.p10, 1)} · p90 {delta(hovered.p90, 1)}
          </p>
        </div>
      )}

      <p className="text-muted-foreground mt-2.5 text-[11px] leading-[1.5]">
        {faultNote("KJ-4471")}
      </p>
    </figure>
  );
}

/**
 * The map is the only thing allowed a longer ease than 320ms, and this is the
 * second: a sweep faster than about a second reads as a glitch rather than as
 * the data arriving. Under reduced motion the chart is simply already drawn.
 */
const DRAW_MS = 1100;

function useDrawIn(): boolean {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    // Two frames: one to commit the collapsed width, one to transition off it.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  return drawn;
}

function Key({ colour, label, solid }: { colour: string; label: string; solid?: boolean }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-[10.5px]">
      <span
        className="inline-block h-[3px] w-4 rounded-full"
        style={{ background: colour, height: solid ? 8 : 3 }}
      />
      {label}
    </span>
  );
}
