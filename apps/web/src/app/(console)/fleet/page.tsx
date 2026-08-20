import { Bar, Pill, type Tone } from "@/components/shared/pill";
import { AIRCRAFT, MAINTENANCE, PARTS } from "@/lib/data/fleet";
import { cn } from "@Muster/ui/lib/utils";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <section className="grid flex-none gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(268px,1fr))]">
        {AIRCRAFT.map((a, i) => (
          <article
            key={a.id}
            className={cn(
              "bg-card flex flex-col gap-3 rounded-md border p-3.5 transition-colors",
              a.airborne
                ? "border-border hover:border-ink-faint"
                : "border-danger-outline hover:border-destructive",
            )}
          >
            <header className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-foreground flex items-center gap-2 font-mono text-[13px]">
                  <span
                    className={cn(
                      "size-2 flex-none rounded-full",
                      a.airborne ? "bg-primary" : "bg-destructive",
                    )}
                  />
                  {a.id}
                  <span className="text-muted-foreground font-sans text-[11.5px]">
                    {a.callsign}
                  </span>
                </p>
                <p className="meta-mono truncate">
                  {a.airframe} · {a.serial}
                </p>
              </div>
              <Pill tone={a.airborne ? "good" : "bad"}>{a.status}</Pill>
            </header>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Cell k="Flight hrs" v={a.flightHours.toFixed(1)} />
              <Cell k="Battery" v={`${a.battery}%`} bad={a.battery < 25} />
              <Cell k="Cycles" v={String(a.cycles)} />
              <Cell k="Next service" v={a.nextService} bad={a.wear > 100} />
            </dl>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="field-label">Service interval</span>
                <span
                  className={cn(
                    "font-mono text-[10px] tabular",
                    a.wear > 100 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {a.wear > 100 ? `${a.wear}% overdue` : `${a.wear}% of 250 h`}
                </span>
              </div>
              <Bar
                value={a.wear}
                tone={a.wear > 100 ? "bad" : a.wear > 70 ? "warn" : "good"}
                delay={i * 0.05}
              />
            </div>

            <footer className="border-outline-soft border-t pt-2.5">
              <span className="text-muted-foreground truncate text-[10.5px]">{a.task}</span>
            </footer>
          </article>
        ))}
      </section>

      <div className="grid flex-none gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="bg-card border-border rounded-md border">
          <header className="border-border border-b px-3.5 py-2.5">
            <span className="field-label">Work orders</span>
          </header>
          {MAINTENANCE.map((w) => (
            <div
              key={w.title}
              className="border-outline-soft hover:bg-accent/60 flex flex-col gap-1.5 border-b px-3.5 py-3 transition-colors last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground text-[11.5px] font-medium">{w.title}</p>
                <Pill tone={w.tone as Tone}>{w.status}</Pill>
              </div>
              <p className="text-muted-foreground text-[11px] leading-[1.5]">{w.note}</p>
              <span className="meta-mono">{w.meta}</span>
            </div>
          ))}
        </section>

        <section className="bg-card border-border rounded-md border">
          <header className="border-border border-b px-3.5 py-2.5">
            <span className="field-label">Spares on hand</span>
          </header>
          <ul>
            {PARTS.map((p) => (
              <li
                key={p.name}
                className="border-outline-soft flex items-center justify-between gap-3 border-b px-3.5 py-3 last:border-b-0"
              >
                <span className="text-muted-foreground truncate text-[11.5px]">{p.name}</span>
                <span
                  className={cn(
                    "flex-none font-mono text-[11px] tabular",
                    p.low ? "text-destructive" : "text-foreground",
                  )}
                >
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Cell({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="field-label">{k}</dt>
      <dd
        className={cn(
          "font-mono text-[12px] tabular",
          bad ? "text-destructive" : "text-foreground",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
