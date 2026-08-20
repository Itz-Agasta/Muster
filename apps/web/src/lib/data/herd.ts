import { RANCH } from "./ranch";

/**
 * The herd is generated from a fixed seed rather than hand-listed, because the
 * point of the health screen is that every one of 2,270 head is accounted for.
 * Weights are Kankrej and Banni crossbred steers and heifers in kilograms.
 */

export type HealthStatus = "healthy" | "monitoring" | "flagged";

export type Animal = {
  tag: string;
  weight: number;
  /** Weight for age, in standard deviations from the mob mean. */
  z: number;
  /** Kilograms gained or lost over the trailing 30 days. */
  drift: number;
  status: HealthStatus;
  paddockId: string;
  ageMonths: number;
  sex: "Steer" | "Heifer";
  breed: "Kankrej" | "Banni cross";
  minutesSinceSeen: number;
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller, so the mob has a real distribution instead of uniform noise. */
function gaussian(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const MEAN_KG = 436;
const SD_KG = 38;

const GRAZING = ["hodka-flat", "dhordo-north", "bhirandiyara", "ludiya-ridge"];

/** The three animals the model has flagged. These are the story on this screen. */
export const FLAGGED_TAGS = ["KJ-4471", "KJ-1176", "KJ-4093"] as const;
const NAMED = new Set<string>(FLAGGED_TAGS);

const FLAGGED_OVERRIDES: Record<
  string,
  { weight: number; drift: number; status: HealthStatus; paddockId: string; note: string }
> = {
  "KJ-4471": {
    weight: 401,
    drift: -17,
    status: "flagged",
    paddockId: "hodka-flat",
    note: "Weight loss with gait asymmetry. Lameness score 2, vet review requested 14:09.",
  },
  "KJ-1176": {
    weight: 409,
    drift: -8,
    status: "flagged",
    paddockId: "hodka-flat",
    note: "Losing condition for eleven days against a rising mob average. Drafted for weighing.",
  },
  "KJ-4093": {
    weight: 389,
    drift: -11,
    status: "flagged",
    paddockId: "chhari-dhand",
    note: "Grazing apart from the mob on three of the last four flights. Thermal signature runs warm.",
  },
};

/** Mob average gain, kilograms over the trailing thirty days. */
const MEAN_DRIFT = 25.8;

function buildHerd(): Animal[] {
  const rnd = mulberry32(20260820);
  const herd: Animal[] = [];
  // Reserve the named tags up front, or the generator can mint one of them a
  // second time and the override leaves a duplicate behind.
  const seen = new Set<string>(FLAGGED_TAGS);

  for (let i = 0; i < RANCH.headTotal; i++) {
    // Tags are unique: a duplicate would make the cards and the beeswarm disagree.
    let tag = "";
    do {
      tag = `KJ-${String(1000 + Math.floor(rnd() * 8999)).padStart(4, "0")}`;
    } while (seen.has(tag));
    seen.add(tag);

    const z = gaussian(rnd);
    // Condition drives drift: light animals are the ones that stop gaining.
    const drift = Math.round((z * 3.4 + gaussian(rnd) * 4.2 + MEAN_DRIFT) * 10) / 10;

    herd.push({
      tag,
      weight: Math.round(MEAN_KG + z * SD_KG),
      z: Math.round(z * 100) / 100,
      drift,
      status: "healthy",
      paddockId: GRAZING[Math.floor(rnd() * GRAZING.length)]!,
      ageMonths: 20 + Math.floor(rnd() * 16),
      sex: rnd() > 0.42 ? "Steer" : "Heifer",
      breed: rnd() > 0.35 ? "Kankrej" : "Banni cross",
      minutesSinceSeen: Math.round(rnd() * 26) + 1,
    });
  }

  // Pin the three named animals so the cards, the beeswarm and the threads agree.
  FLAGGED_TAGS.forEach((tag, i) => {
    const o = FLAGGED_OVERRIDES[tag]!;
    herd[i] = {
      ...herd[i]!,
      tag,
      weight: o.weight,
      z: Math.round(((o.weight - MEAN_KG) / SD_KG) * 100) / 100,
      drift: o.drift,
      paddockId: o.paddockId,
      minutesSinceSeen: i === 0 ? 2 : 8 + i * 3,
    };
  });

  // Status is a rank, not a threshold. The model flags the three worst losers
  // and watches the next twenty-six. A fixed cutoff on a normal distribution
  // would flag a couple of hundred head and say nothing useful.
  const byDrift = [...herd].sort((a, b) => a.drift - b.drift);
  byDrift.slice(0, 3).forEach((a) => (a.status = "flagged"));
  byDrift.slice(3, 29).forEach((a) => (a.status = "monitoring"));

  // The three named animals are the three flagged ones by construction: their
  // drift is set well below anything the generator produces.
  const flaggedTags = byDrift.slice(0, 3).map((a) => a.tag);
  if (FLAGGED_TAGS.some((t) => !flaggedTags.includes(t))) {
    throw new Error(`Named animals are not the flagged three: ${flaggedTags.join(", ")}`);
  }

  return herd;
}

export const HERD = buildHerd();

export function faultNote(tag: string): string | undefined {
  return FLAGGED_OVERRIDES[tag]?.note;
}

export const HERD_STATS = (() => {
  const flagged = HERD.filter((a) => a.status === "flagged").length;
  const monitoring = HERD.filter((a) => a.status === "monitoring").length;
  const avgWeight = HERD.reduce((s, a) => s + a.weight, 0) / HERD.length;
  const avgGain = HERD.reduce((s, a) => s + a.drift, 0) / HERD.length / 30;
  return {
    total: HERD.length,
    healthy: HERD.length - flagged - monitoring,
    monitoring,
    flagged,
    avgWeight,
    avgGainPerDay: avgGain,
  };
})();

/**
 * Thirty day weight trajectory, plotted as change from each animal's own
 * starting weight rather than absolute kilograms.
 *
 * This matters. On an absolute axis the mob's p10 to p90 band spans the natural
 * spread of a 2,270 head mob, about a hundred kilograms, and a light animal
 * losing condition still plots inside it. Normalising to each animal's own
 * baseline collapses the band to the range of *gain*, so an animal going
 * backwards leaves it immediately, which is the thing this screen exists to show.
 */
export type TrajectoryPoint = {
  day: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
};

const DAYS = 30;

/** Gain is not linear: animals put weight on faster on fresh feed early in the rotation. */
const curve = (t: number) => Math.sin(t * Math.PI * 0.5) * 0.35 + t * 0.65;

/** Kilograms gained or lost since day zero, for this animal. */
function trajectory(animal: Animal, day: number, jitter: () => number): number {
  return animal.drift * curve(day / DAYS) + jitter() * 1.2;
}

export function buildTrajectories(): {
  band: TrajectoryPoint[];
  threads: { tag: string; status: HealthStatus; points: { day: number; weight: number }[] }[];
} {
  const rnd = mulberry32(77);
  const sample = HERD.filter((a) => !NAMED.has(a.tag)).filter((_, i) => i % 4 === 0);

  const band: TrajectoryPoint[] = [];
  for (let day = 0; day <= DAYS; day++) {
    const values = sample
      .map((a) => trajectory(a, day, () => gaussian(rnd) * 0.4))
      .sort((x, y) => x - y);
    const at = (q: number) => values[Math.floor(q * (values.length - 1))]!;
    band.push({
      day,
      p10: at(0.1),
      p25: at(0.25),
      median: at(0.5),
      p75: at(0.75),
      p90: at(0.9),
    });
  }

  const threads = FLAGGED_TAGS.map((tag) => {
    const animal = HERD.find((a) => a.tag === tag)!;
    const jr = mulberry32(tag.charCodeAt(3) * 31);
    return {
      tag,
      status: animal.status,
      points: Array.from({ length: DAYS + 1 }, (_, day) => ({
        day,
        weight: trajectory(animal, day, () => gaussian(jr) * 0.3),
      })),
    };
  });

  return { band, threads };
}

/** Seven point weight history for a card sparkline. */
export function sparkSeries(animal: Animal): number[] {
  const start = animal.weight - animal.drift;
  return Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    return Math.round(start + animal.drift * curve(t));
  });
}

/** The cards shown on Herd Health: every fault first, then a healthy sample. */
export const CARD_ANIMALS: Animal[] = [
  ...HERD.filter((a) => a.status === "flagged").slice(0, 4),
  ...HERD.filter((a) => a.status === "monitoring").slice(0, 4),
  ...HERD.filter((a) => a.status === "healthy").slice(0, 8),
];
