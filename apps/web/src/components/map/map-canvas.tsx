"use client";

import dynamic from "next/dynamic";

/**
 * MapLibre reads `window` at import time, so the map cannot be server rendered.
 * `ssr: false` is only legal inside a Client Component, which is why this
 * one-line boundary exists.
 */
export const MapCanvas = dynamic(() => import("./live-ops-map").then((m) => m.LiveOpsMap), {
  ssr: false,
  loading: () => <div className="bg-map-base h-full w-full" />,
});
