import along from "@turf/along";
import bearing from "@turf/bearing";
import destination from "@turf/destination";
import { lineString, point } from "@turf/helpers";
import length from "@turf/length";

import { ACTIVE_MOB, paddock } from "@/lib/data/ranch";

/**
 * A muster route is not a straight line. The mob is walked around the worst of
 * the ground and brought in through the gate, so the path bows off the direct
 * line and the drones have something real to follow.
 */
export function buildRoute(sourceId: string, destinationId: string) {
  const from = paddock(sourceId).centre;
  const to = paddock(destinationId).centre;

  const direct = lineString([from, to]);
  const total = length(direct, { units: "kilometers" });
  const heading = bearing(point(from), point(to));

  // Two waypoints pushed off the direct line, the second less than the first,
  // so the mob swings wide early and straightens up on approach.
  const waypoint = (fraction: number, offsetKm: number) => {
    const on = along(direct, total * fraction, { units: "kilometers" });
    const shifted = destination(on, offsetKm, heading + 90, { units: "kilometers" });
    return shifted.geometry.coordinates as [number, number];
  };

  const coordinates: [number, number][] = [
    from as [number, number],
    waypoint(0.3, 0.85),
    waypoint(0.68, 0.42),
    to as [number, number],
  ];

  const line = lineString(coordinates);
  return {
    line,
    coordinates,
    lengthKm: length(line, { units: "kilometers" }),
    heading,
  };
}

export type Route = ReturnType<typeof buildRoute>;

/** Position of the mob at a given fraction along the route. */
export function positionAt(route: Route, progress: number): [number, number] {
  const at = along(route.line, route.lengthKm * Math.min(Math.max(progress, 0), 1), {
    units: "kilometers",
  });
  return at.geometry.coordinates as [number, number];
}

/** Bearing the mob is currently travelling, sampled just ahead of it. */
export function headingAt(route: Route, progress: number): number {
  const here = positionAt(route, progress);
  const ahead = positionAt(route, Math.min(1, progress + 0.02));
  return bearing(point(here), point(ahead));
}

export const DEFAULT_ROUTE = buildRoute(ACTIVE_MOB.sourceId, ACTIVE_MOB.destinationId);
