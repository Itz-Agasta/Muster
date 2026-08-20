import { LngLatBounds, type Map as MapLibreMap } from "maplibre-gl";

import { ACTIVE_MOB, paddock, RANCH } from "@/lib/data/ranch";
import { buildRoute } from "@/lib/sim/route";

/** The command panel floats over the right of the map, so the camera keeps clear of it. */
const RIGHT_GUTTER = 348;

const GUTTER = { top: 64, bottom: 110, left: 64, right: RIGHT_GUTTER };

/**
 * The map is the one thing allowed a long ease. Everything else in the console
 * settles inside 320ms; a camera move that fast is unreadable.
 */
const FLY_MS = 1700;

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const flyDuration = () => (reduceMotion() ? 0 : FLY_MS);

function boundsOf(points: [number, number][]): LngLatBounds {
  const bounds = new LngLatBounds(points[0], points[0]);
  for (const p of points) bounds.extend(p);
  return bounds;
}

/**
 * Note what is *not* passed here. `fitBounds` resets bearing to 0 when it is not
 * given one, so the map lands north up and a reset always comes back square. The
 * constructor's `bearing: -12` governs the pre-load frame only and never
 * survives this call. Passing `bearing: -12` through does render the ranch on
 * the angle, but a rotated fit needs more room and it costs about 0.3 of zoom.
 */
export function fitToRanch(map: MapLibreMap, duration = flyDuration()) {
  map.fitBounds(RANCH.bounds, { padding: GUTTER, duration, pitch: 34 });
}

/**
 * Frame the whole run on commit: the source paddock, the destination paddock and
 * the route between them. This is the moment the mob starts walking, so the
 * ground it has to cross is what the operator needs on screen.
 */
export function frameRoute(map: MapLibreMap, destinationId: string) {
  const route = buildRoute(ACTIVE_MOB.sourceId, destinationId);
  const points = [
    ...route.coordinates,
    ...paddock(ACTIVE_MOB.sourceId).ring,
    ...paddock(destinationId).ring,
  ];
  map.fitBounds(boundsOf(points), {
    padding: GUTTER,
    duration: flyDuration(),
    pitch: 46,
    maxZoom: 13.4,
  });
}

/** On arrival, settle onto the destination so the mob is read against its new feed. */
export function framePaddock(map: MapLibreMap, id: string) {
  map.fitBounds(boundsOf([...paddock(id).ring]), {
    padding: GUTTER,
    duration: flyDuration(),
    pitch: 40,
    maxZoom: 14,
  });
}

/**
 * Follow mode keeps the tracked aircraft off-centre by half the command panel,
 * so the subject sits in the middle of the ground the operator can actually see.
 */
const FOLLOW_OFFSET: [number, number] = [-RIGHT_GUTTER / 2, 0];

/**
 * Dropping onto the aircraft is a move; from there the camera only slides.
 * Returns the duration so the caller knows when the slide may start.
 */
export function engageFollow(map: MapLibreMap, target: [number, number]): number {
  const duration = flyDuration();
  map.easeTo({ center: target, zoom: 14.2, pitch: 50, offset: FOLLOW_OFFSET, duration });
  return duration;
}

/**
 * How often the camera is re-aimed while following. The mob moves at a walk, so
 * re-aiming every frame buys nothing and fights the user's own gestures; a slide
 * slightly longer than the interval keeps it continuous rather than stepped.
 */
export const FOLLOW_INTERVAL_MS = 600;

export function holdFollow(map: MapLibreMap, target: [number, number]) {
  map.easeTo({
    center: target,
    offset: FOLLOW_OFFSET,
    duration: reduceMotion() ? 0 : 700,
    easing: (t) => t,
  });
}
