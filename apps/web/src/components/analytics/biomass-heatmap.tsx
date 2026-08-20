"use client";

import { BIOMASS_ROWS } from "@/lib/data/operations";
import { paddock } from "@/lib/data/ranch";

/**
 * Eighteen weeks of standing dry matter, one row per paddock. Graded alpha on a
 * single hue: this is a magnitude, so it gets a sequential ramp, never a set of
 * categorical colours. Rows fade in on mount, top to bottom.
 */

/**
 * Values only span about 0.14 to 0.95, so a linear alpha maps them into a narrow
 * band and a bare paddock looks much like a full one. The exponent pushes the
 * low end down and the range is widened, which is what makes the rows readable
 * against each other.
 */
const ramp = (v: number) => 0.05 + Math.pow(v, 1.45) * 0.92;
export function BiomassHeatmap() {
  return (
    <section className="bg-card border-border rounded-md border p-3.5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-foreground text-[0.78rem] font-semibold tracking-[-0.01em]">
          Standing dry matter
        </h2>
        <p className="text-muted-foreground text-[11px]">18 weeks, measured from the air</p>
      </header>

      <div className="flex flex-col gap-1.5">
        {BIOMASS_ROWS.map((row, i) => (
          <div
            key={row.paddockId}
            className="grid items-center gap-3"
            style={{
              gridTemplateColumns: "minmax(96px, 132px) 1fr minmax(40px, auto)",
              animation: `mst-in .34s ease-out ${i * 0.06}s both`,
            }}
          >
            <span className="text-muted-foreground truncate text-[11px]">
              {paddock(row.paddockId).name}
            </span>
            <div className="flex gap-[2px]">
              {row.cells.map((v, c) => (
                <span
                  key={c}
                  className="bg-primary h-[22px] flex-1 rounded-[3px]"
                  style={{ opacity: ramp(v) }}
                  title={`week ${c + 1}: ${(v * 6.4).toFixed(1)} t DM/ha`}
                />
              ))}
            </div>
            <span className="text-foreground text-right font-mono text-[11px] tabular">
              {row.current}
            </span>
          </div>
        ))}
      </div>

      <footer className="border-outline-soft mt-3 flex items-center gap-2 border-t pt-2.5">
        <span className="field-label">Low</span>
        <span className="flex flex-1 gap-[2px]">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <span
              key={v}
              className="bg-primary h-2 flex-1 rounded-[2px]"
              style={{ opacity: ramp(v) }}
            />
          ))}
        </span>
        <span className="field-label">High</span>
        <span className="text-ink-faint ml-2 font-mono text-[9px]">t DM / ha</span>
      </footer>
    </section>
  );
}
