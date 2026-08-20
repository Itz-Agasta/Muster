"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

function LiveDot({ live }: { live: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 flex-none rounded-full",
        live ? "bg-primary animate-[mst-live_1.8s_ease-in-out_infinite]" : "bg-ink-faint",
      )}
    />
  );
}

const TONE_DOT: Record<string, string> = {
  primary: "bg-primary",
  bad: "bg-destructive",
  muted: "bg-ink-faint",
};

export function ActivityRail({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const alerts = useSim((s) => s.alerts);
  const phase = useSim((s) => s.phase);
  const unread = alerts.filter((a) => a.id.startsWith("live-")).length;
  // A blinking green dot has to mean something. It means an aircraft is over
  // the mob right now; the rest of the time the feed is just a log.
  const live = phase === "flying";

  if (!open) {
    return (
      <aside className="bg-surface-muted border-border flex flex-col items-center gap-3 border-l pt-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand activity feed"
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground grid size-6 place-items-center rounded-md border transition-colors"
        >
          <PanelRightOpen className="size-3" />
        </button>
        <LiveDot live={live} />
        {unread > 0 && (
          <span
            className={cn(
              "font-mono text-[9.5px] tabular",
              live ? "text-primary" : "text-ink-faint",
            )}
          >
            {unread}
          </span>
        )}
        <span className="field-label [writing-mode:vertical-rl] tracking-[0.12em]">
          {live ? "Live" : "Activity"}
        </span>
      </aside>
    );
  }

  return (
    <aside className="bg-surface-muted border-border flex min-h-0 flex-col border-l">
      <div className="border-border flex flex-none items-center justify-between gap-2 border-b px-4 py-3.5">
        <span className="flex items-center gap-2">
          <LiveDot live={live} />
          <span className="field-label">{live ? "Activity · live" : "Activity"}</span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse activity feed"
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground grid size-6 place-items-center rounded-md border transition-colors"
        >
          <PanelRightClose className="size-3" />
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {alerts.map((a, i) => (
          <li
            key={a.id}
            className="border-outline-soft hover:bg-accent/60 flex flex-col gap-1.5 border-b px-4 py-3 transition-colors"
            style={{
              animation: `mst-in .32s ease-out ${Math.min(i, 8) * 0.05}s both`,
            }}
          >
            <span className="flex items-center gap-2">
              <span className={cn("size-1.5 flex-none rounded-full", TONE_DOT[a.tone])} />
              <span className="text-muted-foreground text-[10.5px] font-semibold">{a.kind}</span>
              <span className="text-ink-faint ml-auto font-mono text-[9.5px] tabular">
                {a.time}
              </span>
            </span>
            <p className="text-foreground text-[11.5px] leading-[1.5]">{a.text}</p>
            <span className="meta-mono">{a.meta}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
