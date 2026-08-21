import { CommandPanel } from "@/components/map/command-panel";
import { LayerBar } from "@/components/map/layer-bar";
import { MapCanvas } from "@/components/map/map-canvas";
import { PastureReadout } from "@/components/map/pasture-readout";
import { PovPanel } from "@/components/map/pov-panel";
import { TelemetryBar } from "@/components/map/telemetry-bar";

export default function Page() {
  return (
    <section className="bg-map-base relative min-h-[420px] flex-1 overflow-hidden">
      <MapCanvas />
      {/* Layer switch and its readout share one left column so neither carries a
          magic offset for the other's height. */}
      <div className="absolute top-4 left-4 z-10 flex w-[236px] flex-col gap-2.5">
        <LayerBar />
        <PastureReadout />
      </div>
      <CommandPanel />
      <PovPanel />
      <TelemetryBar />
    </section>
  );
}
