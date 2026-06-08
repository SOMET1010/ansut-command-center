import { test, expect, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * E2E — GDPR cookie consent
 *
 * Vérifie que la bannière de consentement RGPD :
 *   1. s'affiche sur toutes les pages publiques tant qu'aucun choix n'est fait ;
 *   2. n'apparaît plus, sur n'importe quelle route, dès qu'un choix est enregistré ;
 *   3. peut être rouverte via le bouton « Préférences cookies » du footer ;
 *   4. enregistre correctement le consentement dans `localStorage`.
 *
 * Les routes publiques sont découvertes dynamiquement depuis `src/routes/` afin
 * que toute nouvelle page publique soit automatiquement testée — aucun ajout
 * manuel n'est nécessaire dans ce fichier.
 */

const STORAGE_KEY = "ansut.cookie-consent.v1";

/** Discover all public, static, top-level routes from src/routes/. */
function discoverPublicRoutes(): string[] {
  const dir = join(process.cwd(), "src", "routes");
  const entries = readdirSync(dir, { withFileTypes: true });

  const routes = new Set<string>(["/"]);

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!/\.tsx?$/.test(name)) continue;

    // Skip framework files & layouts
    if (name.startsWith("__")) continue;
    if (name.startsWith("_")) continue; // _authenticated.tsx etc.
    if (name === "index.tsx") continue; // already added as "/"
    if (name.includes("$")) continue; // dynamic params, skipped (need data)
    if (name.startsWith("api.")) continue;

    // Convert "foo.bar.tsx" → "/foo/bar"
    const base = name.replace(/\.tsx?$/, "");
    const segments = base.split(".").filter((s) => s !== "index");
    if (segments.length === 0) continue;
    routes.add("/" + segments.join("/"));
  }

  return Array.from(routes).sort();
}

const PUBLIC_ROUTES = discoverPublicRoutes();

/** Bannière identifiée par son titre accessible. */
function banner(page: Page) {
  return page.getByRole("dialog", { name: /Respect de votre vie privée/i });
}

function footerPreferencesButton(page: Page) {
  return page.getByRole("button", { name: /Préférences cookies/i });
}

/** Stub backend reads so loaders resolve everywhere. */
async function stubBackend(page: Page) {
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
}

test.describe("Consentement RGPD — bannière initiale", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
  });

  for (const route of PUBLIC_ROUTES) {
    test(`bannière visible sur ${route} sans choix préalable`, async ({ page }) => {
      await page.goto(route);
      await expect(banner(page)).toBeVisible();
      // Les 3 actions RGPD doivent être présentes au même niveau.
      await expect(page.getByRole("button", { name: /Tout accepter/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Tout refuser/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Personnaliser/ })).toBeVisible();
    });
  }
});

test.describe("Consentement RGPD — choix persistant", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
  });

  test("« Tout refuser » enregistre un consentement sans optionnels", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Tout refuser/ }).click();
    await expect(banner(page)).toBeHidden();

    const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toMatchObject({ necessary: true, analytics: false, functional: false });
    expect(typeof parsed.decidedAt).toBe("string");
  });

  test("« Tout accepter » enregistre tous les optionnels", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Tout accepter/ }).click();
    await expect(banner(page)).toBeHidden();

    const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed).toMatchObject({ necessary: true, analytics: true, functional: true });
  });

  test("le choix persiste sur toutes les routes publiques", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Tout refuser/ }).click();
    await expect(banner(page)).toBeHidden();

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      await expect(banner(page), `bannière ne doit pas réapparaître sur ${route}`).toBeHidden();
      await expect(footerPreferencesButton(page)).toBeVisible();
    }
  });
});

test.describe("Consentement RGPD — révocation", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
  });

  test("le bouton « Préférences cookies » rouvre la bannière depuis n'importe quelle page", async ({
    page,
  }) => {
    // Pré-enregistrer un consentement pour cacher la bannière initiale.
    await page.goto("/");
    await page.evaluate(
      ([k, v]) => localStorage.setItem(k, v),
      [
        STORAGE_KEY,
        JSON.stringify({
          necessary: true,
          analytics: false,
          functional: false,
          decidedAt: new Date().toISOString(),
        }),
      ],
    );

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      await expect(banner(page)).toBeHidden();
      await footerPreferencesButton(page).click();
      await expect(banner(page), `bannière doit s'ouvrir sur ${route}`).toBeVisible();
      // Ferme via « Tout refuser » pour ne pas polluer l'état entre routes.
      await page.getByRole("button", { name: /Tout refuser/ }).click();
      await expect(banner(page)).toBeHidden();
    }
  });
});
