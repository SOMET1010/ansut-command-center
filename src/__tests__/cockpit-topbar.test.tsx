import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { COCKPIT_NAV_ITEMS, getCockpitBreadcrumbLabel } from "@/lib/cockpit-nav";
import { AnsutLogo } from "@/components/ansut/Logo";

// Stub TanStack Router's <Link> so AnsutLogo's withLink path renders a plain <a>
// in jsdom (no router context required).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => cleanup());

describe("Cockpit topbar — ANSUT logo", () => {
  it("renders the official ANSUT logo image with an accessible alt text", () => {
    render(<AnsutLogo size="sm" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("alt")).toMatch(/ANSUT/i);
    expect(img.getAttribute("src")).toBeTruthy();
  });
});

describe("Cockpit breadcrumb — getCockpitBreadcrumbLabel", () => {
  it("returns the matching label for each registered cockpit nav item", () => {
    for (const item of COCKPIT_NAV_ITEMS) {
      expect(getCockpitBreadcrumbLabel(item.to)).toBe(item.label);
    }
  });

  // Real route files under src/routes/_authenticated/ — keep this table in sync
  // when adding/removing a cockpit page.
  const ALL_COCKPIT_URLS: Array<[url: string, label: string]> = [
    ["/dashboard", "Tableau de bord"],
    ["/events", "Événements"],
    ["/events/new", "Événements"],
    ["/events/abc-123/edit", "Événements"],
    ["/events/abc-123/registrations", "Événements"],
    ["/participants", "Participants"],
    ["/polls", "Live Polling"],
    ["/checkin", "Check-in"],
    ["/admin/setup", "Administration"],
  ];

  it.each(ALL_COCKPIT_URLS)("resolves '%s' to '%s'", (url, expected) => {
    expect(getCockpitBreadcrumbLabel(url)).toBe(expected);
  });

  it("uses longest-prefix matching (sub-routes never collide with siblings)", () => {
    // /admin/setup must NOT fall back to a hypothetical /admin parent
    expect(getCockpitBreadcrumbLabel("/admin/setup")).toBe("Administration");
    // /events is not a prefix of /eventsomething
    expect(getCockpitBreadcrumbLabel("/eventsomething")).toBe("Console");
  });

  it("updates the label at every step of a cockpit navigation sequence", () => {
    const sequence = [
      "/dashboard",
      "/events",
      "/events/new",
      "/events/abc-123/registrations",
      "/participants",
      "/polls",
      "/checkin",
      "/admin/setup",
    ];
    const labels = sequence.map(getCockpitBreadcrumbLabel);
    expect(labels).toEqual([
      "Tableau de bord",
      "Événements",
      "Événements",
      "Événements",
      "Participants",
      "Live Polling",
      "Check-in",
      "Administration",
    ]);
  });

  it("falls back to 'Console' for unknown or public routes", () => {
    expect(getCockpitBreadcrumbLabel("/")).toBe("Console");
    expect(getCockpitBreadcrumbLabel("/login")).toBe("Console");
    expect(getCockpitBreadcrumbLabel("/signup")).toBe("Console");
    expect(getCockpitBreadcrumbLabel("/unknown/deeply/nested")).toBe("Console");
    expect(getCockpitBreadcrumbLabel("")).toBe("Console");
  });
});
