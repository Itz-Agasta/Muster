import type { StyleSpecification } from "maplibre-gl";

/**
 * The basemap runs on Esri World Imagery, which needs no key, so the console
 * works the moment it is cloned. Setting NEXT_PUBLIC_MAPBOX_TOKEN swaps it for
 * Mapbox satellite tiles; nothing else in the map changes, because MapLibre and
 * Mapbox GL speak the same style spec.
 */
const ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const ESRI_ATTRIBUTION =
  'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';

const MAPBOX_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.maxar.com/">Maxar</a>';

export function satelliteStyle(token?: string): StyleSpecification {
  const useMapbox = Boolean(token);
  const tiles = useMapbox
    ? [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${token}`]
    : [ESRI];

  return {
    version: 8,
    // Symbol layers need glyphs, and a raster style ships none. MapLibre's
    // demo endpoint serves Open Sans, which is all the map labels ask for.
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster",
        tiles,
        tileSize: 256,
        maxzoom: useMapbox ? 22 : 19,
        attribution: useMapbox ? MAPBOX_ATTRIBUTION : ESRI_ATTRIBUTION,
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  };
}

/**
 * The map canvas is imagery, not chrome, so it keeps its own palette. These are
 * sRGB rather than oklch on purpose: MapLibre parses colours itself and rejects
 * oklch(), which silently drops the layer that used it. The values are the
 * converted primary and danger tokens, so the map still matches the chrome.
 *
 * Outlines
 * flip from white to charcoal and labels carry a halo in the opposite value so
 * they stay legible over any tile.
 */
export type MapPalette = {
  line: string;
  fill: string;
  selected: string;
  selectedFill: string;
  ink: string;
  halo: string;
  route: string;
  routeHalo: string;
  mob: string;
  mobRing: string;
  drone: string;
  droneIdle: string;
  fault: string;
};

export const MAP_PALETTE: Record<"light" | "dark", MapPalette> = {
  dark: {
    line: "rgba(255,255,255,0.66)",
    fill: "rgba(255,255,255,0.06)",
    selected: "#b9e3ac",
    selectedFill: "rgba(150,205,140,0.20)",
    ink: "#ffffff",
    halo: "rgba(0,0,0,0.85)",
    route: "#6e9172",
    routeHalo: "rgba(0,0,0,0.45)",
    mob: "rgba(255,255,255,0.22)",
    mobRing: "rgba(255,255,255,0.82)",
    drone: "#6e9172",
    droneIdle: "rgba(255,255,255,0.55)",
    fault: "#e5484d",
  },
  light: {
    line: "rgba(28,38,30,0.72)",
    fill: "rgba(255,255,255,0.14)",
    selected: "#274a2b",
    selectedFill: "rgba(58,92,60,0.22)",
    ink: "#12190f",
    halo: "rgba(255,255,255,0.9)",
    route: "#3d5a40",
    routeHalo: "rgba(255,255,255,0.7)",
    mob: "rgba(255,255,255,0.5)",
    mobRing: "#293729",
    drone: "#3d5a40",
    droneIdle: "rgba(30,40,32,0.6)",
    fault: "#9d392e",
  },
};

/**
 * A 17px directional triangle drawn to a canvas once and registered as a map
 * image, so the drone layer can rotate it to heading on the GPU.
 */
export function droneIcon(color: string, size = 34): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const r = size * 0.42;

  ctx.beginPath();
  ctx.moveTo(c, c - r);
  ctx.lineTo(c + r * 0.62, c + r * 0.72);
  ctx.lineTo(c, c + r * 0.34);
  ctx.lineTo(c - r * 0.62, c + r * 0.72);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = size * 0.055;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

/**
 * A docked aircraft is not flying, so it does not get a heading triangle. It
 * gets its pad: a ring with the airframe sitting in the middle of it.
 */
export function padIcon(color: string, size = 34): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // The ring carries a dark outer edge the way the triangle does, or it
  // disappears into pale ground the moment the pad sits on sand.
  ctx.beginPath();
  ctx.arc(c, c, size * 0.38, 0, Math.PI * 2);
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.stroke();
  ctx.lineWidth = size * 0.1;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(c, c, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = size * 0.05;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

/**
 * A chevron repeated along the route. With `symbol-placement: "line"` MapLibre
 * resolves `icon-rotation-alignment` to `map`, so the glyph follows the bearing
 * of the segment it lands on and the route reads as having a direction rather
 * than just two ends.
 */
export function arrowIcon(color: string, size = 28): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const r = size * 0.3;

  // Drawn pointing up: line placement rotates it onto the segment from there.
  ctx.beginPath();
  ctx.moveTo(c, c - r);
  ctx.lineTo(c + r * 0.82, c + r * 0.7);
  ctx.lineTo(c, c + r * 0.24);
  ctx.lineTo(c - r * 0.82, c + r * 0.7);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = size * 0.07;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

/**
 * The PastureView ramp. Sequential, one hue family, never categorical: this is a
 * magnitude. Stops are t DM/ha, spanning the range the ranch actually holds.
 *
 * Both ramps run dry tan to green, because that is what the country does. What
 * changes per theme is where they sit against their own ground: light runs down
 * into a deep green, which is Brumby's "dark where there's cover", and dark runs
 * up into a bright one.
 *
 * The low end of each is a solid tan rather than something near the background.
 * A bare paddock is the most urgent thing on this map, and at the first attempt
 * Chhari Dhand at 1.4 t vanished into the dark ground: the map read as though
 * nothing had been measured there, when in fact it had, and the answer was bad.
 */
export const PASTURE_STOPS = [0.5, 2, 3.5, 5, 6.5] as const;

export const PASTURE_RAMP: Record<"light" | "dark", [string, string, string, string, string]> = {
  dark: ["#8a7f5c", "#8f9160", "#7f9b5c", "#77a86a", "#8fc189"],
  light: ["#c3b789", "#a8b174", "#84a05c", "#5e8449", "#37633f"],
};

/** How far the basemap drops under the pasture layer, so the ramp carries the read. */
export const PASTURE_DIM = 0.45;
