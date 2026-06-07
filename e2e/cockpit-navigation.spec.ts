import { test, expect, type Page } from "@playwright/test";

/**
 * E2E — Cockpit navigation
 *
 * Walks through dashboard → events → participants → checkin and verifies, at
 * every step:
 *   1. The ANSUT logo is visible in the internal topbar (institutional anchor).
 *   2. The breadcrumb ("Console / <Page>") reflects the active route.
 *   3. A visual snapshot of the topbar is taken for human review.
 *
 * Requires env vars E2E_TEST_EMAIL + E2E_TEST_PASSWORD pointing to a seeded
 * cockpit user. Tests auto-skip if credentials are missing so CI doesn't
 * fail on unseeded environments.
 */

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

const COCKPIT_STEPS = [
  { path: "/dashboard", label: "Tableau de bord" },
  { path: "/events", label: "Événements" },
  { path: "/participants", label: "Participants" },
  { path: "/checkin", label: "Check-in" },
] as const;

test.describe("Cockpit — ANSUT logo & breadcrumb", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run cockpit E2E tests");

  test.beforeEach(async ({ page }) => {
    await signIn(page, EMAIL!, PASSWORD!);
  });

  test("logo and breadcrumb persist across cockpit navigation", async ({ page }, testInfo) => {
    for (const step of COCKPIT_STEPS) {
      await page.goto(step.path);
      await page.waitForURL(`**${step.path}`, { timeout: 10_000 });

      // 1. ANSUT logo present in the internal topbar (sticky header)
      const topbar = page.locator("header.sticky").first();
      await expect(topbar).toBeVisible();
      const logo = topbar.getByRole("img", { name: /ANSUT/i }).first();
      await expect(logo, `logo ANSUT must be visible on ${step.path}`).toBeVisible();
      await expect(logo).toHaveAttribute("alt", /ANSUT/i);

      // 2. Breadcrumb reflects the active route
      await expect(topbar.getByText("Console", { exact: true })).toBeVisible();
      await expect(
        topbar.getByText(step.label, { exact: true }),
        `breadcrumb must show "${step.label}" on ${step.path}`,
      ).toBeVisible();

      // 3. Visual snapshot of the topbar for human review
      await testInfo.attach(`topbar-${step.path.replace(/\//g, "_")}`, {
        body: await topbar.screenshot(),
        contentType: "image/png",
      });
    }
  });
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole("button", { name: /connexion|se connecter|sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}
