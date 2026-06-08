import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * E2E — Forgot password flow
 *
 * Validates that the "mot de passe oublié" form works both in the Lovable
 * preview iframe (where Supabase auth POSTs are blocked by the preview
 * fetch proxy and must go through our /api/public/auth/recover same-origin
 * proxy) and in production (where the supabase-js client talks directly
 * to /auth/v1/recover).
 *
 * We run the same scenario twice with different baseURLs:
 *  - "preview"    → PLAYWRIGHT_PREVIEW_URL    (e.g. id-preview--<id>.lovable.app)
 *  - "production" → PLAYWRIGHT_PRODUCTION_URL (e.g. <project>.lovable.app)
 *
 * The tests intercept the outgoing request so they don't actually email
 * anyone, and so they don't require Supabase to be reachable from CI.
 * They assert that:
 *   1. The correct endpoint is hit for the environment (proxy vs direct).
 *   2. The UI shows the success confirmation after submit.
 *   3. The submitted email is echoed back in the confirmation message.
 */

const PREVIEW_URL = process.env.PLAYWRIGHT_PREVIEW_URL;
const PRODUCTION_URL = process.env.PLAYWRIGHT_PRODUCTION_URL;
const TEST_EMAIL = process.env.E2E_FORGOT_EMAIL ?? "qa+forgot@ansut.ci";

type EnvName = "preview" | "production";

const ENVS: Array<{
  name: EnvName;
  baseURL: string | undefined;
  expectedHost: "same-origin" | "supabase";
}> = [
  { name: "preview", baseURL: PREVIEW_URL, expectedHost: "same-origin" },
  { name: "production", baseURL: PRODUCTION_URL, expectedHost: "supabase" },
];

for (const env of ENVS) {
  test.describe(`Forgot password — ${env.name}`, () => {
    test.skip(
      !env.baseURL,
      `Set PLAYWRIGHT_${env.name.toUpperCase()}_URL to run ${env.name} tests`,
    );
    test.use({ baseURL: env.baseURL });

    test(`submits and shows confirmation (${env.name})`, async ({ page }) => {
      const calls: Array<{ url: string; method: string; body: string }> = [];

      // Intercept BOTH the same-origin proxy (preview path) and the direct
      // Supabase auth endpoint (production path). Whichever fires is the
      // one the environment actually uses — we assert on it below.
      await page.route("**/api/public/auth/recover", async (route: Route) => {
        const req = route.request();
        calls.push({ url: req.url(), method: req.method(), body: req.postData() ?? "" });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      });
      await page.route("**/auth/v1/recover*", async (route: Route) => {
        const req = route.request();
        calls.push({ url: req.url(), method: req.method(), body: req.postData() ?? "" });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      });

      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: /mot de passe oublié/i })).toBeVisible();

      await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
      await page.getByRole("button", { name: /envoyer le lien/i }).click();

      // Success state appears (toast + inline confirmation block)
      await expect(page.getByText(/e-mail envoyé/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(TEST_EMAIL)).toBeVisible();

      // Exactly one auth call should have been issued, on the expected host
      expect(calls.length, "exactly one recovery request should fire").toBe(1);
      const call = calls[0];
      expect(call.method).toBe("POST");
      expect(call.body).toContain(TEST_EMAIL);

      if (env.expectedHost === "same-origin") {
        expect(call.url, "preview must route through same-origin proxy").toContain(
          "/api/public/auth/recover",
        );
        expect(call.url, "preview must NOT hit supabase.co directly").not.toContain("supabase.co");
      } else {
        expect(call.url, "production must hit Supabase auth directly").toMatch(
          /\/auth\/v1\/recover/,
        );
        expect(call.url, "production must NOT use the same-origin proxy").not.toContain(
          "/api/public/auth/recover",
        );
      }
    });

    test(`shows error toast on backend failure (${env.name})`, async ({ page }) => {
      await page.route("**/api/public/auth/recover", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "boom" }),
        }),
      );
      await page.route("**/auth/v1/recover*", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ msg: "boom" }),
        }),
      );

      await page.goto("/forgot-password");
      await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
      await page.getByRole("button", { name: /envoyer le lien/i }).click();

      // Sonner toast surfaces the error; confirmation block must NOT appear.
      await expect(page.getByText(/échec de l'envoi|boom/i).first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(/e-mail envoyé/i)).not.toBeVisible();
    });
  });
}

/* Helpful for local debugging — not used by tests above. */
export async function fillForgot(page: Page, email: string) {
  await page.goto("/forgot-password");
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByRole("button", { name: /envoyer le lien/i }).click();
}
