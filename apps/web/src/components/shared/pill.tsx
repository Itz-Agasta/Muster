import { cn } from "@Muster/ui/lib/utils";

export type Tone = "good" | "warn" | "bad" | "quiet";

const TONES: Record<Tone, string> = {
  good: "text-primary border-primary-outline bg-accent",
  warn: "text-warning border-warning bg-warning-container",
  bad: "text-destructive border-danger-outline bg-danger-container",
  quiet: "text-muted-foreground border-border bg-transparent",
};

/** Status pill. The only place a 999px radius is allowed. */
export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex-none rounded-full border px-2 py-1 text-[9.5px] font-semibold whitespace-nowrap",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Mount-time width animation, used by every bar on the static screens. */
export function Bar({
  value,
  tone = "good",
  delay = 0,
}: {
  value: number;
  tone?: Tone;
  delay?: number;
}) {
  return (
    <div className="bg-secondary h-[3px] overflow-hidden rounded-full">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "bad" ? "bg-destructive" : tone === "warn" ? "bg-warning" : "bg-primary/70",
        )}
        style={{
          width: `${Math.min(value, 100)}%`,
          animation: `mst-in .5s ease-out ${delay}s both`,
        }}
      />
    </div>
  );
}
