"use client";

import bearing from "@turf/bearing";
import destination from "@turf/destination";
import { point } from "@turf/helpers";
import { create } from "zustand";

import { AIRCRAFT, MUSTER_CREW } from "@/lib/data/fleet";
import { SEED_ALERTS, type Alert } from "@/lib/data/operations";
import { ACTIVE_MOB, paddock, RANCH } from "@/lib/data/ranch";
import { istNow } from "@/lib/format";

export type LayerMode = "satellite" | "pasture";

export type MissionPhase = "idle" | "planned" | "scheduled" | "flying" | "complete";

export type DroneState = {
  id: string;
  position: [number, number];
  heading: number;
  battery: number;
  airborne: boolean;
  task: string;
};

/**
 * Rupees saved per second against the cost of mustering with jeeps and hired
 * herders. The Analytics odometer reads straight off this.
 */
const SAVED_PER_SECOND = 2.84;

/** A committed muster runs for ninety seconds so it fits inside a demo. */
export const MUSTER_SECONDS = 90;

type SimState = {
  clock: Date;
  phase: MissionPhase;
  destinationId: string;
  scheduledFor: string | null;
  /** 0 to 1 along the route. Drives the mob, the drones and the dash march. */
  progress: number;
  mob: { head: number; position: [number, number] };
  drones: DroneState[];
  costSaved: number;
  alerts: Alert[];
  /** Bumped once per second so charts can subscribe without touching the frame loop. */
  slowTick: number;
  /** Which surface the map is reading: the imagery, or the dry matter measured off it. */
  layer: LayerMode;
  /** The paddock whose PastureView trend is open, if any. */
  inspectedId: string | null;
  /** The aircraft the telemetry bar reads and the camera follows. */
  selectedDroneId: string;
  /** Whether the camera is tracking the selected aircraft. */
  following: boolean;

  setLayer: (layer: LayerMode) => void;
  selectDrone: (id: string) => void;
  setFollowing: (following: boolean) => void;
  inspect: (id: string | null) => void;
  setDestination: (id: string) => void;
  schedule: (when: string) => void;
  startMuster: () => void;
  reset: () => void;
  tick: (deltaSeconds: number) => void;
  pushAlert: (alert: Omit<Alert, "id" | "time">) => void;
};

const source = paddock(ACTIVE_MOB.sourceId);

/**
 * A working aircraft is somewhere over its paddock, not pinned to the centroid.
 * Parking them on centres also stacked every icon under a paddock label, where
 * the halo swallowed it.
 */
function parked(centre: readonly [number, number], bearing: number): [number, number] {
  const out = destination(point([centre[0], centre[1]]), 1.1, bearing, { units: "kilometers" });
  return out.geometry.coordinates as [number, number];
}

function initialDrones(): DroneState[] {
  return AIRCRAFT.map((a, i) => {
    // The airborne fleet sits over the paddocks it is actually working; anything
    // docked sits on the pad, which is where a docked aircraft is.
    const heading = [42, 155, 288, 0][i] ?? 0;
    const home =
      a.id === "MST-04"
        ? parked(paddock("hodka-flat").centre, heading)
        : a.id === "MST-07"
          ? parked(paddock("ludiya-ridge").centre, heading)
          : a.id === "MST-11"
            ? parked(paddock("chhari-dhand").centre, heading)
            : RANCH.homestead;
    return {
      id: a.id,
      position: [home[0], home[1]] as [number, number],
      heading,
      battery: a.battery,
      airborne: a.airborne,
      task: a.task,
    };
  });
}

let alertSeq = 0;

export const useSim = create<SimState>((set, get) => ({
  clock: istNow(),
  phase: "idle",
  destinationId: ACTIVE_MOB.destinationId,
  scheduledFor: null,
  progress: 0,
  mob: { head: ACTIVE_MOB.head, position: [source.centre[0], source.centre[1]] },
  drones: initialDrones(),
  costSaved: 2_48_61_000,
  alerts: SEED_ALERTS,
  slowTick: 0,
  layer: "satellite",
  inspectedId: null,
  selectedDroneId: "MST-04",
  following: false,

  setLayer: (layer) => set({ layer, inspectedId: null }),

  inspect: (id) => set({ inspectedId: id }),

  // Picking an aircraft never moves the camera on its own. Follow is a separate
  // decision, so selecting one mid-run does not yank the view out from under you.
  selectDrone: (id) => set({ selectedDroneId: id }),

  /**
   * Following drops the basemap back to PastureView. At tracking altitude the
   * raw imagery is busy and the aircraft get lost in it; against the dimmed
   * ground the fleet reads, and the mob is walking off thin feed onto good feed,
   * which is the surface that says why. Toggling the layer back mid-follow
   * sticks: this only fires on the way in.
   */
  setFollowing: (following) =>
    set(following ? { following, layer: "pasture", inspectedId: null } : { following }),

  setDestination: (id) =>
    set((s) =>
      s.phase === "flying" ? s : { destinationId: id, phase: "planned", scheduledFor: null },
    ),

  schedule: (when) => set({ phase: "scheduled", scheduledFor: when }),

  startMuster: () => {
    if (get().phase === "flying") return;
    // Committing hands tracking to the lead muster aircraft. Whatever the
    // operator was looking at before, the run is now the thing on the screen,
    // and following a survey aircraft parked two paddocks away is not that.
    set({ phase: "flying", progress: 0, selectedDroneId: MUSTER_CREW[0] });
    get().pushAlert({
      kind: "Mission",
      text: `Autonomous muster committed. ${ACTIVE_MOB.head} head from ${source.name} to ${paddock(get().destinationId).name}.`,
      meta: `${MUSTER_CREW.join(", ")} · low pressure`,
      tone: "primary",
    });
  },

  reset: () =>
    set({
      phase: "idle",
      progress: 0,
      scheduledFor: null,
      mob: { head: ACTIVE_MOB.head, position: [source.centre[0], source.centre[1]] },
      drones: initialDrones(),
      alerts: SEED_ALERTS,
      selectedDroneId: "MST-04",
      following: false,
    }),

  pushAlert: (alert) => {
    alertSeq += 1;
    const stamped: Alert = {
      ...alert,
      id: `live-${alertSeq}`,
      time: get().clock.toTimeString().slice(0, 5),
    };
    set((s) => ({ alerts: [stamped, ...s.alerts].slice(0, 40) }));
  },

  /** Clock and money only. The engine owns route progress so it advances once. */
  tick: (dt) => set((s) => ({ clock: istNow(), costSaved: s.costSaved + SAVED_PER_SECOND * dt })),
}));

/**
 * Flanking positions for the two assigned aircraft. Heading is derived from the
 * bearing each drone holds to the mob, never scripted, so the triangles always
 * point the way an aircraft applying pressure would actually face.
 */
export function flankDrone(
  mobPosition: [number, number],
  routeBearing: number,
  side: -1 | 1,
): { position: [number, number]; heading: number } {
  const offsetBearing = routeBearing + 180 + side * 38;
  const pos = destination(point(mobPosition), 0.42, offsetBearing, { units: "kilometers" });
  const coords = pos.geometry.coordinates as [number, number];
  return {
    position: coords,
    heading: bearing(point(coords), point(mobPosition)),
  };
}
