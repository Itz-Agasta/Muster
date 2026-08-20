"use client";

import bearing from "@turf/bearing";
import destination from "@turf/destination";
import { point } from "@turf/helpers";
import { create } from "zustand";

import { AIRCRAFT, MUSTER_CREW } from "@/lib/data/fleet";
import { SEED_ALERTS, type Alert } from "@/lib/data/operations";
import { ACTIVE_MOB, paddock } from "@/lib/data/ranch";
import { istNow } from "@/lib/format";

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

  setDestination: (id: string) => void;
  schedule: (when: string) => void;
  startMuster: () => void;
  reset: () => void;
  tick: (deltaSeconds: number) => void;
  pushAlert: (alert: Omit<Alert, "id" | "time">) => void;
};

const source = paddock(ACTIVE_MOB.sourceId);

function initialDrones(): DroneState[] {
  return AIRCRAFT.map((a, i) => {
    // Park the airborne fleet over the paddocks they are actually working.
    const home =
      a.id === "MST-04"
        ? paddock("hodka-flat").centre
        : a.id === "MST-07"
          ? paddock("ludiya-ridge").centre
          : a.id === "MST-11"
            ? paddock("chhari-dhand").centre
            : paddock("sarada-bet").centre;
    return {
      id: a.id,
      position: [home[0], home[1]] as [number, number],
      heading: [42, 155, 288, 0][i] ?? 0,
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

  setDestination: (id) =>
    set((s) =>
      s.phase === "flying" ? s : { destinationId: id, phase: "planned", scheduledFor: null },
    ),

  schedule: (when) => set({ phase: "scheduled", scheduledFor: when }),

  startMuster: () => {
    if (get().phase === "flying") return;
    set({ phase: "flying", progress: 0 });
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
