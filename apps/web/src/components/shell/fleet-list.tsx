"use client";

import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

/** Aircraft rows: id, live battery, current task. Batteries drain as they fly. */
export function FleetList() {
  const drones = useSim((s) => s.drones);

  return (
    <div className="border-border flex-none border-t px-4 pt-3.5 pb-4">
      <p className="field-label pb-2.5">Fleet</p>
      <ul className="flex flex-col gap-3">
        {drones.map((d) => {
          const low = d.battery < 25;
          return (
            <li key={d.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground flex items-center gap-2 font-mono text-[11px]">
                  <span
                    className={cn(
                      "size-1.5 flex-none rounded-full",
                      d.airborne ? "bg-primary" : "bg-border",
                    )}
                  />
                  {d.id}
                </span>
                <span
                  className={cn(
                    "font-mono text-[11px] tabular",
                    low ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {Math.round(d.battery)}%
                </span>
              </div>
              <div className="bg-border h-[3px] overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    low ? "bg-destructive" : "bg-primary/80",
                  )}
                  style={{ width: `${d.battery}%` }}
                />
              </div>
              <span className="text-ink-faint truncate text-[10px]">{d.task}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
