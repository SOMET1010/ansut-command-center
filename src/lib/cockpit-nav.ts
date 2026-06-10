/**
 * Source of truth for the cockpit (authenticated) navigation.
 * Pure data + a breadcrumb resolver — no React, so it's trivially testable.
 */

export type CockpitNavTo =
  | "/dashboard"
  | "/events"
  | "/participants"
  | "/polls"
  | "/announcements"
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
    items: [{ to: "/dashboard", label: "Cockpit" }],
  },
  {
    label: "Événement",
    items: [
      { to: "/events", label: "Programme" },
      { to: "/participants", label: "Participants" },
      { to: "/checkin", label: "Check-in" },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/announcements", label: "Annonces" },
      { to: "/polls", label: "Sondages" },
    ],
  },
  {
    label: "Paramètres",
    items: [{ to: "/admin/setup", label: "Administration" }],
  },
];

/** Full registry (including hidden) — used by the breadcrumb resolver. */
export const COCKPIT_NAV_ITEMS: CockpitNavItem[] = COCKPIT_NAV_SECTIONS.flatMap((s) => s.items);

/** Sections filtered for the sidebar — drops `hidden` items and empty groups. */
export const COCKPIT_VISIBLE_NAV_SECTIONS: CockpitNavSection[] = COCKPIT_NAV_SECTIONS.map((s) => ({
  label: s.label,
  items: s.items.filter((i) => !i.hidden),
})).filter((s) => s.items.length > 0);

/**
 * Returns the breadcrumb label for a cockpit pathname.
 * Matches the longest registered route prefix (so /events/new resolves to "Événements").
 * Falls back to "Console" for unknown routes.
 */
export function getCockpitBreadcrumbLabel(pathname: string): string {
  const match = COCKPIT_NAV_ITEMS.filter(
    (i) => pathname === i.to || pathname.startsWith(`${i.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? "Console";
}

/** A single breadcrumb crumb. `to` absent = current page (non-clickable). */
export type Crumb = { label: string; to?: string };

/**
 * Builds a breadcrumb chain for any cockpit pathname, including deep nested routes.
 * Example: /events/abc/sessions → [Console, Événements, Sessions]
 */
export function getCockpitBreadcrumbChain(pathname: string): Crumb[] {
  const chain: Crumb[] = [{ label: "Console", to: "/dashboard" }];
  const parent = COCKPIT_NAV_ITEMS.filter(
    (i) => pathname === i.to || pathname.startsWith(`${i.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0];

  if (!parent) return chain;

  // If on parent itself, render just parent as current.
  if (pathname === parent.to) {
    chain.push({ label: parent.label });
    return chain;
  }

  // Otherwise parent is clickable, leaf gets a sub-label.
  chain.push({ label: parent.label, to: parent.to });

  const rest = pathname.slice(parent.to.length + 1); // strip "/parent/"
  const segments = rest.split("/").filter(Boolean);
  const leafLabel = labelForDeepSegments(parent.to, segments);
  chain.push({ label: leafLabel });
  return chain;
}

function labelForDeepSegments(parentTo: string, segments: string[]): string {
  if (parentTo === "/events") {
    const last = segments[segments.length - 1];
    if (segments.length === 1 && segments[0] === "new") return "Nouvel événement";
    if (last === "edit") return "Modifier";
    if (last === "sessions") return "Sessions & intervenants";
    if (last === "registrations") return "Inscriptions";
    return "Détails";
  }
  // Generic fallback: humanize last segment.
  const last = segments[segments.length - 1] ?? "";
  return last
    .replace(/[-_]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Returns the parent "back to" target for a deep cockpit route, or null if at top.
 * Used by the contextual "Retour" button in the topbar.
 */
export function getCockpitParentTarget(pathname: string): string | null {
  const parent = COCKPIT_NAV_ITEMS.filter(
    (i) => pathname === i.to || pathname.startsWith(`${i.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0];
  if (!parent || pathname === parent.to) return null;
  return parent.to;
}

