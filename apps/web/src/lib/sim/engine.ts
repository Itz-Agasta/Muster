"use client";

import { useEffect } from "react";

import { ACTIVE_MOB, paddock } from "@/lib/data/ranch";
import { inr } from "@/lib/format";

import { buildRoute, headingAt, positionAt, type Route } from "./route";
import { flankDrone, MUSTER_SECONDS, useSim } from "./store";

/**
 * Events fired at fixed points along the route. This is what turns a moving dot
 * into a mission you can watch: the feed narrates the muster as it happens.
 */
const WAYPOINTS: { at: number; fire: (destinationName: string) => void }[] = [
  {
    at: 0.14,
    fire: () =>
      useSim.getState().pushAlert({
        kind: "Mob",
        text: `${ACTIVE_MOB.head} head lifted off the bore line. Pressure held low, no animal above a walk.`,
        meta: "MST-04 · thermal count 418",
        tone: "muted",
      }),
  },
  {
    at: 0.42,
    fire: () =>
      useSim.getState().pushAlert({
        kind: "Health",
        text: "KJ-4471 falling behind the mob by 60 m. Drafted out and held for the hospital paddock.",
        meta: "confidence 0.94 · gait asymmetry",
        tone: "bad",
      }),
  },
  {
    at: 0.71,
    fire: (destinationName) =>
      useSim.getState().pushAlert({
        kind: "Mission",
        text: `Mob approaching the ${destinationName} gate. MST-11 easing off to let them settle through.`,
        meta: "1.8 km to run · 14 min",
        tone: "muted",
      }),
  },
  {
    at: 0.995,
    fire: (destinationName) => {
      const saved = 4_18_000;
      useSim.getState().pushAlert({
        kind: "Mission",
        text: `Muster complete. ${ACTIVE_MOB.head} head in ${destinationName}, count reconciled against the gate.`,
        meta: `1h 12m · saved ${inr(saved)}`,
        tone: "primary",
      });
      useSim.setState({ phase: "complete", costSaved: useSim.getState().costSaved + saved });
    },
  },
];

/**
 * The single frame loop for the whole console. Mounted once by the shell.
 *
 * Position updates are written straight into the store; components that need
 * per-frame values subscribe imperatively rather than re-rendering. Charts read
 * `slowTick`, which moves once a second.
 */
export function useSimEngine() {
  useEffect(() => {
    // Dev handle: lets a run be scrubbed or reset without sitting through
    // ninety seconds, and gives the demo a way to replay from the console.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __muster?: typeof useSim }).__muster = useSim;
    }

    let frame = 0;
    let last = performance.now();
    let secondAccumulator = 0;
    let fired = new Set<number>();
    let route: Route = buildRoute(ACTIVE_MOB.sourceId, useSim.getState().destinationId);
    let routeFor = useSim.getState().destinationId;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;

      const state = useSim.getState();

      if (state.destinationId !== routeFor) {
        route = buildRoute(ACTIVE_MOB.sourceId, state.destinationId);
        routeFor = state.destinationId;
        fired = new Set();
      }

      state.tick(dt);

      if (state.phase === "flying") {
        const progress = Math.min(1, state.progress + dt / MUSTER_SECONDS);
        const mobPosition = positionAt(route, progress);
        const travelBearing = headingAt(route, progress);
        const destinationName = paddock(state.destinationId).name;

        const left = flankDrone(mobPosition, travelBearing, -1);
        const right = flankDrone(mobPosition, travelBearing, 1);

        useSim.setState({
          progress,
          mob: { head: ACTIVE_MOB.head, position: mobPosition },
          drones: state.drones.map((d) => {
            if (d.id === "MST-04")
              return {
                ...d,
                ...left,
                battery: Math.max(0, d.battery - dt * 0.045),
                task: `Mustering · ${destinationName}`,
              };
            if (d.id === "MST-11")
              return {
                ...d,
                ...right,
                battery: Math.max(0, d.battery - dt * 0.04),
                task: `Mustering · ${destinationName}`,
              };
            return d;
          }),
        });

        for (const [i, wp] of WAYPOINTS.entries()) {
          if (progress >= wp.at && !fired.has(i)) {
            fired.add(i);
            wp.fire(destinationName);
          }
        }
      }

      secondAccumulator += dt;
      if (secondAccumulator >= 1) {
        secondAccumulator = 0;
        useSim.setState((s) => ({ slowTick: s.slowTick + 1 }));
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);
}

export { buildRoute, positionAt, headingAt };
export type { Route };
