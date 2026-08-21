"use client";

import { cn } from "@Muster/ui/lib/utils";

/** What the panel is doing when it is not painting a frame. */
export type StandbyState = "standby" | "acquiring" | "dropped" | "unavailable";

const COPY: Record<Exclude<StandbyState, "standby">, string> = {
  acquiring: "Acquiring link",
  dropped: "Signal lost · reacquiring",
  unavailable: "No feed",
};

/**
 * What the panel shows whenever it is not painting a frame.
 *
 * Deliberately never a still off the clip. A frozen frame of aerial footage
 * parked in the corner of the console is the exact tell that says stock
 * library, and it also claims to be a camera view while nothing is connected.
 * This is console furniture instead: map ground, a faint instrument hatch, and
 * whatever the link is honestly doing.
 */
export function PovStandby({
  state,
  reason,
  large,
  label,
  onRequest,
}: {
  state: StandbyState;
  /** The aircraft's own task, shown only where nothing else carries it. */
  reason: string;
  large?: boolean;
  label: string;
  onRequest: () => void;
}) {
  const body = large ? "text-[12px]" : "text-[9px]";
  const sub = large ? "text-[11px]" : "text-[8.5px]";

  if (state === "standby") {
    return (
      <Surface>
        <button
          type="button"
          onClick={onRequest}
          aria-label={label}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2"
        >
          <span
            className={cn(
              "border-outline-soft bg-card text-foreground group-hover:border-primary-outline group-hover:text-primary relative flex items-center justify-center rounded-full border transition-colors",
              large ? "size-16" : "size-8",
            )}
          >
            <PlayIcon className={large ? "size-6" : "size-3.5"} />
          </span>
          <span
            className={cn(
              "field-label group-hover:text-foreground relative transition-colors",
              large && "text-[11px]",
            )}
          >
            Open feed
          </span>
        </button>
      </Surface>
    );
  }

  return (
    <Surface>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {state !== "unavailable" && <Spinner large={large} />}
        <span
          className={cn(
            "text-ink-faint font-mono tracking-[0.1em] uppercase",
            state !== "unavailable" && "animate-[mst-live_1.4s_ease-in-out_infinite]",
            body,
          )}
        >
          {COPY[state]}
        </span>
        {/* The card carries the aircraft's task in its own caption. Only the
            expanded view, which has no caption, needs it repeated here. */}
        {large && <span className={cn("text-ink-faint", sub)}>{reason}</span>}
      </div>
    </Surface>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-map-base absolute inset-0">
      {/* A faint instrument hatch, so a waiting panel reads as a live surface
          without a stream rather than as an image that failed to load. */}
      <span
        aria-hidden
        className="text-ink-faint absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 8px)",
        }}
      />
      {children}
    </div>
  );
}

function Spinner({ large }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "border-outline-soft border-t-primary animate-spin rounded-full border-2",
        large ? "size-7" : "size-4",
      )}
    />
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M5.5 3.4v9.2a.5.5 0 0 0 .77.42l7-4.6a.5.5 0 0 0 0-.84l-7-4.6a.5.5 0 0 0-.77.42Z" />
    </svg>
  );
}
