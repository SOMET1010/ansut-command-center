import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * The cockpit is auth-gated, so the test needs to sign in against a real
 * Supabase project. Configure these env vars before running:
 *   - PLAYWRIGHT_BASE_URL        e.g. https://<project>.lovable.app or http://localhost:5173
 *   - E2E_TEST_EMAIL             email of a seeded test user with cockpit access
 *   - E2E_TEST_PASSWORD          password for that user
 *
 * Install the browser once with: bunx playwright install chromium
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "mobile-pixel-5",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
