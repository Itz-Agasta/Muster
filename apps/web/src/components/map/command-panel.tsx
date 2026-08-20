"use client";

import { useState } from "react";

import { DESTINATION_IDS, ACTIVE_MOB, paddock } from "@/lib/data/ranch";
import { ha } from "@/lib/format";
import { buildRoute } from "@/lib/sim/route";
import { useSim } from "@/lib/sim/store";
import { cn } from "@Muster/ui/lib/utils";

const DAYS = [
  { label: "Today", full: "Thu, 20 Aug" },
  { label: "Tomorrow", full: "Fri, 21 Aug" },
  { label: "Sat", full: "Sat, 22 Aug" },
];
const HOURS = ["05", "06", "07"];
const MINUTES = ["00", "15", "30", "45"];

export function CommandPanel() {
  const [mode, setMode] = useState<"plan" | "schedule">("plan");
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState("06");
  const [minute, setMinute] = useState("30");

  const destinationId = useSim((s) => s.destinationId);
  const phase = useSim((s) => s.phase);
  const scheduledFor = useSim((s) => s.scheduledFor);
  const setDestination = useSim((s) => s.setDestination);
  const startMuster = useSim((s) => s.startMuster);
  const schedule = useSim((s) => s.schedule);

  const source = paddock(ACTIVE_MOB.sourceId);
  const target = paddock(destinationId);
  const route = buildRoute(ACTIVE_MOB.sourceId, destinationId);
  const flying = phase === "flying";
  const done = phase === "complete";

  const when = `${DAYS[day]!.full} at ${hour}:${minute}`;

  return (
    <section className="glass border-border absolute top-4 right-4 z-10 flex w-[300px] flex-col gap-3.5 rounded-lg border p-3.5 shadow-md">
      <header className="flex items-center justify-between gap-2">
        <p className="field-label">{mode === "plan" ? "Task a muster" : "Schedule a muster"}</p>
        <button
          type="button"
          onClick={() => setMode(mode === "plan" ? "schedule" : "plan")}
          className="text-muted-foreground hover:text-foreground font-mono text-[9px] tracking-[0.06em] uppercase transition-colors"
        >
          {mode === "plan" ? "Schedule" : "Plan"}
        </button>
      </header>

      <div className="text-foreground flex items-center gap-2 text-[12px]">
        <span className="truncate font-medium">{source.name}</span>
        <span className="text-ink-faint font-mono text-[10px]">to</span>
        <span className="text-primary truncate font-medium">{target.name}</span>
      </div>

      {mode === "plan" ? (
        <>
          <ul className="flex flex-col gap-1.5">
            {DESTINATION_IDS.map((id) => {
              const p = paddock(id);
              const on = id === destinationId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={flying}
                    onClick={() => setDestination(id)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                      on
                        ? "border-primary-outline bg-accent text-primary font-semibold"
                        : "border-border bg-card text-foreground hover:bg-accent",
                    )}
                  >
                    <span className="truncate">{p.name}</span>
                    <span
                      className={cn(
                        "flex-none font-mono text-[9.5px] tabular",
                        on ? "text-primary" : "text-ink-faint",
                      )}
                    >
                      {ha(p.areaHa)} · {p.dryMatter} t
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <dl className="border-outline-soft grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3">
            <Cell k="Distance" v={`${route.lengthKm.toFixed(1)} km`} />
            <Cell k="ETA" v="1h 12m" />
            <Cell k="Head" v={String(ACTIVE_MOB.head)} />
            <Cell k="Pressure" v="Low" />
          </dl>
        </>
      ) : (
        <>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <Chip key={d.label} on={day === i} onClick={() => setDay(i)}>
                {d.label}
              </Chip>
            ))}
          </div>
          <div className="flex gap-3">
            <Column values={HOURS} value={hour} onPick={setHour} label="Hour" />
            <Column values={MINUTES} value={minute} onPick={setMinute} label="Minute" />
          </div>
          <p className="text-muted-foreground border-outline-soft border-t pt-3 text-[11px]">
            {ACTIVE_MOB.head} head to {target.name}, {when}.
          </p>
        </>
      )}

      {mode === "plan" ? (
        <button
          type="button"
          onClick={startMuster}
          disabled={flying}
          className={cn(
            "rounded-md px-3 py-2.5 text-[12.5px] font-semibold transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            flying || done
              ? "bg-accent text-primary border-primary-outline border"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-px",
          )}
        >
          {flying ? "Muster in progress" : done ? "Muster complete" : "Move mob"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => schedule(when)}
          className={cn(
            "rounded-md px-3 py-2.5 text-[12.5px] font-semibold transition-colors",
            scheduledFor
              ? "bg-accent text-primary border-primary-outline border"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-px",
          )}
        >
          {scheduledFor ? `Scheduled ${scheduledFor}` : "Schedule muster"}
        </button>
      )}
    </section>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="field-label">{k}</dt>
      <dd className="text-foreground font-mono text-[12px] tabular">{v}</dd>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex-1 rounded-md border px-2 py-1.5 text-[11px] transition-colors",
        on
          ? "border-transparent bg-primary text-primary-foreground font-semibold"
          : "border-outline-soft text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Column({
  values,
  value,
  onPick,
  label,
}: {
  values: string[];
  value: string;
  onPick: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="field-label">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          aria-pressed={value === v}
          className={cn(
            "rounded-md border px-2 py-1.5 font-mono text-[13px] tabular transition-colors",
            value === v
              ? "border-transparent bg-primary text-primary-foreground font-semibold"
              : "border-outline-soft text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
