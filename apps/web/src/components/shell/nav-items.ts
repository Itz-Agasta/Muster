import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  /** Count shown beside the label. Empty means the screen has nothing waiting. */
  badge: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/ops", label: "Live Ops Map", badge: "4" },
  { href: "/herd", label: "Herd Health", badge: "3" },
  { href: "/analytics", label: "Ranch Analytics", badge: "" },
  { href: "/missions", label: "Missions", badge: "12" },
  { href: "/paddocks", label: "Paddocks", badge: "6" },
  { href: "/fleet", label: "Fleet & Maintenance", badge: "" },
];

/** Nested routes keep their parent's title: /herd/all is still Herd Health. */
export function pageTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match]! : "Live Ops";
}

export const PAGE_TITLES: Record<string, string> = {
  "/ops": "Live Ops",
  "/herd": "Herd Health",
  "/analytics": "Ranch Analytics",
  "/missions": "Missions",
  "/paddocks": "Paddocks",
  "/fleet": "Fleet & Maintenance",
};
