import { test, expect, type Route } from "@playwright/test";

/**
 * E2E — Event management actions (edit / delete / duplicate)
 *
 * Covers the super_admin flows on /events:
 *   - Édition d'un événement via /events/$id/edit puis PATCH events.
 *   - Suppression via le bouton corbeille (confirm() auto-accepté) puis DELETE events.
 *   - Duplication via le bouton copie puis INSERT events avec status=draft.
 *
 * Tout est intercepté : pas de backend réel requis, pas de credentials seedés.
 */

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000001";
const FAKE_ORG_ID = "00000000-0000-0000-0000-0000000000aa";
const EVENT_ID = "00000000-0000-0000-0000-0000000000ee";
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

const SEED_EVENT = {
  id: EVENT_ID,
  organization_id: FAKE_ORG_ID,
  name: "SUTEL 2026 — Plénière",
  slug: "sutel-2026-pleniere",
  description: "Description initiale",
  location: "Sofitel Abidjan",
  starts_at: "2026-03-10T09:00:00.000Z",
  ends_at: "2026-03-12T18:00:00.000Z",
  capacity: 500,
  cover_url: null,
  status: "published",
  wifi_ssid: null,
  wifi_password: null,
  wifi_encryption: null,
};

type Capture = { method: string; url: string; body: string };

async function setupAuthAndRest(
  page: import("@playwright/test").Page,
  captures: Capture[],
  options: {
    eventsList?: unknown[];
    onMutation?: (req: { method: string; url: string; body: string }) => unknown;
  } = {},
) {
  const eventsList = options.eventsList ?? [SEED_EVENT];

  // Auth
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

  // Supabase REST
  await page.route("**/rest/v1/**", async (route: Route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    const body = req.postData() ?? "";

    if (url.includes("/rest/v1/user_roles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ role: "super_admin" }]),
      });
    }

    if (url.includes("/rest/v1/organizations")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: FAKE_ORG_ID }),
      });
    }

    if (url.includes("/rest/v1/events")) {
      // Mutations are forwarded to the test-supplied handler if any.
      if (method !== "GET" && method !== "HEAD") {
        captures.push({ method, url, body });
        const custom = options.onMutation?.({ method, url, body });
        if (custom !== undefined) {
          return route.fulfill({
            status: method === "DELETE" ? 204 : 201,
            contentType: "application/json",
            body: JSON.stringify(custom),
          });
        }
        return route.fulfill({
          status: method === "DELETE" ? 204 : 201,
          contentType: "application/json",
          body: JSON.stringify([SEED_EVENT]),
        });
      }

      // Single-row select (.single()) → return object, not array.
      if (url.includes(`id=eq.${EVENT_ID}`) && !url.includes("select=organization_id")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(SEED_EVENT),
        });
      }
      if (url.includes("select=organization_id")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ organization_id: FAKE_ORG_ID }),
        });
      }
      // List
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(eventsList),
      });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
  await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

test.describe("Events — actions super_admin", () => {
  test("édition : PATCH events et retour vers /events", async ({ page }) => {
    const captures: Capture[] = [];
    await setupAuthAndRest(page, captures);
    await signIn(page);

    await page.goto(`/events/${EVENT_ID}/edit`);
    await page.waitForURL(`**/events/${EVENT_ID}/edit`);

    const nameInput = page.getByLabel(/nom de l'événement/i);
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await expect(nameInput).toHaveValue(SEED_EVENT.name);

    await nameInput.fill("SUTEL 2026 — Plénière (modifiée)");
    await page.getByRole("button", { name: /mettre à jour/i }).click();

    await page.waitForURL("**/events", { timeout: 15_000 });

    const patch = captures.find((c) => c.method === "PATCH" && c.url.includes("/events"));
    expect(patch, "un PATCH events doit être émis").toBeTruthy();
    expect(patch!.url).toContain(`id=eq.${EVENT_ID}`);
    expect(patch!.body).toContain("Plénière (modifiée)");
  });

  test("suppression : confirm() puis DELETE events", async ({ page }) => {
    const captures: Capture[] = [];
    await setupAuthAndRest(page, captures);
    await signIn(page);

    // Auto-accepter le window.confirm("Supprimer ...")
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toMatch(/supprimer/i);
      void dialog.accept();
    });

    await page.goto("/events");
    await expect(page.getByText(SEED_EVENT.name)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Supprimer" }).click();

    await expect(page.getByText(/événement supprimé/i)).toBeVisible({ timeout: 10_000 });

    const del = captures.find((c) => c.method === "DELETE" && c.url.includes("/events"));
    expect(del, "un DELETE events doit être émis").toBeTruthy();
    expect(del!.url).toContain(`id=eq.${EVENT_ID}`);
  });

  test("duplication : INSERT events en brouillon avec '(copie)' dans le nom", async ({ page }) => {
    const captures: Capture[] = [];
    await setupAuthAndRest(page, captures);
    await signIn(page);

    await page.goto("/events");
    await expect(page.getByText(SEED_EVENT.name)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Dupliquer" }).click();

    await expect(page.getByText(/événement dupliqué/i)).toBeVisible({ timeout: 10_000 });

    const insert = captures.find(
      (c) => c.method === "POST" && c.url.includes("/events") && c.body.includes("(copie)"),
    );
    expect(insert, "un INSERT events avec '(copie)' doit être émis").toBeTruthy();
    expect(insert!.body).toContain('"status":"draft"');
    expect(insert!.body).toContain(FAKE_ORG_ID);
  });
});
