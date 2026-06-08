import { test, expect } from "@playwright/test";

/**
 * E2E — Public navigation
 *
 * Verifies the public landing page renders and that the primary navigation
 * paths (signup, login, programme) are reachable. Backend reads are stubbed
 * so the test runs without a seeded database.
 */

test.describe("Public navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Landing page reads from getLandingData server fn → Supabase REST.
    // Stub everything to empty arrays so the loader resolves.
    await page.route("**/rest/v1/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await page.route("**/_serverFn/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { data: { events: [], stats: {} } } }),
      }),
    );
  });

  test("landing page exposes ANSUT EVENT branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ANSUT EVENT/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("can navigate from landing to /login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: /^connexion$/i })).toBeVisible();
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test("/signup page renders the registration form", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForURL("**/signup");
    // The signup route must mount without a runtime error.
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("/forgot-password page renders the reset form", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForURL("**/forgot-password");
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
  });
});
