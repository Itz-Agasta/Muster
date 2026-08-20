import { BIOMASS_ROWS } from "./operations";
import { paddock, RANCH } from "./ranch";

export type PastureTrend = {
  /** Eighteen weeks of standing dry matter in t DM/ha, oldest first. */
  series: number[];
  current: number;
  /** Week on week, expressed the way a grazier says it: kg DM/ha/day. */
  growthKgPerDay: number;
  aboveTarget: boolean;
};

/**
 * The heatmap on /analytics stores these weeks normalised against the best week
 * any paddock recorded. Scaling the row so its last week lands exactly on the
 * paddock's current number keeps the trend line and the map reading the same
 * value, rather than two versions of it that nearly agree.
 */
export function pastureTrend(id: string): PastureTrend {
  const p = paddock(id);
  // Every paddock has a row, the same way every id resolves to a paddock.
  const row = BIOMASS_ROWS.find((r) => r.paddockId === id)!;

  const last = row.cells[row.cells.length - 1]!;
  const series = row.cells.map((v) => (v / last) * p.dryMatter);
  const previous = series[series.length - 2] ?? p.dryMatter;

  return {
    series,
    current: p.dryMatter,
    growthKgPerDay: ((p.dryMatter - previous) * 1000) / 7,
    aboveTarget: p.dryMatter >= RANCH.targetCover,
  };
}
