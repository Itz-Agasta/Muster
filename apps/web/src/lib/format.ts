/**
 * Every number, ID, coordinate and timestamp on screen goes through here.
 * The operation runs on Indian units: kilograms, hectares, rupees, IST.
 */

const inrGroups = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const plain = new Intl.NumberFormat("en-IN");

/** Rupees with lakh/crore grouping. 24861000 becomes "₹2,48,61,000". */
export function inr(value: number): string {
  return `₹${inrGroups.format(Math.round(value))}`;
}

/** Short rupee form for tight cells. 24861000 becomes "₹2.49 Cr". */
export function inrShort(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return inr(value);
}

export function num(value: number, digits = 0): string {
  return plain.format(Number(value.toFixed(digits)));
}

export function kg(value: number, digits = 0): string {
  return `${num(value, digits)} kg`;
}

export function ha(value: number): string {
  return `${plain.format(Math.round(value))} ha`;
}

/** Signed delta, always with an explicit sign so gain and loss read at a glance. */
export function delta(value: number, digits = 0): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${num(Math.abs(value), digits)}`;
}

export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** INAPH twelve-digit ear tag. India's ISO country code is 356. */
export function eid(tag: string): string {
  const digits = tag.replace(/\D/g, "").padStart(6, "0");
  return `IN 356 000 ${digits}`;
}

const IST_OFFSET_MIN = 330;

/** Wall clock in IST regardless of where the browser thinks it is. */
export function istNow(from: Date = new Date()): Date {
  const utc = from.getTime() + from.getTimezoneOffset() * 60_000;
  return new Date(utc + IST_OFFSET_MIN * 60_000);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function clockTime(date: Date, withSeconds = true): string {
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${hm}:${pad(date.getSeconds())}` : hm;
}

/** Minutes as "1h 12m", or "48m" when under the hour. */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
}

export function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${Math.round(minutesAgo)} min ago`;
  const h = Math.floor(minutesAgo / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

/** Decimal degrees to the DMS-ish form a station office would read off a GPS. */
export function coords(lng: number, lat: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)} ${ns}  ${Math.abs(lng).toFixed(4)} ${ew}`;
}
