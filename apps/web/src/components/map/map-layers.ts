import type { Map as MapLibreMap } from "maplibre-gl";

import { PADDOCK_FEATURES, PADDOCK_POINTS } from "@/lib/data/ranch";
import { arrowIcon, droneIcon, padIcon, type MapPalette } from "@/lib/map/style";

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Everything above the satellite raster, bottom to top. Paddock labels are a
 * symbol layer rather than HTML overlays so MapLibre's halo and collision
 * detection do the work the design calls for.
 */
export function addOverlayLayers(map: MapLibreMap, p: MapPalette) {
  addMapImages(map, p);

  map.addSource("paddocks", { type: "geojson", data: PADDOCK_FEATURES });
  map.addSource("paddock-points", { type: "geojson", data: PADDOCK_POINTS });
  map.addSource("route", { type: "geojson", data: EMPTY });
  map.addSource("mob", { type: "geojson", data: EMPTY });
  map.addSource("drones", { type: "geojson", data: EMPTY });

  map.addLayer({
    id: "paddock-fill",
    type: "fill",
    source: "paddocks",
    paint: {
      "fill-color": p.fill,
      // Grazing ground reads heavier than rested ground.
      "fill-opacity": ["match", ["get", "status"], "grazing", 1, "queued", 0.7, 0.35],
    },
  });

  // The destination of the pending muster, tinted. The panel names it in text;
  // without this the map gives no answer to "which one is Sarada Bet".
  map.addLayer({
    id: "paddock-selected-fill",
    type: "fill",
    source: "paddocks",
    filter: ["==", ["get", "id"], ""],
    paint: { "fill-color": p.selectedFill },
  });

  map.addLayer({
    id: "paddock-line",
    type: "line",
    source: "paddocks",
    paint: { "line-color": p.line, "line-width": 1.4 },
  });

  map.addLayer({
    id: "paddock-selected",
    type: "line",
    source: "paddocks",
    filter: ["==", ["get", "id"], ""],
    paint: { "line-color": p.selected, "line-width": 2.4 },
  });

  map.addLayer({
    id: "route-halo",
    type: "line",
    source: "route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": p.routeHalo, "line-width": 7, "line-opacity": 0.7 },
  });

  map.addLayer({
    id: "route-dash",
    type: "line",
    source: "route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": p.route,
      "line-width": 2,
      "line-dasharray": [2, 2],
      "line-opacity": ["case", ["to-boolean", ["get", "committed"]], 1, 0.5],
    },
  });

  // Direction of travel, and only once the muster is committed. Filtering rather
  // than fading it: an idle console should be calm, and the chevrons marching
  // along a route nobody has agreed to yet read as something already happening.
  // Pitch alignment stays on the viewport so the chevron reads face-on rather
  // than lying foreshortened on a 34 degree ground plane.
  map.addLayer({
    id: "route-arrow",
    type: "symbol",
    source: "route",
    filter: ["to-boolean", ["get", "committed"]],
    layout: {
      "symbol-placement": "line",
      "symbol-spacing": 92,
      "icon-image": "route-arrow",
      "icon-size": 1,
      "icon-pitch-alignment": "viewport",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  map.addLayer({
    id: "mob-pulse",
    type: "circle",
    source: "mob",
    paint: {
      "circle-color": p.mob,
      "circle-radius": 26,
      "circle-opacity": 0.35,
      "circle-stroke-width": 0,
    },
  });

  map.addLayer({
    id: "mob-cluster",
    type: "circle",
    source: "mob",
    paint: {
      "circle-color": p.mob,
      "circle-radius": 13,
      "circle-stroke-color": p.mobRing,
      "circle-stroke-width": 1.5,
    },
  });

  map.addLayer({
    id: "mob-count",
    type: "symbol",
    source: "mob",
    layout: {
      "text-field": ["to-string", ["get", "head"]],
      "text-font": ["Noto Sans Regular"],
      "text-size": 10,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": p.ink,
      "text-halo-color": p.halo,
      "text-halo-width": 1.2,
    },
  });

  map.addLayer({
    id: "paddock-label",
    type: "symbol",
    source: "paddock-points",
    layout: {
      "text-field": ["get", "label"],
      "text-font": ["Open Sans Semibold"],
      "text-size": 11,
      // Lifted off the centroid: the mob cluster parks there and carries
      // `text-allow-overlap`, so a centred label loses to it and the source
      // paddock of the pending muster ends up the one thing with no name.
      "text-anchor": "bottom",
      "text-offset": [0, -1.1],
    },
    paint: {
      "text-color": p.ink,
      "text-halo-color": p.halo,
      "text-halo-width": 1.4,
    },
  });

  // Under the aircraft, so a selected one wears its ring rather than sits on it.
  map.addLayer({
    id: "drone-selected",
    type: "circle",
    source: "drones",
    filter: ["==", ["get", "id"], ""],
    paint: {
      "circle-radius": 13,
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-color": p.selected,
      "circle-stroke-width": 1.5,
    },
  });

  map.addLayer({
    id: "drone",
    type: "symbol",
    source: "drones",
    layout: {
      "icon-image": ["case", ["get", "airborne"], "drone-live", "drone-idle"],
      "icon-size": 0.5,
      // A docked aircraft has no track, so it is not pointed anywhere.
      "icon-rotate": ["case", ["get", "airborne"], ["get", "heading"], 0],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "text-field": ["get", "id"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 9,
      "text-offset": [0, 1.4],
      "text-anchor": "top",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": p.ink,
      "text-halo-color": p.halo,
      "text-halo-width": 1.2,
      "text-opacity": ["case", ["get", "airborne"], 1, 0.7],
    },
  });

  animateDash(map);
  animatePulse(map);
}

function addMapImages(map: MapLibreMap, p: MapPalette) {
  map.addImage("drone-live", droneIcon(p.drone), { pixelRatio: 2 });
  // A hollow ring needs more room than a solid triangle to read at the same
  // distance, so the pad is drawn on a larger canvas rather than scaled up by
  // the layer: a data-driven icon-size stalls the first paint entirely.
  map.addImage("drone-idle", padIcon(p.droneIdle, 54), { pixelRatio: 2 });
  map.addImage("route-arrow", arrowIcon(p.selected, 32), { pixelRatio: 2 });
}

export function updatePalette(map: MapLibreMap, p: MapPalette) {
  for (const id of ["drone-live", "drone-idle", "route-arrow"]) {
    if (map.hasImage(id)) map.removeImage(id);
  }
  addMapImages(map, p);

  map.setPaintProperty("paddock-fill", "fill-color", p.fill);
  map.setPaintProperty("paddock-line", "line-color", p.line);
  map.setPaintProperty("paddock-selected", "line-color", p.selected);
  map.setPaintProperty("paddock-selected-fill", "fill-color", p.selectedFill);
  map.setPaintProperty("route-halo", "line-color", p.routeHalo);
  map.setPaintProperty("route-dash", "line-color", p.route);
  map.setPaintProperty("mob-pulse", "circle-color", p.mob);
  map.setPaintProperty("mob-cluster", "circle-color", p.mob);
  map.setPaintProperty("mob-cluster", "circle-stroke-color", p.mobRing);
  map.setPaintProperty("drone-selected", "circle-stroke-color", p.selected);

  for (const id of ["mob-count", "drone", "paddock-label"]) {
    map.setPaintProperty(id, "text-color", p.ink);
    map.setPaintProperty(id, "text-halo-color", p.halo);
  }
}

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The dash marches toward the destination. Reduced motion leaves it static. */
function animateDash(map: MapLibreMap) {
  if (reduceMotion()) return;
  const steps: [number, number][] = [
    [2, 2],
    [1.6, 2.4],
    [1.2, 2.8],
    [0.8, 3.2],
    [0.4, 3.6],
    [0, 4],
  ];
  let i = 0;
  const id = window.setInterval(() => {
    if (!map.getLayer("route-dash")) return;
    i = (i + 1) % steps.length;
    map.setPaintProperty("route-dash", "line-dasharray", steps[i]!);
  }, 160);
  map.once("remove", () => window.clearInterval(id));
}

/** Mob cluster carries a slow pulsing ring so it reads as live, not plotted. */
function animatePulse(map: MapLibreMap) {
  if (reduceMotion()) return;
  const start = performance.now();
  let frame = 0;
  const step = () => {
    if (map.getLayer("mob-pulse")) {
      const t = ((performance.now() - start) % 3400) / 3400;
      map.setPaintProperty("mob-pulse", "circle-radius", 14 + t * 26);
      map.setPaintProperty("mob-pulse", "circle-opacity", 0.4 * (1 - t));
    }
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  map.once("remove", () => cancelAnimationFrame(frame));
}
