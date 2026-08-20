/** Mission log, water assets, biomass history and the seed activity feed. */

export type MissionStatus = "Completed" | "Scheduled" | "Aborted";

export type Mission = {
  id: string;
  type: "Muster" | "Perimeter" | "Survey" | "Water check" | "Draft";
  route: string;
  aircraft: string;
  start: string;
  duration: string;
  outcome: string;
  status: MissionStatus;
  tone: "good" | "warn" | "bad";
};

export const MISSIONS: Mission[] = [
  {
    id: "MSN-2214",
    type: "Muster",
    route: "Dhordo North to Bhirandiyara",
    aircraft: "MST-04, MST-11",
    start: "Today 12:48",
    duration: "2h 06m",
    outcome: "612 head moved · saved ₹2,98,400",
    status: "Completed",
    tone: "good",
  },
  {
    id: "MSN-2213",
    type: "Perimeter",
    route: "Chhari Dhand",
    aircraft: "MST-11",
    start: "Today 09:30",
    duration: "38m",
    outcome: "3 fence anomalies logged",
    status: "Completed",
    tone: "good",
  },
  {
    id: "MSN-2212",
    type: "Survey",
    route: "Ludiya Ridge grid",
    aircraft: "MST-07",
    start: "Today 07:12",
    duration: "1h 22m",
    outcome: "NDVI composite refreshed",
    status: "Completed",
    tone: "good",
  },
  {
    id: "MSN-2211",
    type: "Muster",
    route: "Hodka Flat to Sarada Bet",
    aircraft: "MST-04, MST-11",
    start: "Today 15:40",
    duration: "est. 1h 12m",
    outcome: "418 head queued",
    status: "Scheduled",
    tone: "warn",
  },
  {
    id: "MSN-2210",
    type: "Water check",
    route: "8 troughs, all paddocks",
    aircraft: "MST-02",
    start: "Yest. 16:05",
    duration: "54m",
    outcome: "2 below threshold",
    status: "Completed",
    tone: "good",
  },
  {
    id: "MSN-2209",
    type: "Muster",
    route: "Bhirandiyara to Dhordo North",
    aircraft: "MST-04",
    start: "Yest. 06:30",
    duration: "41m",
    outcome: "Aborted at waypoint 6 · wind 27 kt",
    status: "Aborted",
    tone: "bad",
  },
  {
    id: "MSN-2208",
    type: "Draft",
    route: "Hospital paddock",
    aircraft: "MST-11",
    start: "18 Aug 14:20",
    duration: "1h 04m",
    outcome: "6 head drafted",
    status: "Completed",
    tone: "good",
  },
  {
    id: "MSN-2207",
    type: "Survey",
    route: "Sarada Bet grid",
    aircraft: "MST-07",
    start: "18 Aug 08:00",
    duration: "1h 36m",
    outcome: "Biomass 6.0 t DM/ha",
    status: "Completed",
    tone: "good",
  },
];

export const MISSION_STATS = [
  { label: "Flown this week", value: "11", tone: "ink" as const },
  { label: "Head moved", value: "4,820", tone: "ink" as const },
  { label: "Avg duration", value: "1h 48m", tone: "ink" as const },
  { label: "Aborted", value: "1", tone: "bad" as const },
];

/** Troughs, tanks and bores. Below 25% is a fault, below 40% approaches one. */
export const WATER_ASSETS = [
  { name: "Hodka bore trough", pct: 21, paddockId: "hodka-flat" },
  { name: "Homestead tank", pct: 88, paddockId: "sarada-bet" },
  { name: "Bhirandiyara nest", pct: 64, paddockId: "bhirandiyara" },
  { name: "Ludiya bore", pct: 47, paddockId: "ludiya-ridge" },
  { name: "Sarada trough", pct: 72, paddockId: "sarada-bet" },
  { name: "Chhari bore", pct: 34, paddockId: "chhari-dhand" },
  { name: "Dhordo dhand", pct: 81, paddockId: "dhordo-north" },
  { name: "East tank", pct: 58, paddockId: "dhordo-north" },
];

/**
 * Eighteen weeks of standing dry matter per paddock, normalised 0 to 1 against
 * the best week any paddock recorded. One row per paddock, newest on the right.
 */
export const BIOMASS_ROWS: { paddockId: string; cells: number[]; current: string }[] = [
  {
    paddockId: "bhirandiyara",
    cells: [
      0.9, 0.95, 0.88, 0.82, 0.74, 0.68, 0.72, 0.8, 0.86, 0.9, 0.84, 0.76, 0.7, 0.64, 0.6, 0.66,
      0.74, 0.82,
    ],
    current: "5.1 t",
  },
  {
    paddockId: "dhordo-north",
    cells: [
      0.7, 0.66, 0.6, 0.58, 0.62, 0.7, 0.76, 0.8, 0.74, 0.66, 0.58, 0.52, 0.48, 0.54, 0.62, 0.7,
      0.74, 0.68,
    ],
    current: "4.4 t",
  },
  {
    paddockId: "ludiya-ridge",
    cells: [
      0.5, 0.46, 0.42, 0.4, 0.44, 0.5, 0.56, 0.6, 0.54, 0.48, 0.42, 0.38, 0.34, 0.4, 0.46, 0.52,
      0.56, 0.5,
    ],
    current: "3.2 t",
  },
  {
    paddockId: "hodka-flat",
    cells: [
      0.34, 0.3, 0.26, 0.24, 0.28, 0.34, 0.4, 0.44, 0.38, 0.32, 0.26, 0.22, 0.2, 0.26, 0.32, 0.38,
      0.42, 0.36,
    ],
    current: "2.1 t",
  },
  {
    paddockId: "sarada-bet",
    cells: [
      0.78, 0.84, 0.9, 0.92, 0.86, 0.8, 0.74, 0.8, 0.88, 0.94, 0.9, 0.82, 0.76, 0.8, 0.86, 0.9,
      0.84, 0.78,
    ],
    current: "6.0 t",
  },
  {
    paddockId: "chhari-dhand",
    cells: [
      0.22, 0.18, 0.16, 0.2, 0.24, 0.28, 0.24, 0.2, 0.16, 0.14, 0.18, 0.22, 0.26, 0.22, 0.18, 0.16,
      0.2, 0.24,
    ],
    current: "1.4 t",
  },
];

export const SEASON_KPIS = [
  { label: "Musters flown", value: "41", note: "+7 vs. July", tone: "primary" as const },
  { label: "Flight hours", value: "612.4", note: "98.2% autonomous", tone: "muted" as const },
  {
    label: "Labour hours saved",
    value: "1,840",
    note: "about 46 herder-weeks",
    tone: "muted" as const,
  },
];

export type AlertKind = "Mission" | "Health" | "Water" | "Mob" | "Fleet" | "Weather";

export type Alert = {
  id: string;
  kind: AlertKind;
  text: string;
  time: string;
  meta: string;
  tone: "primary" | "bad" | "muted";
};

/** The feed the console opens with. The muster script pushes onto the front of it. */
export const SEED_ALERTS: Alert[] = [
  {
    id: "a-1",
    kind: "Mission",
    text: "MST-11 completed the perimeter sweep of Chhari Dhand. No breaches, 3 fence anomalies logged.",
    time: "14:22",
    meta: "142 ha · 38 min",
    tone: "primary",
  },
  {
    id: "a-2",
    kind: "Health",
    text: "KJ-4471 flagged: 17 kg lost over 14 days, lameness score 2. Drafted to the hospital paddock.",
    time: "14:09",
    meta: "confidence 0.91",
    tone: "bad",
  },
  {
    id: "a-3",
    kind: "Water",
    text: "Hodka bore trough at 21%, below the 25% threshold. Refill scheduled 16:30.",
    time: "13:54",
    meta: "-4% over 6h",
    tone: "bad",
  },
  {
    id: "a-4",
    kind: "Mob",
    text: "418 head confirmed in Hodka Flat. Count variance -2 against the last muster.",
    time: "13:31",
    meta: "MST-04 · thermal",
    tone: "muted",
  },
  {
    id: "a-5",
    kind: "Fleet",
    text: "MST-02 docked at the homestead pad. Charging to 80% in 24 min.",
    time: "13:12",
    meta: "cycle 886",
    tone: "muted",
  },
  {
    id: "a-6",
    kind: "Mission",
    text: "Autonomous muster Dhordo North to Bhirandiyara completed. 612 head moved.",
    time: "12:48",
    meta: "2h 06m · saved ₹2,98,400",
    tone: "primary",
  },
  {
    id: "a-7",
    kind: "Weather",
    text: "Wind gusting 22 kt from 020° after 16:00. The flight window narrows for MST-07.",
    time: "12:20",
    meta: "IMD Bhuj",
    tone: "muted",
  },
  {
    id: "a-8",
    kind: "Health",
    text: "Weight gain across the Bhirandiyara mob is +0.86 kg/day, above target for a fourth week.",
    time: "11:58",
    meta: "n = 1,240",
    tone: "primary",
  },
];
