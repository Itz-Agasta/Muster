import { CommandPanel } from "@/components/map/command-panel";
import { MapCanvas } from "@/components/map/map-canvas";
import { TelemetryBar } from "@/components/map/telemetry-bar";

export default function Page() {
  return (
    <section className="bg-map-base relative min-h-[420px] flex-1 overflow-hidden">
      <MapCanvas />
      <CommandPanel />
      <TelemetryBar />
    </section>
  );
}
