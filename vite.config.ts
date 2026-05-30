// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Plugin de debug : journalise en clair les erreurs de compilation TanStack
 * (router-plugin, server-fn, code-splitter, etc.) avec fichier + ligne + colonne.
 *
 * Les erreurs de parse Babel embarquent normalement `loc: { line, column }` et
 * un `id` de module, mais Vite les agrège dans une stack peu lisible. Ce plugin
 * affiche un bloc unique facile à scanner dans les logs du dev-server.
 */
function tanstackCompileErrorLogger(): Plugin {
  const isTanstackPlugin = (pluginName?: string) =>
    !!pluginName && /tanstack|router|start|server-fn|code-splitt/i.test(pluginName);

  const format = (err: unknown, file?: string) => {
    const e = err as {
      message?: string;
      plugin?: string;
      id?: string;
      loc?: { file?: string; line?: number; column?: number };
      pos?: number;
      frame?: string;
      stack?: string;
    };
    const loc = e.loc;
    const path = loc?.file || e.id || file || "(unknown file)";
    const line = loc?.line ?? "?";
    const col = loc?.column ?? "?";
    const plugin = e.plugin ?? "(unknown plugin)";

    const lines = [
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      `🛑 TanStack compile error  [plugin: ${plugin}]`,
      `   ${path}:${line}:${col}`,
      `   ${e.message ?? "(no message)"}`,
    ];
    if (e.frame) lines.push("", e.frame);
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "");
    return lines.join("\n");
  };

  return {
    name: "lovable:tanstack-compile-error-logger",
    apply: "serve",
    enforce: "post",
    handleHotUpdate({ file }) {
      // hook noop — kept for completeness/symmetry
      return undefined;
    },
    configureServer(server) {
      // Intercepte toutes les erreurs émises par les plugins (transform/load/etc.)
      server.middlewares.use((_req, _res, next) => next());
      const origError = server.config.logger.error.bind(server.config.logger);
      server.config.logger.error = (msg, opts) => {
        const err = opts?.error as { plugin?: string } | undefined;
        if (err && isTanstackPlugin(err.plugin)) {
          // eslint-disable-next-line no-console
          console.error(format(err));
        }
        return origError(msg, opts);
      };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [tanstackCompileErrorLogger()],
  },
});
