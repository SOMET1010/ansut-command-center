import { test, expect, type Route } from "@playwright/test";

/**
 * E2E — Logout flow (preview + production)
 *
 * Verifies that clicking "Déconnexion" from the cockpit:
 *   1. Calls Supabase /auth/v1/logout (directly in prod, through the
 *      same-origin proxy is N/A — logout uses supabase-js in both envs;
 *      we just assert the network call fires and the local session is
 *      cleared).
 *   2. Clears the persisted Supabase session from localStorage.
 *   3. Redirects to /login.
 *   4. Hitting a protected route (/dashboard) after logout bounces back
 *      to /login (auth gate enforces invalidation).
 *
 * We seed the session by stubbing the login flow (same approach as
 * e2e/login.spec.ts) so the test is self-contained and doesn't require
 * real Supabase credentials.
 */

const PREVIEW_URL = process.env.PLAYWRIGHT_PREVIEW_URL;
const PRODUCTION_URL = process.env.PLAYWRIGHT_PRODUCTION_URL;
const TEST_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "qa+logout@ansut.ci";
const TEST_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "correct-horse-battery-staple";

type EnvName = "preview" | "production";

const ENVS: Array<{ name: EnvName; baseURL: string | undefined }> = [
  { name: "preview", baseURL: PREVIEW_URL },
  { name: "production", baseURL: PRODUCTION_URL },
];

const FAKE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(
    JSON.stringify({
      sub: "00000000-0000-0000-0000-000000000001",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url") +
  ".sig";

const FAKE_USER = {
  id: "00000000-0000-0000-0000-000000000001",
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

for (const env of ENVS) {
  test.describe(`Logout — ${env.name}`, () => {
    test.skip(
      !env.baseURL,
      `Set PLAYWRIGHT_${env.name.toUpperCase()}_URL to run ${env.name} tests`,
    );
    test.use({ baseURL: env.baseURL });

    test(`signs out, clears session, and lands on /login (${env.name})`, async ({ page }) => {
      const logoutCalls: Array<{ url: string; method: string }> = [];

      // Stub login round-trip
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
      await page.route("**/rest/v1/**", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
      );

      // Capture logout calls (Supabase issues POST /auth/v1/logout)
      await page.route("**/auth/v1/logout**", async (route: Route) => {
        const req = route.request();
        logoutCalls.push({ url: req.url(), method: req.method() });
        await route.fulfill({ status: 204, body: "" });
      });

      // 1. Sign in
      await page.goto("/login");
      await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
      await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /se connecter/i }).click();
      await page.waitForURL("**/dashboard", { timeout: 15_000 });

      // Confirm Supabase persisted a session in localStorage before logout.
      const sessionBefore = await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token")),
      );
      expect(
        sessionBefore.length,
        "supabase session must be persisted after login",
      ).toBeGreaterThan(0);

      // 2. Click "Déconnexion" in the cockpit sidebar
      await page.getByRole("button", { name: /déconnexion/i }).click();

      // 3. Redirected to /login
      await page.waitForURL("**/login", { timeout: 10_000 });
      expect(page.url()).toContain("/login");

      // 4. Supabase logout endpoint was hit
      expect(
        logoutCalls.length,
        "supabase /auth/v1/logout should have been called",
      ).toBeGreaterThanOrEqual(1);
      expect(logoutCalls[0].method).toBe("POST");

      // 5. Local session cleared
      const sessionAfter = await page.evaluate(() => {
        return Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .map((k) => localStorage.getItem(k));
      });
      const stillHasSession = sessionAfter.some((v) => {
        if (!v) return false;
        try {
          const parsed = JSON.parse(v);
          return Boolean(parsed?.access_token);
        } catch {
          return false;
        }
      });
      expect(stillHasSession, "supabase session must be cleared after logout").toBe(false);

      // 6. Protected route bounces back to /login (auth gate enforces invalidation)
      await page.goto("/dashboard");
      await page.waitForURL("**/login**", { timeout: 10_000 });
      expect(page.url()).toMatch(/\/login/);
    });
  });
}
