import { test, expect, type Route } from "@playwright/test";

/**
 * E2E — Event creation flow
 *
 * Walks through the super-admin path /events/new:
 *   1. Authenticate via the same intercept pattern as login.spec.ts.
 *   2. Stub the organizations lookup so the form mounts.
 *   3. Fill the required fields and submit.
 *   4. Verify the POST to the events table fires with the expected payload
 *      and that the app redirects to /events.
 *
 * Runs against the preview baseURL by default; uses fully mocked backends.
 */

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000001";
const FAKE_ORG_ID = "00000000-0000-0000-0000-0000000000aa";
const TEST_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "qa+events@ansut.ci";
const TEST_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "correct-horse-battery-staple";

const FAKE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(
    JSON.stringify({
      sub: FAKE_USER_ID,
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url") +
  ".sig";

const FAKE_USER = {
  id: FAKE_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: TEST_EMAIL,
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

const FAKE_TOKEN_RESPONSE = {
  access_token: FAKE_JWT,
  refresh_token: "fake-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: FAKE_USER,
};

test.describe("Events — création", () => {
  test("super_admin peut créer un événement et est redirigé vers /events", async ({ page }) => {
    const createCalls: Array<{ url: string; body: string }> = [];

    // --- Auth: token + user lookups ---------------------------------------
    await page.route("**/api/public/auth/token", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_TOKEN_RESPONSE),
      }),
    );
    await page.route("**/auth/v1/token**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_TOKEN_RESPONSE),
      }),
    );
    await page.route("**/auth/v1/user**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_USER),
      }),
    );

    // --- Supabase REST stubs ----------------------------------------------
    await page.route("**/rest/v1/**", async (route: Route) => {
      const req = route.request();
      const url = req.url();
      const method = req.method();

      // user_roles → super_admin so RoleGuard lets us in.
      if (url.includes("/rest/v1/user_roles")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ role: "super_admin" }]),
        });
      }

      // organizations?slug=eq.ansut → return our fake org id.
      if (url.includes("/rest/v1/organizations")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: FAKE_ORG_ID }),
        });
      }

      // Event creation POST — capture and ack.
      if (url.includes("/rest/v1/events") && method === "POST") {
        createCalls.push({ url, body: req.postData() ?? "" });
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "00000000-0000-0000-0000-0000000000ee",
              organization_id: FAKE_ORG_ID,
              name: "SUTEL 2026 — Test E2E",
              slug: "sutel-2026-test-e2e",
              status: "draft",
            },
          ]),
        });
      }

      // Everything else: empty array.
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    // --- Sign in ----------------------------------------------------------
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15_000 });

    // --- Go to /events/new and fill the form ------------------------------
    await page.goto("/events/new");
    await page.waitForURL("**/events/new", { timeout: 10_000 });

    // The form only renders once the organizations lookup resolves.
    const nameInput = page.getByLabel(/nom de l'événement/i);
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    await nameInput.fill("SUTEL 2026 — Test E2E");
    // Slug is auto-derived from name; just confirm a value is present.
    await expect(page.locator("#slug")).not.toHaveValue("");

    // Dates (datetime-local format yyyy-MM-ddTHH:mm).
    await page.locator("#starts_at").fill("2026-03-10T09:00");
    await page.locator("#ends_at").fill("2026-03-12T18:00");
    await page.getByLabel(/lieu/i).fill("Sofitel Abidjan");

    await page.getByRole("button", { name: /créer l'événement/i }).click();

    // --- Assertions -------------------------------------------------------
    await page.waitForURL("**/events", { timeout: 15_000 });
    expect(createCalls.length, "a single events POST must fire").toBeGreaterThanOrEqual(1);
    expect(createCalls[0].body).toContain("SUTEL 2026 — Test E2E");
    expect(createCalls[0].body).toContain(FAKE_ORG_ID);
  });
});
