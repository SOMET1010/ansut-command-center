/**
 * Source of truth for the cockpit (authenticated) navigation.
 * Pure data + a breadcrumb resolver — no React, so it's trivially testable.
 */

export type CockpitNavTo =
  | "/dashboard"
  | "/events"
  | "/participants"
  | "/polls"
  | "/checkin"
  | "/admin/setup";

export type CockpitNavItem = {
  to: CockpitNavTo;
  label: string;
  /**
   * When true, the item is kept in the breadcrumb registry but hidden from
   * the sidebar (placeholder/coming-soon modules). The route file still
   * exists and is reachable by direct URL.
   */
  hidden?: boolean;
};
export type CockpitNavSection = { label: string; items: CockpitNavItem[] };

export const COCKPIT_NAV_SECTIONS: CockpitNavSection[] = [
  {
    label: "Pilotage",
    items: [{ to: "/dashboard", label: "Tableau de bord" }],
  },
  {
    label: "Modules métier",
    items: [
      { to: "/events", label: "Événements" },
      { to: "/participants", label: "Participants", hidden: true },
      { to: "/polls", label: "Live Polling", hidden: true },
    ],
  },
  {
    label: "Exécution",
    items: [
      { to: "/checkin", label: "Check-in" },
      { to: "/admin/setup", label: "Administration" },
    ],
  },
];

/** Full registry (including hidden) — used by the breadcrumb resolver. */
export const COCKPIT_NAV_ITEMS: CockpitNavItem[] = COCKPIT_NAV_SECTIONS.flatMap(
  (s) => s.items,
);

/** Sections filtered for the sidebar — drops `hidden` items and empty groups. */
export const COCKPIT_VISIBLE_NAV_SECTIONS: CockpitNavSection[] =
  COCKPIT_NAV_SECTIONS.map((s) => ({
    label: s.label,
    items: s.items.filter((i) => !i.hidden),
  })).filter((s) => s.items.length > 0);

/**
 * Returns the breadcrumb label for a cockpit pathname.
 * Matches the longest registered route prefix (so /events/new resolves to "Événements").
 * Falls back to "Console" for unknown routes.
 */
export function getCockpitBreadcrumbLabel(pathname: string): string {
  const match = COCKPIT_NAV_ITEMS
    .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? "Console";
}
