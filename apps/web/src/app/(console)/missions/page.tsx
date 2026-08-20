import { Pill } from "@/components/shared/pill";
import { MISSION_STATS, MISSIONS } from "@/lib/data/operations";
import { cn } from "@Muster/ui/lib/utils";

/** Flexible grid tracks, never fixed px: fixed columns overflow and the status
 *  column is the first thing an `overflow:hidden` would eat. */
const COLUMNS =
  "minmax(88px,0.7fr) minmax(76px,0.6fr) minmax(160px,1.5fr) minmax(120px,1fr) minmax(96px,0.8fr) minmax(72px,0.6fr) minmax(160px,1.4fr) minmax(84px,0.7fr)";

const HEADS = ["Mission", "Type", "Route", "Aircraft", "Start", "Duration", "Outcome", "Status"];

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <section className="grid flex-none grid-cols-2 gap-2.5 lg:grid-cols-4">
        {MISSION_STATS.map((s) => (
          <div
            key={s.label}
            className="bg-card border-border flex flex-col gap-1 rounded-md border p-3"
          >
            <span className="field-label">{s.label}</span>
            <span
              className={cn(
                "font-mono text-[19px] leading-none font-medium tabular",
                s.tone === "bad" ? "text-destructive" : "text-foreground",
              )}
            >
              {s.value}
            </span>
          </div>
        ))}
      </section>

      <section className="bg-card border-border flex-none rounded-md border">
        <div
          className="bg-secondary border-border grid items-center gap-3 border-b px-3.5 py-2.5"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          {HEADS.map((h) => (
            <span key={h} className="field-label">
              {h}
            </span>
          ))}
        </div>
        {MISSIONS.map((m) => (
          <div
            key={m.id}
            className="border-outline-soft hover:bg-accent/60 grid items-center gap-3 border-b px-3.5 py-3 transition-colors last:border-b-0"
            style={{ gridTemplateColumns: COLUMNS }}
          >
            <span className="text-foreground font-mono text-[11px]">{m.id}</span>
            <span className="text-muted-foreground text-[11.5px]">{m.type}</span>
            <span className="text-foreground truncate text-[11.5px]">{m.route}</span>
            <span className="text-muted-foreground truncate font-mono text-[10.5px]">
              {m.aircraft}
            </span>
            <span className="text-muted-foreground font-mono text-[10.5px] tabular">{m.start}</span>
            <span className="text-muted-foreground font-mono text-[10.5px] tabular">
              {m.duration}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">{m.outcome}</span>
            <Pill tone={m.tone}>{m.status}</Pill>
          </div>
        ))}
      </section>
    </div>
  );
}
