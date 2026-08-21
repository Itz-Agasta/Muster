"use client";

import { useTheme } from "next-themes";

import { PASTURE_RAMP, PASTURE_STOPS } from "@/lib/map/style";
import { useSim, type LayerMode } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

const MODES: { id: LayerMode; label: string }[] = [
  { id: "satellite", label: "Satellite" },
  { id: "pasture", label: "PastureView" },
];

/**
 * The layer switch and the legend are one surface, not two. The legend has
 * nothing to say while the imagery is up, so the bar grows a second row when
 * PastureView is on and stays a bare switch otherwise.
 */
export function LayerBar() {
  const layer = useSim((s) => s.layer);
  const setLayer = useSim((s) => s.setLayer);
  const { resolvedTheme } = useTheme();
  const ramp = PASTURE_RAMP[resolvedTheme === "light" ? "light" : "dark"];

  return (
    <section className="glass border-border flex w-fit flex-col gap-2.5 rounded-lg border p-2.5 shadow-md">
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setLayer(m.id)}
            aria-pressed={layer === m.id}
            className={cn(
              "field-label rounded-md border px-2.5 py-1.5 transition-colors",
              layer === m.id
                ? "border-primary-outline bg-accent text-primary"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {layer === "pasture" && (
        <div
          className="border-outline-soft flex w-[214px] flex-col gap-1.5 border-t pt-2.5"
          style={{ animation: "mst-in .28s ease-out both" }}
        >
          {/* One continuous gradient, because the fill on the map is interpolated.
              Five swatches would claim the data is banded when it is not. */}
          <span
            className="h-2 rounded-[2px]"
            style={{ background: `linear-gradient(to right, ${ramp.join(", ")})` }}
          />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-ink-faint font-mono text-[9px] tabular">{PASTURE_STOPS[0]}</span>
            <span className="field-label">t DM / ha</span>
            <span className="text-ink-faint font-mono text-[9px] tabular">
              {PASTURE_STOPS[PASTURE_STOPS.length - 1]}
            </span>
          </div>
          <p className="text-muted-foreground text-[10px] leading-[1.45]">
            Captured 07:12 IST by MST-07 on the Ludiya survey grid. 120 m cells.
          </p>
        </div>
      )}
    </section>
  );
}
