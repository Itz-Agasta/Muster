import { Bar, Pill, type Tone } from "@/components/shared/pill";
import { PADDOCKS, type Paddock } from "@/lib/data/ranch";
import { ha, num } from "@/lib/format";

const TONE: Record<Paddock["status"], { label: string; tone: Tone }> = {
  grazing: { label: "Grazing", tone: "good" },
  resting: { label: "Resting", tone: "quiet" },
  survey: { label: "Survey", tone: "quiet" },
  queued: { label: "Queued", tone: "good" },
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-5">
      <div className="grid flex-none gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(268px,1fr))]">
        {PADDOCKS.map((p, i) => {
          const status = p.status === "grazing" && p.water < 25 ? "warn" : TONE[p.status].tone;
          return (
            <article
              key={p.id}
              className="bg-card border-border hover:border-ink-faint flex flex-col gap-3 rounded-md border p-3.5 transition-colors"
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-foreground truncate text-[0.78rem] font-semibold tracking-[-0.01em]">
                    {p.name}
                  </h2>
                  <p className="meta-mono truncate">
                    {ha(p.areaHa)} · {p.detail}
                  </p>
                </div>
                <Pill tone={status}>{TONE[p.status].label}</Pill>
              </header>

              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="field-label">Head</dt>
                  <dd className="text-foreground font-mono text-[15px] tabular">{num(p.head)}</dd>
                </div>
                <div>
                  <dt className="field-label">Dry matter</dt>
                  <dd className="text-foreground font-mono text-[15px] tabular">{p.dryMatter} t</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2">
                <Metric label="Pasture cover" value={p.cover} delay={i * 0.05} />
                <Metric
                  label="Water"
                  value={p.water}
                  tone={p.water < 25 ? "bad" : p.water < 40 ? "warn" : "good"}
                  delay={i * 0.05 + 0.05}
                />
              </div>

              <footer className="border-outline-soft flex items-center justify-between gap-2 border-t pt-2.5">
                <span className="text-muted-foreground truncate text-[10.5px]">
                  Last mustered {p.lastMustered}
                </span>
                <span className="meta-mono flex-none">{p.restNote}</span>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "good",
  delay,
}: {
  label: string;
  value: number;
  tone?: Tone;
  delay: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="field-label">{label}</span>
        <span
          className={`font-mono text-[10px] tabular ${tone === "bad" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {value}%
        </span>
      </div>
      <Bar value={value} tone={tone} delay={delay} />
    </div>
  );
}
