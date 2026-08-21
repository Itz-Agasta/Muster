"use client";

import { useEffect, useRef, useState } from "react";

import { clockTime } from "@/lib/format";
import { CRUISE_AGL, wobble } from "@/lib/sim/instruments";
import { dealReels, isCrew, type Reels } from "@/lib/sim/pov-reel";
import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

import { PovHud } from "./pov-hud";
import { PovStandby, type StandbyState } from "./pov-standby";

/** Painting a frame is the one state the standby surface has nothing to say about. */
type Link = StandbyState | "live";

/** A link takes a beat to come up, and a lost one takes longer to come back. */
const ACQUIRE_MS = 800;
const DROPOUT_MS = 1200;

/**
 * The selected aircraft's down camera, for the aircraft actually flying the
 * muster. MST-07 is on its own survey grid across the ranch and MST-02 is on
 * the pad, so neither carries a feed here; the panel says which, rather than
 * playing somebody else's paddock to fill the rectangle.
 *
 * Four clips are dealt across the two crew aircraft when a run commits, and a
 * feed drops between clips instead of looping. A clean fifteen second loop is
 * the thing that reads as a video element; a link that comes up, runs, drops
 * and reacquires is the thing that reads as a radio.
 *
 * It belongs to mission focus: a run in progress with PastureView up, which is
 * the state a committed muster puts the console into on its own at 6%. On
 * Satellite the imagery is already the picture, and an idle console has no
 * mission to look down on.
 *
 * Nothing is fetched until the operator asks. There is no poster and the video
 * carries preload="none", so /ops loads no video at all.
 *
 * It sits at bottom-11 rather than bottom-4 because MapLibre's attribution
 * lives in that corner and covering it is not ours to do.
 */
export function PovPanel() {
  const drones = useSim((s) => s.drones);
  const selectedDroneId = useSim((s) => s.selectedDroneId);
  const tick = useSim((s) => s.slowTick);
  const clock = useSim((s) => s.clock);
  const phase = useSim((s) => s.phase);
  const layer = useSim((s) => s.layer);

  const video = useRef<HTMLVideoElement>(null);
  const [reels, setReels] = useState<Reels>({});
  const [shot, setShot] = useState(0);
  const [link, setLink] = useState<Link>("standby");
  const [full, setFull] = useState(false);

  const lead = drones.find((d) => d.id === selectedDroneId);
  const available = !!lead && isCrew(lead.id) && lead.airborne;
  const reel = (lead && reels[lead.id]) ?? [];
  const src = available ? reel[shot % Math.max(reel.length, 1)] : undefined;

  // A committing run deals the pool again, so two consecutive demos do not open
  // on the same clip in the same order.
  useEffect(() => {
    setFull(false);
    setLink("standby");
    setShot(0);
    if (phase === "flying") setReels(dealReels());
  }, [phase]);

  // Switching aircraft is switching camera, not switching off. An operator who
  // has already asked for video gets the next aircraft's feed, not a button.
  useEffect(() => {
    setShot(0);
    setLink((l) => (l === "standby" ? l : "acquiring"));
  }, [selectedDroneId]);

  // Expanding rebuilds the tree around the video, so the element the ref points
  // at is a fresh one holding nothing. Treat it as a reacquire.
  useEffect(() => {
    setLink((l) => (l === "live" ? "acquiring" : l));
  }, [full]);

  // Playback is driven off the state, never off the click, which is what makes
  // the remounts above work. Calling play() in the handler left every expand
  // frozen on frame zero.
  useEffect(() => {
    if (link !== "acquiring") return;
    const t = setTimeout(() => void video.current?.play(), ACQUIRE_MS);
    return () => clearTimeout(t);
  }, [link, src]);

  useEffect(() => {
    if (link !== "dropped") return;
    const t = setTimeout(() => setLink("acquiring"), DROPOUT_MS);
    return () => clearTimeout(t);
  }, [link]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  if (!lead || phase !== "flying" || layer !== "pasture") return null;

  const frame = (
    <div className={cn("bg-map-base relative", full ? "size-full" : "aspect-video w-full")}>
      {src && (
        // Keyed on the clip so a new one mounts clean rather than inheriting the
        // last one's playhead. No loop: onEnded is what drives the dropout.
        <video
          key={src}
          ref={video}
          className="size-full object-cover"
          preload="none"
          muted
          playsInline
          onPlaying={() => setLink("live")}
          onEnded={() => {
            setShot((s) => s + 1);
            setLink("dropped");
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {link !== "live" && (
        <PovStandby
          state={available ? link : "unavailable"}
          reason={lead.task}
          large={full}
          label={`Open the ${lead.id} down camera feed`}
          onRequest={() => setLink("acquiring")}
        />
      )}

      <PovHud
        id={lead.id}
        altitude={lead.airborne ? wobble(tick, CRUISE_AGL, 4, 0) : 0}
        battery={Math.round(lead.battery)}
        heading={Math.round((lead.heading + 360) % 360)}
        clock={clockTime(clock)}
        state={!available ? "offline" : link === "live" ? "rec" : "standby"}
        large={full}
      />
    </div>
  );

  if (full) {
    return (
      <div
        className="bg-map-base absolute inset-0 z-30 flex flex-col"
        style={{ animation: "mst-in .28s ease-out both" }}
      >
        <header className="glass border-border flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="flex items-baseline gap-3">
            <p className="field-label">Down camera</p>
            <span className="text-foreground font-mono text-[12px]">{lead.id}</span>
            <span className="text-muted-foreground text-[11px]">{lead.task}</span>
          </div>
          <button
            type="button"
            onClick={() => setFull(false)}
            className="field-label hover:text-foreground transition-colors"
          >
            Close
          </button>
        </header>
        <div className="relative flex-1">{frame}</div>
      </div>
    );
  }

  return (
    <section
      className="glass border-border absolute right-4 bottom-11 z-10 w-[300px] overflow-hidden rounded-lg border shadow-md"
      style={{ animation: "mst-in .28s ease-out both" }}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-2">
        <p className="field-label">Down camera</p>
        {available && (
          <button
            type="button"
            onClick={() => {
              setFull(true);
              setLink((l) => (l === "standby" ? "acquiring" : l));
            }}
            aria-label="Expand the down camera over the map"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExpandIcon className="size-3.5" />
          </button>
        )}
      </header>

      {frame}

      <p className="text-muted-foreground px-3 pt-2 pb-2.5 text-[10px] leading-[1.45]">
        {lead.task}
      </p>
    </section>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 2H2v4M10 2h4v4M10 14h4v-4M6 14H2v-4" />
    </svg>
  );
}
