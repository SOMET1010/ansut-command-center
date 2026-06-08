import { test, expect } from "@playwright/test";

/**
 * E2E — Protected route redirect
 *
 * The _authenticated layout redirects unauthenticated users to /login.
 * This test asserts the guard for the main cockpit entry points without
 * needing real credentials.
 */

const PROTECTED_ROUTES = [
  "/dashboard",
  "/events",
  "/events/new",
  "/participants",
  "/checkin",
  "/polls",
  "/announcements",
];

test.describe("Auth — protected routes", () => {
  test.beforeEach(async ({ page }) => {
    // Force unauthenticated state: stub any session/user lookup as null.
    await page.route("**/auth/v1/user**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
    );
    await page.route("**/rest/v1/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
  });

  for (const path of PROTECTED_ROUTES) {
    test(`redirects ${path} to /login when not authenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL("**/login", { timeout: 10_000 });
      expect(page.url()).toContain("/login");
      await expect(page.getByRole("heading", { name: /^connexion$/i })).toBeVisible();
    });
  }
});
