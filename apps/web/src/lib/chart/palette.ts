"use client";

import { useTheme } from "next-themes";

import type { HealthStatus } from "@/lib/data/herd";

/**
 * Chart colours are sRGB rather than the oklch chrome tokens because d3 and the
 * SVG marks need concrete values, and because the status steps had to be tuned
 * for separation rather than inherited.
 *
 * Validated with the dataviz palette checker against both surfaces:
 *   dark  #6e9172 / #d4a373 / #e5484d  normal ΔE 16.2, CVD ΔE 9.5
 *   light #3d5a40 / #aa7d2d / #9d392e  normal ΔE 17.1, CVD ΔE 13.7
 *
 * Light-mode warning is a lighter, warmer clay than the chrome `--warning`
 * token: at the token's own value it sat ΔE 11.2 from danger, which is below the
 * legibility floor, so a flagged animal and a monitored one were genuinely hard
 * to tell apart. The chroma floor still fails on the greens; that is DESIGN.md's
 * calm-industrial palette by intent, and it is mitigated the way the method
 * allows, with a legend and direct labels so identity is never colour alone.
 */
export type ChartPalette = {
  healthy: string;
  monitoring: string;
  flagged: string;
  /** The mob band and its median line. */
  band: string;
  bandStroke: string;
  median: string;
  grid: string;
  axis: string;
  surface: string;
};

const DARK: ChartPalette = {
  healthy: "#6e9172",
  monitoring: "#d4a373",
  flagged: "#e5484d",
  band: "rgba(110,145,114,0.20)",
  bandStroke: "rgba(110,145,114,0.38)",
  median: "#6e9172",
  grid: "rgba(255,255,255,0.07)",
  axis: "rgba(255,255,255,0.34)",
  surface: "#141614",
};

const LIGHT: ChartPalette = {
  healthy: "#3d5a40",
  monitoring: "#aa7d2d",
  flagged: "#9d392e",
  band: "rgba(61,90,64,0.14)",
  bandStroke: "rgba(61,90,64,0.30)",
  median: "#3d5a40",
  grid: "rgba(20,30,20,0.07)",
  axis: "rgba(20,30,20,0.38)",
  surface: "#ffffff",
};

export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "light" ? LIGHT : DARK;
}

export function statusColor(p: ChartPalette, status: HealthStatus): string {
  return status === "flagged" ? p.flagged : status === "monitoring" ? p.monitoring : p.healthy;
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  monitoring: "Monitoring",
  flagged: "Flagged",
};
