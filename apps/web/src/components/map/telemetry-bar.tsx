"use client";

import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

/**
 * Tracked aircraft plus live instrument cells. Subscribes to slowTick so the
 * numbers breathe once a second instead of flickering at frame rate, which is
 * both unreadable and pointless.
 */
export function TelemetryBar() {
  const drones = useSim((s) => s.drones);
  const phase = useSim((s) => s.phase);
  const tick = useSim((s) => s.slowTick);

  const lead = drones.find((d) => d.id === "MST-04");
  if (!lead) return null;

  // Instruments wander inside plausible bands rather than sitting frozen.
  const wobble = (base: number, spread: number, offset: number) =>
    Math.round(base + Math.sin((tick + offset) * 0.7) * spread);

  const cells = [
    { k: "Altitude", v: String(wobble(126, 4, 0)), u: "m AGL" },
    { k: "Battery", v: String(Math.round(lead.battery)), u: "%" },
    { k: "Ground spd", v: String(wobble(24, 3, 2)), u: "kt" },
    { k: "Heading", v: String(Math.round((lead.heading + 360) % 360)).padStart(3, "0"), u: "deg" },
    { k: "Wind", v: String(wobble(14, 2, 4)), u: "kt NNE" },
    { k: "Link", v: String(wobble(-63, 4, 6)), u: "dBm" },
    { k: "GPS", v: String(wobble(19, 1, 8)), u: "sats" },
  ];

  return (
    <div className="glass border-border absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-380px)] flex-wrap items-stretch gap-x-5 gap-y-2 rounded-lg border px-3.5 py-2.5 shadow-md">
      <div className="border-outline-soft flex flex-col justify-center gap-0.5 border-r pr-5">
        <span className="field-label">Tracking</span>
        <span className="text-foreground flex items-center gap-2 font-mono text-[12px]">
          <span
            className={cn(
              "size-1.5 flex-none rounded-full",
              phase === "flying"
                ? "bg-primary animate-[mst-live_1.8s_ease-in-out_infinite]"
                : "bg-primary",
            )}
          />
          {lead.id}
        </span>
      </div>

      {cells.map((c) => (
        <div key={c.k} className="flex flex-col justify-center gap-0.5">
          <span className="field-label">{c.k}</span>
          <span className="text-foreground font-mono text-[12px] whitespace-nowrap tabular">
            {c.v}
            <span className="text-ink-faint ml-1 text-[9.5px]">{c.u}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
