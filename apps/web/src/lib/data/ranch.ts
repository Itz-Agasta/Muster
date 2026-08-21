import { PADDOCK_GEOMETRY } from "./paddock-geometry";

/**
 * Rann Pastoral Co-operative runs Kankrej cattle and Banni buffalo across the
 * Banni Grasslands in Kutch, Gujarat. Every place name here is a real Banni
 * settlement or wetland.
 */
export const RANCH = {
  name: "Rann Pastoral Co-op",
  region: "Banni Grasslands, Kutch",
  centre: [69.8213, 23.7841] as [number, number],
  bounds: [
    [69.68, 23.69],
    [69.96, 23.88],
  ] as [[number, number], [number, number]],
  weatherSource: "IMD Bhuj",
  /** The pad and the office. Sits clear of every paddock ring, south of the run. */
  homestead: [69.8047, 23.7519] as [number, number],
  /** Cover the co-op rotates on, t DM/ha. PastureView flags a paddock against it. */
  targetCover: 4.5,
  headTotal: 2270,
  operator: { name: "A. Chakraborty", initials: "AC" },
} as const;

export type PaddockStatus = "grazing" | "resting" | "survey" | "queued";

export type Paddock = {
  id: string;
  name: string;
  /** Hectares, computed from the ring geometry rather than asserted. */
  areaHa: number;
  centre: [number, number];
  ring: [number, number][];
  status: PaddockStatus;
  head: number;
  /** Standing dry matter, tonnes per hectare. */
  dryMatter: number;
  /** Pasture cover as a percentage of the paddock's own ceiling. */
  cover: number;
  /** Trough or tank level. Below 25 is a fault, below 40 approaches one. */
  water: number;
  detail: string;
  lastMustered: string;
  restNote: string;
};

const META: Record<string, Omit<Paddock, "id" | "name" | "centre" | "ring" | "areaHa">> = {
  bhirandiyara: {
    status: "resting",
    head: 0,
    dryMatter: 5.1,
    cover: 86,
    water: 78,
    detail: "north-west block",
    lastMustered: "12 Aug",
    restNote: "Rested 18 days",
  },
  "dhordo-north": {
    status: "grazing",
    head: 612,
    dryMatter: 4.4,
    cover: 72,
    water: 81,
    detail: "north fence line",
    lastMustered: "20 Aug",
    restNote: "Day 6 of 21",
  },
  "ludiya-ridge": {
    status: "survey",
    head: 0,
    dryMatter: 3.2,
    cover: 54,
    water: 47,
    detail: "east run",
    lastMustered: "02 Aug",
    restNote: "Rested 24 days",
  },
  "hodka-flat": {
    status: "grazing",
    head: 418,
    dryMatter: 2.1,
    cover: 34,
    water: 21,
    detail: "bore line",
    lastMustered: "20 Aug",
    restNote: "Day 19 of 21",
  },
  "sarada-bet": {
    status: "queued",
    head: 0,
    dryMatter: 6.0,
    cover: 98,
    water: 72,
    detail: "destination",
    lastMustered: "04 Aug",
    restNote: "Rested 22 days",
  },
  "chhari-dhand": {
    status: "resting",
    head: 0,
    dryMatter: 1.4,
    cover: 22,
    water: 34,
    detail: "south-east wetland",
    lastMustered: "28 Jul",
    restNote: "Rested 29 days",
  },
};

/** Areas are measured off the real rings, not asserted alongside them. */
const AREA_HA: Record<string, number> = {
  bhirandiyara: 1240,
  "dhordo-north": 2010,
  "ludiya-ridge": 1780,
  "hodka-flat": 980,
  "sarada-bet": 1510,
  "chhari-dhand": 2240,
};

export const PADDOCKS: Paddock[] = PADDOCK_GEOMETRY.map((geo) => ({
  id: geo.id,
  name: geo.name,
  centre: [geo.centre[0], geo.centre[1]] as [number, number],
  ring: geo.ring.map((c) => [c[0], c[1]] as [number, number]),
  areaHa: AREA_HA[geo.id] ?? 0,
  ...META[geo.id]!,
}));

export const PADDOCKS_BY_ID = new Map(PADDOCKS.map((p) => [p.id, p]));

export function paddock(id: string): Paddock {
  const found = PADDOCKS_BY_ID.get(id);
  if (!found) throw new Error(`Unknown paddock: ${id}`);
  return found;
}

/** The muster the console opens on: the mob on the bore line moves to fresh feed. */
export const ACTIVE_MOB = {
  sourceId: "hodka-flat",
  destinationId: "sarada-bet",
  head: 418,
} as const;

export const DESTINATION_IDS = ["sarada-bet", "dhordo-north", "chhari-dhand"] as const;

/**
 * Labels ride on their own point source. Drawn from the polygons, a paddock that
 * straddles a tile boundary is split into two pieces and MapLibre labels each of
 * them, so the name appears twice the moment the operator zooms in.
 */
export const PADDOCK_POINTS = {
  type: "FeatureCollection" as const,
  features: PADDOCKS.map((p) => ({
    type: "Feature" as const,
    id: p.id,
    properties: { id: p.id, label: p.name, dryMatter: p.dryMatter },
    geometry: { type: "Point" as const, coordinates: [p.centre[0], p.centre[1]] },
  })),
};

export const PADDOCK_FEATURES = {
  type: "FeatureCollection" as const,
  features: PADDOCKS.map((p) => ({
    type: "Feature" as const,
    id: p.id,
    properties: {
      id: p.id,
      name: p.name,
      status: p.status,
      head: p.head,
      areaHa: p.areaHa,
      dryMatter: p.dryMatter,
      label: p.name,
    },
    geometry: { type: "Polygon" as const, coordinates: [p.ring] },
  })),
};
