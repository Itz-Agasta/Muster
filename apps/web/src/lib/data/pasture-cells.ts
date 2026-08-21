/**
 * PastureView: standing dry matter measured on the pass the aircraft was flying
 * anyway. A satellite feed-base product resolves one hectare and reports a
 * paddock average, which is why Brumby's argument is about coverage rather than
 * accuracy: a plate meter is right where you put it down, and the average across
 * three hundred hectares is where the error lives. So this renders sub-paddock,
 * on a 120 m grid clipped to each ring. A flat tint on six polygons would be the
 * satellite answer wearing our colours.
 *
 * The surface is deterministic, not random: the same paddock produces the same
 * map on every load, the way a repeat flight over unchanged country would.
 */

import { PADDOCKS, type Paddock } from "./ranch";

/** Metres per cell edge. Fine enough to read a bare patch, coarse enough to stay a few thousand features. */
const CELL_M = 120;

const LAT_M = 110_900;
const lonMetres = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

export type PastureCells = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  { paddockId: string; dm: number }
>;

/**
 * Three octaves of sine, seeded off the paddock. Not Perlin: at this cell count
 * the visible difference is nil and this is nine lines with no dependency.
 * Wavelengths run about 3.7 km, 1.6 km and 780 m, so a paddock carries one broad
 * gradient with real patchiness inside it rather than a single blob.
 */
function surface(x: number, y: number, seed: number): number {
  const a = Math.sin(x * 1.7 + seed * 1.3) * Math.cos(y * 1.9 - seed * 0.7);
  const b = Math.sin(x * 3.9 - seed * 2.1) * Math.cos(y * 4.3 + seed * 1.1);
  const c = Math.sin(x * 8.1 + seed * 0.5) * Math.cos(y * 7.7 - seed * 1.9);
  return (a + b * 0.5 + c * 0.25) / 1.75;
}

/** A Gaussian well. Feed thins toward a gate or a trough and recovers with distance. */
const sink = (km: number, depth: number, radius: number) =>
  1 - depth * Math.exp(-((km / radius) ** 2));

function inRing(ring: [number, number][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * The gate is the ring vertex facing the nearest neighbouring paddock, because
 * that is where stock actually walk through and where the ground gets hammered.
 */
function gateOf(p: Paddock): [number, number] {
  const near = PADDOCKS.filter((o) => o.id !== p.id).sort(
    (a, b) => hypot(a.centre, p.centre) - hypot(b.centre, p.centre),
  )[0]!;
  return [...p.ring].sort((a, b) => hypot(a, near.centre) - hypot(b, near.centre))[0]!;
}

const hypot = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.09);

function cellsFor(p: Paddock, seed: number): PastureCells["features"] {
  const mPerLon = lonMetres(p.centre[1]);
  const dLat = CELL_M / LAT_M;
  const dLon = CELL_M / mPerLon;

  const lons = p.ring.map((c) => c[0]);
  const lats = p.ring.map((c) => c[1]);
  const gate = gateOf(p);
  // Water draws stock in and they camp on it, so the trough sits off centre and
  // the ground around it is the thinnest in the paddock.
  const trough: [number, number] = [
    p.centre[0] + Math.sin(seed) * 0.012,
    p.centre[1] + Math.cos(seed * 1.7) * 0.008,
  ];
  const grazing = p.status === "grazing";
  const amplitude = p.dryMatter * 0.28 + 0.35;

  const out: PastureCells["features"] = [];
  for (let lat = Math.min(...lats); lat < Math.max(...lats); lat += dLat) {
    for (let lon = Math.min(...lons); lon < Math.max(...lons); lon += dLon) {
      const cx = lon + dLon / 2;
      const cy = lat + dLat / 2;
      if (!inRing(p.ring, cx, cy)) continue;

      const kmX = ((cx - p.centre[0]) * mPerLon) / 1000;
      const kmY = ((cy - p.centre[1]) * LAT_M) / 1000;
      const gateKm = (hypot([cx, cy], gate) * mPerLon) / 1000;
      const troughKm = (hypot([cx, cy], trough) * mPerLon) / 1000;

      const dm =
        (p.dryMatter + surface(kmX, kmY, seed) * amplitude) *
        sink(gateKm, 0.5, 0.42) *
        sink(troughKm, grazing ? 0.5 : 0.34, 0.36);

      out.push({
        type: "Feature",
        properties: { paddockId: p.id, dm: round(Math.min(Math.max(dm, 0.25), 7.4), 2) },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [round(lon, 5), round(lat, 5)],
              [round(lon + dLon, 5), round(lat, 5)],
              [round(lon + dLon, 5), round(lat + dLat, 5)],
              [round(lon, 5), round(lat + dLat, 5)],
              [round(lon, 5), round(lat, 5)],
            ],
          ],
        },
      });
    }
  }
  return out;
}

const round = (n: number, places: number) => Number(n.toFixed(places));

let cache: PastureCells | null = null;

/**
 * Built on first use rather than at import, so the /ops first paint never pays
 * for a layer the operator has not switched on yet. About seven thousand cells
 * across the six paddocks, which is a few milliseconds.
 */
export function pastureCells(): PastureCells {
  if (cache) return cache;
  cache = {
    type: "FeatureCollection",
    features: PADDOCKS.flatMap((p, i) => cellsFor(p, i * 2.7 + 1.3)),
  };
  return cache;
}
