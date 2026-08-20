"use client";

import {
  LngLatBounds,
  Map as MapLibre,
  setWorkerUrl,
  type ErrorEvent,
  type GeoJSONSource,
  type Map as MapLibreMap,
} from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { ACTIVE_MOB, paddock, RANCH } from "@/lib/data/ranch";
import { MAP_PALETTE, satelliteStyle, type MapPalette } from "@/lib/map/style";
import { buildRoute } from "@/lib/sim/route";
import { useSim } from "@/lib/sim/store";
import { env } from "@Muster/env/web";

import { addOverlayLayers, updatePalette } from "./map-layers";

import "maplibre-gl/dist/maplibre-gl.css";

/** The command panel floats over the right of the map, so the camera keeps clear of it. */
const RIGHT_GUTTER = 348;

/**
 * Turbopack resolves maplibre's module-worker URL to an empty string, so the
 * worker never starts. Raster tiles still paint, but every GeoJSON source stays
 * unloaded forever and no overlay renders, with no error raised anywhere.
 * Serving the worker from /public sidesteps bundler resolution completely.
 * `scripts/copy-maplibre-worker.mjs` keeps these files in step with the package.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/**
 * MapLibre is driven directly rather than through react-map-gl. Every layer here
 * is updated imperatively at frame rate, so the declarative wrapper would only
 * add a version to keep in step.
 */
export function LiveOpsMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const { resolvedTheme } = useTheme();
  const themeKey = resolvedTheme === "light" ? "light" : "dark";

  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new MapLibre({
      container: container.current,
      style: satelliteStyle(env.NEXT_PUBLIC_MAPBOX_TOKEN),
      center: RANCH.centre,
      zoom: 11.4,
      pitch: 34,
      bearing: -12,
      maxPitch: 62,
      attributionControl: { compact: true },
    });
    map.current = instance;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __musterMap?: MapLibreMap }).__musterMap = instance;
    }

    instance.on("error", (e: ErrorEvent) => console.error("[map]", e.error?.message ?? e));

    instance.on("load", () => {
      addOverlayLayers(instance, MAP_PALETTE[themeKey]);
      ready.current = true;
      fitToRanch(instance, 0);
      paint(instance, useSim.getState());
    });

    /**
     * Per-frame values go straight into the GeoJSON sources. Subscribing
     * imperatively keeps the map off React's render path: the mob moves at
     * 60fps without a single component re-rendering.
     */
    let lastPhase = useSim.getState().phase;
    const unsubscribe = useSim.subscribe((state) => {
      if (!ready.current) return;
      paint(instance, state);

      if (state.phase !== lastPhase) {
        const from = lastPhase;
        lastPhase = state.phase;
        // Commit drops the camera onto the run so the ground between the two
        // paddocks is legible; arrival settles onto the destination.
        if (state.phase === "flying") frameRoute(instance, state.destinationId);
        else if (state.phase === "complete") framePaddock(instance, state.destinationId);
        else if (from === "flying") fitToRanch(instance);
      }
    });

    return () => {
      unsubscribe();
      ready.current = false;
      instance.remove();
      map.current = null;
    };
    // themeKey is deliberately excluded: the palette updates in place below
    // rather than tearing down and rebuilding the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (map.current && ready.current) updatePalette(map.current, MAP_PALETTE[themeKey]);
  }, [themeKey]);

  // maplibre-gl.css sets `position: relative` on .maplibregl-map, which beats a
  // Tailwind `absolute inset-0` and leaves the container zero height. Size it
  // explicitly instead and let the positioned section be the frame.
  return <div ref={container} className="h-full w-full" />;
}

/**
 * The map is the one thing allowed a long ease. Everything else in the console
 * settles inside 320ms; a camera move that fast is unreadable.
 */
const FLY_MS = 1700;

const flyDuration = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : FLY_MS;

const GUTTER = { top: 64, bottom: 110, left: 64, right: RIGHT_GUTTER };

function fitToRanch(map: MapLibreMap, duration = flyDuration()) {
  map.fitBounds(RANCH.bounds, { padding: GUTTER, duration, pitch: 34 });
}

function boundsOf(points: [number, number][]): LngLatBounds {
  const bounds = new LngLatBounds(points[0], points[0]);
  for (const p of points) bounds.extend(p);
  return bounds;
}

/**
 * Frame the whole run on commit: the source paddock, the destination paddock and
 * the route between them. This is the moment the mob starts walking, so the
 * ground it has to cross is what the operator needs on screen.
 */
function frameRoute(map: MapLibreMap, destinationId: string) {
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
function framePaddock(map: MapLibreMap, id: string) {
  map.fitBounds(boundsOf([...paddock(id).ring]), {
    padding: GUTTER,
    duration: flyDuration(),
    pitch: 40,
    maxZoom: 14,
  });
}

type SimSnapshot = ReturnType<typeof useSim.getState>;
type Palette = MapPalette;

/**
 * The store ticks every frame for the clock and the savings counter, but the map
 * only cares about geometry. Re-parsing GeoJSON sixty times a second starves the
 * source loader and nothing ever paints, so each source is written only when its
 * own inputs actually changed.
 */
const painted = new WeakMap<MapLibreMap, { route: string; mob: string; drones: string }>();

function paint(map: MapLibreMap, state: SimSnapshot) {
  const last = painted.get(map) ?? { route: "", mob: "", drones: "" };
  const committed = state.phase === "flying" || state.phase === "complete";

  const routeKey = `${state.destinationId}|${committed}`;
  const mobKey = state.mob.position.join(",");
  const dronesKey = state.drones
    .filter((d) => d.airborne)
    .map((d) => `${d.id}:${d.position.join(",")}:${d.heading.toFixed(1)}`)
    .join("|");

  if (routeKey === last.route && mobKey === last.mob && dronesKey === last.drones) return;
  painted.set(map, { route: routeKey, mob: mobKey, drones: dronesKey });

  if (routeKey !== last.route) paintRoute(map, state, committed);
  if (mobKey !== last.mob) paintMob(map, state);
  if (dronesKey !== last.drones) paintDrones(map, state);

  if (routeKey !== last.route && map.getLayer("paddock-selected")) {
    map.setFilter("paddock-selected", ["==", ["get", "id"], state.destinationId]);
  }
}

function paintRoute(map: MapLibreMap, state: SimSnapshot, committed: boolean) {
  const route = buildRoute("hodka-flat", state.destinationId);
  setData(map, "route", {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { committed },
        geometry: { type: "LineString", coordinates: route.coordinates },
      },
    ],
  });
}

function paintMob(map: MapLibreMap, state: SimSnapshot) {
  setData(map, "mob", {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { head: state.mob.head },
        geometry: { type: "Point", coordinates: state.mob.position },
      },
    ],
  });
}

function paintDrones(map: MapLibreMap, state: SimSnapshot) {
  setData(map, "drones", {
    type: "FeatureCollection",
    features: state.drones
      .filter((d) => d.airborne)
      .map((d) => ({
        type: "Feature" as const,
        properties: { id: d.id, heading: d.heading },
        geometry: { type: "Point" as const, coordinates: d.position },
      })),
  });
}

function setData(map: MapLibreMap, id: string, data: GeoJSON.FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export type { Palette };
