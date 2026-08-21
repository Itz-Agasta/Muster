"use client";

import { cn } from "@Muster/ui/lib/utils";

/**
 * The instrument furniture that sits over the clip. This is the part that does
 * the selling: the footage is stock aerial, graded to Banni, and it is the
 * reticle, the corner brackets and the REC dot that make it read as a machine
 * looking down rather than as a nature documentary.
 *
 * Everything is white with a hard shadow because it has to stay legible over a
 * frame we do not control the exposure of. Chrome tokens would vanish over the
 * bright ground the same way the PastureView ramp's low end did.
 */
export function PovHud({
  id,
  altitude,
  battery,
  heading,
  clock,
  state,
  large = false,
}: {
  id: string;
  altitude: number;
  battery: number;
  heading: number;
  clock: string;
  /** Recording only while the clip actually runs. A poster is not a feed. */
  state: "rec" | "standby" | "offline";
  large?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 font-mono tracking-[0.08em] text-white uppercase [text-shadow:0_1px_2px_rgb(0_0_0/0.85)]",
        large ? "text-[12px]" : "text-[8.5px]",
      )}
    >
      {CORNERS.map((c) => (
        <span
          key={c}
          className={cn(
            "absolute border-white/70",
            large ? "size-7" : "size-3",
            large ? CORNER_LG[c] : CORNER_SM[c],
          )}
        />
      ))}

      {/* Reticle. Four ticks and a gap, so the centre of frame stays readable.
          It only belongs to a running feed: a parked aircraft has nothing to aim
          at, and on a still poster the ticks draw straight through whatever the
          panel has put in the middle, the play control or the no-feed notice. */}
      <span
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          large ? "size-24" : "size-9",
          state !== "rec" && "hidden",
        )}
      >
        <span className={cn("absolute top-1/2 left-0 h-px bg-white/80", large ? "w-7" : "w-2.5")} />
        <span
          className={cn("absolute top-1/2 right-0 h-px bg-white/80", large ? "w-7" : "w-2.5")}
        />
        <span className={cn("absolute top-0 left-1/2 w-px bg-white/80", large ? "h-7" : "h-2.5")} />
        <span
          className={cn("absolute bottom-0 left-1/2 w-px bg-white/80", large ? "h-7" : "h-2.5")}
        />
      </span>

      <span
        className={cn(
          "absolute flex items-center",
          large ? "top-5 left-5 gap-2.5" : "top-2 left-2 gap-1.5",
        )}
      >
        <span
          className={cn(
            "rounded-full",
            large ? "size-2" : "size-1.5",
            state === "rec"
              ? "animate-[mst-live_1.6s_ease-in-out_infinite] bg-[#e5484d]"
              : "bg-white/50",
          )}
        />
        {state === "rec" ? "Rec" : "Std by"}
      </span>
      <span className={cn("absolute tabular", large ? "top-5 right-5" : "top-2 right-2")}>
        {clock} IST
      </span>

      <span className={cn("absolute tabular", large ? "bottom-5 left-5" : "bottom-2 left-2")}>
        {altitude} m agl &middot; {String(heading).padStart(3, "0")}&deg;
      </span>
      <span className={cn("absolute tabular", large ? "right-5 bottom-5" : "right-2 bottom-2")}>
        {id} &middot; Bat {battery}%
      </span>
    </div>
  );
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

const CORNER_SM: Record<(typeof CORNERS)[number], string> = {
  tl: "top-1.5 left-1.5 border-t border-l",
  tr: "top-1.5 right-1.5 border-t border-r",
  bl: "bottom-1.5 left-1.5 border-b border-l",
  br: "right-1.5 bottom-1.5 border-r border-b",
};

const CORNER_LG: Record<(typeof CORNERS)[number], string> = {
  tl: "top-3.5 left-3.5 border-t-2 border-l-2",
  tr: "top-3.5 right-3.5 border-t-2 border-r-2",
  bl: "bottom-3.5 left-3.5 border-b-2 border-l-2",
  br: "right-3.5 bottom-3.5 border-r-2 border-b-2",
};
