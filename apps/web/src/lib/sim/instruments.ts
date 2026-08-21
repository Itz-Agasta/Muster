/**
 * Instruments wander inside plausible bands rather than sitting frozen. The
 * telemetry bar and the POV HUD both read them off the same slow tick, so they
 * have to share the maths: two panels quoting different altitudes for the same
 * aircraft is the one thing a judge would actually catch.
 */
export function wobble(tick: number, base: number, spread: number, offset: number): number {
  return Math.round(base + Math.sin((tick + offset) * 0.7) * spread);
}

/** Cruise altitude for a working aircraft, in metres above ground level. */
export const CRUISE_AGL = 126;
