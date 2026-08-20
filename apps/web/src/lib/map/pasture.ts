import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import { pastureCells } from "@/lib/data/pasture-cells";

import { PASTURE_DIM, PASTURE_RAMP, PASTURE_STOPS } from "./style";

export type LayerMode = "satellite" | "pasture";

export const PASTURE_CELLS_LAYER = "pasture-cells";

/**
 * Cells are added once, hidden, and stay in the style. The data only loads the
 * first time the operator switches to PastureView, so /ops first paint is
 * unchanged. `fill-antialias` is off deliberately: with it on, every cell draws
 * its own edge and the grid reads as a mesh instead of a measured surface.
 */
export function addPastureLayer(map: MapLibreMap, theme: "light" | "dark", beforeId: string) {
  map.addSource("pasture", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer(
    {
      id: PASTURE_CELLS_LAYER,
      type: "fill",
      source: "pasture",
      layout: { visibility: "none" },
      paint: {
        "fill-color": rampExpression(theme),
        "fill-opacity": opacityExpression(null),
        "fill-antialias": false,
      },
    },
    beforeId,
  );
}

function rampExpression(theme: "light" | "dark"): ExpressionSpecification {
  const colors = PASTURE_RAMP[theme];
  return [
    "interpolate",
    ["linear"],
    ["get", "dm"],
    ...PASTURE_STOPS.flatMap((stop, i) => [stop, colors[i]!]),
  ] as ExpressionSpecification;
}

/**
 * Inspecting a paddock holds it at full strength and drops the rest back. An
 * outline would compete with the destination marker, which already owns that
 * gesture on this map.
 */
function opacityExpression(inspectedId: string | null): number | ExpressionSpecification {
  if (!inspectedId) return 0.78;
  return ["case", ["==", ["get", "paddockId"], inspectedId], 0.84, 0.24];
}

/** Paddock labels carry the number under the name while the pasture layer is up. */
const PASTURE_LABEL: ExpressionSpecification = [
  "concat",
  ["get", "label"],
  "\n",
  ["number-format", ["get", "dryMatter"], { "min-fraction-digits": 1, "max-fraction-digits": 1 }],
  " t DM/ha",
];

export function applyLayerMode(map: MapLibreMap, mode: LayerMode) {
  const on = mode === "pasture";

  if (on && !loaded.has(map)) {
    loaded.add(map);
    (map.getSource("pasture") as GeoJSONSource).setData(pastureCells());
  }

  map.setLayoutProperty(PASTURE_CELLS_LAYER, "visibility", on ? "visible" : "none");
  // The status shading and the dry matter surface are two answers to the same
  // question, so only one of them is ever on the map.
  map.setLayoutProperty("paddock-fill", "visibility", on ? "none" : "visible");
  map.setPaintProperty("satellite", "raster-opacity", on ? PASTURE_DIM : 1);
  map.setLayoutProperty("paddock-label", "text-field", on ? PASTURE_LABEL : ["get", "label"]);
  map.setLayoutProperty("paddock-label", "text-line-height", on ? 1.35 : 1.2);
}

const loaded = new WeakSet<MapLibreMap>();

export function setInspected(map: MapLibreMap, inspectedId: string | null) {
  map.setPaintProperty(PASTURE_CELLS_LAYER, "fill-opacity", opacityExpression(inspectedId));
}

export function updatePastureTheme(map: MapLibreMap, theme: "light" | "dark") {
  map.setPaintProperty(PASTURE_CELLS_LAYER, "fill-color", rampExpression(theme));
}
