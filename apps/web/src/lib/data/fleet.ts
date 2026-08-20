/** Aircraft carry Indian raptor names. MST is the Muster airframe prefix. */

export type Aircraft = {
  id: string;
  callsign: string;
  airframe: string;
  serial: string;
  status: "Airborne" | "Docked" | "Service due";
  airborne: boolean;
  battery: number;
  task: string;
  flightHours: number;
  cycles: number;
  nextService: string;
  /** Percent of the 250 hour service interval consumed. Over 100 is overdue. */
  wear: number;
};

export const AIRCRAFT: Aircraft[] = [
  {
    id: "MST-04",
    callsign: "Baaz",
    airframe: "Muster A2",
    serial: "MK2-0417",
    status: "Airborne",
    airborne: true,
    battery: 78,
    task: "Mustering · Hodka Flat",
    flightHours: 612.4,
    cycles: 412,
    nextService: "14 Sep",
    wear: 62,
  },
  {
    id: "MST-07",
    callsign: "Saras",
    airframe: "Survey S1",
    serial: "SV1-0207",
    status: "Airborne",
    airborne: true,
    battery: 54,
    task: "Survey grid · Ludiya Ridge",
    flightHours: 488.1,
    cycles: 301,
    nextService: "02 Sep",
    wear: 74,
  },
  {
    id: "MST-11",
    callsign: "Koel",
    airframe: "Muster A2",
    serial: "MK2-1101",
    status: "Airborne",
    airborne: true,
    battery: 91,
    task: "Perimeter · Chhari Dhand",
    flightHours: 204.6,
    cycles: 138,
    nextService: "28 Oct",
    wear: 28,
  },
  {
    id: "MST-02",
    callsign: "Cheel",
    airframe: "Muster A1",
    serial: "MK1-0021",
    status: "Service due",
    airborne: false,
    battery: 12,
    task: "Docked · charging, 24 min",
    flightHours: 1204.9,
    cycles: 886,
    nextService: "Overdue 6 d",
    wear: 104,
  },
];

export const AIRCRAFT_BY_ID = new Map(AIRCRAFT.map((a) => [a.id, a]));

/** The two aircraft assigned to the muster the console opens on. */
export const MUSTER_CREW = ["MST-04", "MST-11"] as const;

export type WorkOrder = {
  title: string;
  status: "Overdue" | "Open" | "Closed";
  tone: "bad" | "warn" | "quiet";
  meta: string;
  note: string;
};

export const MAINTENANCE: WorkOrder[] = [
  {
    title: "MST-02 · 250 h airframe service",
    status: "Overdue",
    tone: "bad",
    meta: "WO-0912 · due 14 Aug",
    note: "Prop hub play detected on pre-flight. Grounded until signed off.",
  },
  {
    title: "MST-02 · battery pack retirement",
    status: "Open",
    tone: "warn",
    meta: "WO-0918 · 886 cycles",
    note: "Capacity at 71% of nameplate. Replacement pack on hand at Bhuj.",
  },
  {
    title: "MST-07 · multispectral calibration",
    status: "Open",
    tone: "warn",
    meta: "WO-0921 · due 02 Sep",
    note: "Reflectance drift 3.4% against the calibration panel.",
  },
  {
    title: "MST-04 · prop set replacement",
    status: "Closed",
    tone: "quiet",
    meta: "WO-0904 · 18 Aug",
    note: "Signed off by R. Jat. Four blades, two hubs.",
  },
  {
    title: "MST-11 · firmware 4.8.2",
    status: "Closed",
    tone: "quiet",
    meta: "WO-0899 · 16 Aug",
    note: "Waypoint hold accuracy improved to 0.4 m.",
  },
];

export const PARTS = [
  { name: "Prop blades (A2)", count: 12, low: false },
  { name: "Battery packs 22 Ah", count: 3, low: false },
  { name: "Motor assemblies", count: 1, low: true },
  { name: "Thermal camera modules", count: 2, low: false },
];
