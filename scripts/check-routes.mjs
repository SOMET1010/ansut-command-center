#!/usr/bin/env node
/**
 * Vérifie la cohérence entre les fichiers de routes (src/routes/) et toutes
 * les références <Link to="...">, navigate({to: "..."}), redirect({to: "..."})
 * et router.navigate({to: "..."}) du code source.
 *
 * - Échec si une référence pointe vers une route inexistante.
 * - Avertissement si un fichier de route n'est jamais référencé (hors layouts,
 *   routes API publiques et pages techniques).
 *
 * Exécution : `node scripts/check-routes.mjs` (lancé via predev/prebuild).
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src", "routes");
const SRC_DIR = join(ROOT, "src");

const IGNORED_FILES = new Set([
  "__root.tsx",
  "routeTree.gen.ts",
  "README.md",
]);

/** Convertit un chemin de fichier route en path TanStack runtime ("/e/$slug"). */
function fileToRoutePath(relPath) {
  let p = relPath.replace(/\\/g, "/").replace(/\.(tsx?|jsx?)$/, "");
  p = p.replace(/\./g, "/");
  // Retire les segments de layout / pathless ("_authenticated", "_app", …) :
  // ils n'apparaissent pas dans l'URL runtime.
  p = p
    .split("/")
    .filter((seg) => seg && !seg.startsWith("_"))
    .join("/");
  if (p === "" || p === "index") return "/";
  if (p.endsWith("/index")) p = p.slice(0, -"/index".length);
  return "/" + p;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROUTES_DIR, full);
    if (IGNORED_FILES.has(name) || IGNORED_FILES.has(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|jsx?)$/.test(name)) acc.push(full);
  }
  return acc;
}

function collectSourceFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "routeTree.gen.ts" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectSourceFiles(full, acc);
    else if (/\.(tsx?|jsx?)$/.test(name)) acc.push(full);
  }
  return acc;
}

// 1. Routes disponibles
const routeFiles = walk(ROUTES_DIR);
const definedRoutes = new Set();
for (const f of routeFiles) {
  const rel = relative(ROUTES_DIR, f);
  definedRoutes.add(fileToRoutePath(rel));
}

// 2. Références dans le code — capture les `to: "/foo"` et `to="/foo"`,
// ignore les template literals (`/foo/${x}`) qui ne sont pas du routing typé.
const TO_REGEX = /\bto\s*[:=]\s*["'](\/[^"'`?#]*)["']/g;
const refs = new Map(); // path → [files]
for (const f of collectSourceFiles(SRC_DIR)) {
  const code = readFileSync(f, "utf8");
  let m;
  while ((m = TO_REGEX.exec(code))) {
    const to = m[1];
    if (!refs.has(to)) refs.set(to, []);
    refs.get(to).push(relative(ROOT, f));
  }
}

// 3. Validation
const errors = [];
for (const [to, sources] of refs) {
  if (definedRoutes.has(to)) continue;
  // Tolère hash anchors / chemins dynamiques résolus à l'exécution
  if (to === "/" || to === "") continue;
  errors.push({ to, sources: [...new Set(sources)] });
}

const NAV_IGNORE_UNUSED = new Set([
  "/api/public/auth/token",
  "/api/public/auth/recover",
  "/forbidden",
  "/forgot-password",
  "/reset-password",
  "/mentions-legales",
  "/politique-confidentialite",
  "/me/role",
  "/_authenticated",
]);
const referenced = new Set(refs.keys());
const unused = [];
for (const r of definedRoutes) {
  if (NAV_IGNORE_UNUSED.has(r)) continue;
  if (r.startsWith("/_authenticated")) continue; // accédées via guard
  if (r.startsWith("/api/")) continue;
  if (referenced.has(r)) continue;
  unused.push(r);
}

let exitCode = 0;
if (errors.length) {
  exitCode = 1;
  console.error("\n[check-routes] ❌ Références vers des routes inexistantes :\n");
  for (const e of errors) {
    console.error(`  • ${e.to}`);
    for (const s of e.sources) console.error(`      ↳ ${s}`);
  }
}
if (unused.length) {
  console.warn("\n[check-routes] ⚠️  Routes définies mais jamais référencées dans la nav :\n");
  for (const u of unused) console.warn(`  • ${u}`);
}
if (!errors.length && !unused.length) {
  console.log(`[check-routes] ✅ ${definedRoutes.size} routes, ${refs.size} références — tout est cohérent.`);
}

process.exit(exitCode);
