import { BiomassHeatmap } from "@/components/analytics/biomass-heatmap";
import { CostHero } from "@/components/analytics/cost-hero";
import { WaterGauges } from "@/components/analytics/water-gauges";
import { SEASON_KPIS } from "@/lib/data/operations";
import { cn } from "@Muster/ui/lib/utils";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <div className="grid flex-none gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <CostHero />
        <div className="grid grid-cols-3 gap-2.5">
          {SEASON_KPIS.map((k) => (
            <div
              key={k.label}
              className="bg-card border-border flex flex-col justify-between gap-2 rounded-md border p-3"
            >
              <span className="field-label">{k.label}</span>
              <span>
                <span className="text-foreground block font-mono text-[19px] leading-none font-medium tabular">
                  {k.value}
                </span>
                <span
                  className={cn(
                    "mt-1.5 block font-mono text-[9.5px]",
                    k.tone === "primary" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {k.note}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none">
        <BiomassHeatmap />
      </div>
      <div className="flex-none">
        <WaterGauges />
      </div>
    </div>
  );
}
