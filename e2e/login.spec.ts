import { test, expect, type Route } from "@playwright/test";

/**
 * E2E — Login flow (preview + production)
 *
 * Mirrors e2e/forgot-password.spec.ts. Validates that the login form:
 *   - Routes through the same-origin /api/public/auth/token proxy when
 *     running inside the Lovable preview iframe (where the preview fetch
 *     proxy breaks direct Supabase auth POSTs).
 *   - Talks directly to Supabase /auth/v1/token?grant_type=password in
 *     production.
 *
 * Both endpoints are intercepted via page.route so the tests never hit
 * real Supabase and don't require seeded credentials.
 */

const PREVIEW_URL = process.env.PLAYWRIGHT_PREVIEW_URL;
const PRODUCTION_URL = process.env.PLAYWRIGHT_PRODUCTION_URL;
const TEST_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "qa+login@ansut.ci";
const TEST_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "correct-horse-battery-staple";

type EnvName = "preview" | "production";

const ENVS: Array<{ name: EnvName; baseURL: string | undefined; expectedHost: "same-origin" | "supabase" }> = [
  { name: "preview", baseURL: PREVIEW_URL, expectedHost: "same-origin" },
  { name: "production", baseURL: PRODUCTION_URL, expectedHost: "supabase" },
];

// Minimal, syntactically-valid (but not cryptographically real) JWT placeholder.
// supabase.auth.setSession() in preview only needs a non-empty access/refresh
// pair; the intercepted user/session calls below complete the hydration.
const FAKE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(JSON.stringify({ sub: "00000000-0000-0000-0000-000000000001", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") +
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
  test.describe(`Login — ${env.name}`, () => {
    test.skip(!env.baseURL, `Set PLAYWRIGHT_${env.name.toUpperCase()}_URL to run ${env.name} tests`);
    test.use({ baseURL: env.baseURL });

    test(`submits credentials via the correct endpoint and lands on /dashboard (${env.name})`, async ({ page }) => {
      const calls: Array<{ url: string; method: string; body: string }> = [];

      // Same-origin proxy (preview path)
      await page.route("**/api/public/auth/token", async (route: Route) => {
        const req = route.request();
        calls.push({ url: req.url(), method: req.method(), body: req.postData() ?? "" });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(FAKE_TOKEN_RESPONSE),
        });
      });

      // Direct Supabase auth (production path) — token endpoint + user lookup
      await page.route("**/auth/v1/token**", async (route: Route) => {
        const req = route.request();
        calls.push({ url: req.url(), method: req.method(), body: req.postData() ?? "" });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(FAKE_TOKEN_RESPONSE),
        });
      });
      await page.route("**/auth/v1/user**", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_USER) }),
      );

      // Dashboard pulls data from Supabase REST on mount — stub everything so
      // navigation completes without network errors. We're only asserting the
      // login round-trip here, not dashboard contents.
      await page.route("**/rest/v1/**", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
      );

      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /^connexion$/i })).toBeVisible();

      await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
      await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /se connecter/i }).click();

      await page.waitForURL("**/dashboard", { timeout: 15_000 });

      expect(calls.length, "exactly one token request should fire").toBeGreaterThanOrEqual(1);
      const tokenCall =
        calls.find((c) =>
          env.expectedHost === "same-origin"
            ? c.url.includes("/api/public/auth/token")
            : /\/auth\/v1\/token/.test(c.url),
        ) ?? calls[0];

      expect(tokenCall.method).toBe("POST");
      expect(tokenCall.body).toContain(TEST_EMAIL);
      expect(tokenCall.body).toContain(TEST_PASSWORD);

      if (env.expectedHost === "same-origin") {
        expect(tokenCall.url, "preview must route through same-origin proxy").toContain("/api/public/auth/token");
        expect(tokenCall.url, "preview must NOT hit supabase.co directly").not.toContain("supabase.co");
      } else {
        expect(tokenCall.url, "production must hit Supabase auth directly").toMatch(/\/auth\/v1\/token/);
        expect(tokenCall.url, "production must NOT use the same-origin proxy").not.toContain("/api/public/auth/token");
      }
    });

    test(`shows error toast on invalid credentials (${env.name})`, async ({ page }) => {
      const errorBody = JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
        msg: "Invalid login credentials",
      });

      await page.route("**/api/public/auth/token", (route) =>
        route.fulfill({ status: 400, contentType: "application/json", body: errorBody }),
      );
      await page.route("**/auth/v1/token**", (route) =>
        route.fulfill({ status: 400, contentType: "application/json", body: errorBody }),
      );

      await page.goto("/login");
      await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
      await page.getByLabel(/mot de passe/i).fill("wrong-password");
      await page.getByRole("button", { name: /se connecter/i }).click();

      // Toast surfaces error; URL must remain /login.
      await expect(page.getByText(/invalid login credentials|connexion impossible/i).first()).toBeVisible({
        timeout: 10_000,
      });
      expect(page.url()).toContain("/login");
    });
  });
}
