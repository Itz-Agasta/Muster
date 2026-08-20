"use client";

import {
  Map as MapLibre,
  setWorkerUrl,
  type ErrorEvent,
  type GeoJSONSource,
  type Map as MapLibreMap,
} from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { RANCH } from "@/lib/data/ranch";
import {
  addPastureLayer,
  applyLayerMode,
  PASTURE_CELLS_LAYER,
  setInspected,
  updatePastureTheme,
} from "@/lib/map/pasture";
import { MAP_PALETTE, satelliteStyle, type MapPalette } from "@/lib/map/style";
import { buildRoute } from "@/lib/sim/route";
import { useSim } from "@/lib/sim/store";
import { env } from "@Muster/env/web";

import {
  engageFollow,
  fitToRanch,
  FOLLOW_INTERVAL_MS,
  framePaddock,
  frameRoute,
  holdFollow,
} from "./camera";
import { addOverlayLayers, updatePalette } from "./map-layers";

import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Turbopack resolves maplibre's module-worker URL to an empty string, so the
 * worker never starts. Raster tiles still paint, but every GeoJSON source stays
 * unloaded forever and no overlay renders, with no error raised anywhere.
 * Serving the worker from /public sidesteps bundler resolution completely.
 * `scripts/copy-maplibre-worker.mjs` keeps these files in step with the package.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/** Aircraft are 17px triangles, so a click needs a little slack around the point. */
const PICK_SLOP = 9;

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
  const layer = useSim((s) => s.layer);
  const inspectedId = useSim((s) => s.inspectedId);
  const selectedDroneId = useSim((s) => s.selectedDroneId);

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
      // Under the paddock outlines: the cells are ground, not chrome.
      addPastureLayer(instance, themeKey, "paddock-line");
      ready.current = true;
      fitToRanch(instance, 0);
      applyLayerMode(instance, useSim.getState().layer);
      paintSelection(instance, useSim.getState().selectedDroneId);
      paint(instance, useSim.getState());
    });

    /**
     * One click handler rather than layer-scoped ones, so the aircraft wins the
     * point it is drawn on and clicking off the cells closes the readout, the
     * way clicking off any inspector does.
     */
    instance.on("click", (e) => {
      const aircraft = instance.queryRenderedFeatures(
        [
          [e.point.x - PICK_SLOP, e.point.y - PICK_SLOP],
          [e.point.x + PICK_SLOP, e.point.y + PICK_SLOP],
        ],
        { layers: ["drone"] },
      )[0];
      if (aircraft) {
        useSim.getState().selectDrone(aircraft.properties.id as string);
        return;
      }
      if (useSim.getState().layer !== "pasture") return;
      const cell = instance.queryRenderedFeatures(e.point, { layers: [PASTURE_CELLS_LAYER] })[0];
      useSim.getState().inspect((cell?.properties?.paddockId as string | undefined) ?? null);
    });

    for (const id of ["drone", PASTURE_CELLS_LAYER]) {
      instance.on("mouseenter", id, () => {
        instance.getCanvas().style.cursor = "pointer";
      });
      instance.on("mouseleave", id, () => {
        instance.getCanvas().style.cursor = "";
      });
    }

    /**
     * Follow disengages the moment the operator touches the map, the way every
     * nav app behaves. The `originalEvent` guard is what separates a gesture from
     * the camera's own eases, which fire the same events.
     */
    const release = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent && useSim.getState().following) useSim.getState().setFollowing(false);
    };
    for (const ev of ["dragstart", "zoomstart", "rotatestart", "pitchstart"] as const) {
      instance.on(ev, release);
    }

    /**
     * Per-frame values go straight into the GeoJSON sources. Subscribing
     * imperatively keeps the map off React's render path: the mob moves at
     * 60fps without a single component re-rendering.
     */
    let lastPhase = useSim.getState().phase;
    let wasFollowing = false;
    let followedId = "";
    let handedOver = false;
    let heldAt = 0;

    const unsubscribe = useSim.subscribe((state) => {
      if (!ready.current) return;
      paint(instance, state);

      if (state.phase !== lastPhase) {
        const from = lastPhase;
        lastPhase = state.phase;
        // Commit drops the camera onto the run so the ground between the two
        // paddocks is legible; arrival settles onto the destination.
        if (state.phase === "flying") {
          handedOver = false;
          frameRoute(instance, state.destinationId);
        } else if (state.phase === "complete") framePaddock(instance, state.destinationId);
        else if (from === "flying") fitToRanch(instance);
      }

      // Once the run is properly under way the camera goes to the herd on its
      // own. Watching a mob walk is the point of the screen; asking the operator
      // to press a button first would be asking them to find it.
      if (state.phase === "flying" && !handedOver && state.progress > 0.06) {
        handedOver = true;
        useSim.getState().setFollowing(true);
      }

      // Engaging, and switching aircraft while engaged, are both camera moves and
      // get the long ease. The hold in between is a slide, and only a slide: run
      // it against a target two paddocks away and it whips across the map.
      if (state.following && (!wasFollowing || state.selectedDroneId !== followedId)) {
        heldAt = performance.now() + engageFollow(instance, followTarget(state));
      } else if (state.following && performance.now() - heldAt > FOLLOW_INTERVAL_MS) {
        heldAt = performance.now();
        holdFollow(instance, followTarget(state));
      }
      wasFollowing = state.following;
      followedId = state.selectedDroneId;
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
    if (!map.current || !ready.current) return;
    updatePalette(map.current, MAP_PALETTE[themeKey]);
    updatePastureTheme(map.current, themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (map.current && ready.current) applyLayerMode(map.current, layer);
  }, [layer]);

  useEffect(() => {
    if (map.current && ready.current) setInspected(map.current, inspectedId);
  }, [inspectedId]);

  useEffect(() => {
    if (map.current && ready.current) paintSelection(map.current, selectedDroneId);
  }, [selectedDroneId]);

  // maplibre-gl.css sets `position: relative` on .maplibregl-map, which beats a
  // Tailwind `absolute inset-0` and leaves the container zero height. Size it
  // explicitly instead and let the positioned section be the frame.
  return <div ref={container} className="h-full w-full" />;
}

type SimSnapshot = ReturnType<typeof useSim.getState>;
type Palette = MapPalette;

function paintSelection(map: MapLibreMap, id: string) {
  map.setFilter("drone-selected", ["==", ["get", "id"], id]);
}

/** A docked aircraft is a fine thing to watch; it just never goes anywhere. */
function followTarget(state: SimSnapshot): [number, number] {
  return state.drones.find((d) => d.id === state.selectedDroneId)?.position ?? state.mob.position;
}

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
    .map((d) => `${d.id}:${d.position.join(",")}:${d.heading.toFixed(1)}:${d.airborne}`)
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

/** The whole fleet is drawn, docked included. A pad you cannot see is a pad you forget. */
function paintDrones(map: MapLibreMap, state: SimSnapshot) {
  setData(map, "drones", {
    type: "FeatureCollection",
    features: state.drones.map((d) => ({
      type: "Feature" as const,
      properties: { id: d.id, heading: d.heading, airborne: d.airborne },
      geometry: { type: "Point" as const, coordinates: d.position },
    })),
  });
}

function setData(map: MapLibreMap, id: string, data: GeoJSON.FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export type { Palette };
