"use client";

import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

/**
 * Instruments for the selected aircraft. Subscribes to slowTick so the numbers
 * breathe once a second instead of flickering at frame rate, which is both
 * unreadable and pointless.
 *
 * The tracking cell is also the follow control. It already names the aircraft
 * the camera would follow, so putting the toggle anywhere else would be putting
 * it away from the thing it acts on.
 */
export function TelemetryBar() {
  const drones = useSim((s) => s.drones);
  const phase = useSim((s) => s.phase);
  const tick = useSim((s) => s.slowTick);
  const selectedDroneId = useSim((s) => s.selectedDroneId);
  const following = useSim((s) => s.following);
  const setFollowing = useSim((s) => s.setFollowing);

  const lead = drones.find((d) => d.id === selectedDroneId);
  if (!lead) return null;

  // Instruments wander inside plausible bands rather than sitting frozen.
  const wobble = (base: number, spread: number, offset: number) =>
    Math.round(base + Math.sin((tick + offset) * 0.7) * spread);

  // A docked aircraft is on the pad with its rotors stopped, so it reads zeros
  // rather than a cruise it is not flying.
  const cells = lead.airborne
    ? [
        { k: "Altitude", v: String(wobble(126, 4, 0)), u: "m AGL" },
        { k: "Battery", v: String(Math.round(lead.battery)), u: "%" },
        { k: "Ground spd", v: String(wobble(24, 3, 2)), u: "kt" },
        {
          k: "Heading",
          v: String(Math.round((lead.heading + 360) % 360)).padStart(3, "0"),
          u: "deg",
        },
        { k: "Wind", v: String(wobble(14, 2, 4)), u: "kt NNE" },
        { k: "Link", v: String(wobble(-63, 4, 6)), u: "dBm" },
        { k: "GPS", v: String(wobble(19, 1, 8)), u: "sats" },
      ]
    : [
        { k: "Altitude", v: "0", u: "m AGL" },
        { k: "Battery", v: String(Math.round(lead.battery)), u: "%" },
        { k: "State", v: "Charging", u: "" },
        { k: "Wind", v: String(wobble(14, 2, 4)), u: "kt NNE" },
        { k: "Link", v: String(wobble(-41, 2, 6)), u: "dBm" },
        { k: "GPS", v: String(wobble(21, 1, 8)), u: "sats" },
      ];

  return (
    <div className="glass border-border absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-380px)] flex-wrap items-stretch gap-x-5 gap-y-2 rounded-lg border px-3.5 py-2.5 shadow-md">
      <div className="border-outline-soft flex flex-col justify-center gap-0.5 border-r pr-5">
        <span className="field-label">Tracking</span>
        <button
          type="button"
          onClick={() => setFollowing(!following)}
          aria-pressed={following}
          className="flex items-center gap-2 font-mono text-[12px]"
        >
          <span
            className={cn(
              "size-1.5 flex-none rounded-full",
              lead.airborne ? "bg-primary" : "bg-ink-faint",
              phase === "flying" && lead.airborne && "animate-[mst-live_1.8s_ease-in-out_infinite]",
            )}
          />
          <span className="text-foreground">{lead.id}</span>
          <span
            className={cn(
              "field-label transition-colors",
              following ? "text-primary" : "hover:text-foreground",
            )}
          >
            {following ? "Following" : "Follow"}
          </span>
        </button>
      </div>

      {cells.map((c) => (
        <div key={c.k} className="flex flex-col justify-center gap-0.5">
          <span className="field-label">{c.k}</span>
          <span className="text-foreground font-mono text-[12px] whitespace-nowrap tabular">
            {c.v}
            {c.u && <span className="text-ink-faint ml-1 text-[9.5px]">{c.u}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
