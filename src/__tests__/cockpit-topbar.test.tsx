import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import {
  COCKPIT_NAV_ITEMS,
  getCockpitBreadcrumbLabel,
} from "@/lib/cockpit-nav";
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
  it("returns the matching label for each registered cockpit route", () => {
    for (const item of COCKPIT_NAV_ITEMS) {
      expect(getCockpitBreadcrumbLabel(item.to)).toBe(item.label);
    }
  });

  it("matches nested routes by longest prefix", () => {
    expect(getCockpitBreadcrumbLabel("/events/new")).toBe("Événements");
    expect(getCockpitBreadcrumbLabel("/events/abc-123/registrations")).toBe(
      "Événements",
    );
    expect(getCockpitBreadcrumbLabel("/admin/setup")).toBe("Administration");
  });

  it("updates the label when the pathname changes across routes", () => {
    const sequence = ["/dashboard", "/events", "/participants", "/checkin", "/polls"];
    const labels = sequence.map(getCockpitBreadcrumbLabel);
    expect(labels).toEqual([
      "Tableau de bord",
      "Événements",
      "Participants",
      "Check-in",
      "Live Polling",
    ]);
    // Every transition must produce a distinct label — guards against a stuck breadcrumb.
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("falls back to 'Console' for unknown routes", () => {
    expect(getCockpitBreadcrumbLabel("/")).toBe("Console");
    expect(getCockpitBreadcrumbLabel("/unknown")).toBe("Console");
  });
});
