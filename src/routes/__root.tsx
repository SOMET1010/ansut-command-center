import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useMatches,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ConfirmRoot } from "@/components/ui/confirm-dialog";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { OfficialBanner, OfficialFooter } from "../components/OfficialMention";
import { CookieConsent } from "../components/CookieConsent";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const matches = useMatches();
  const activeMatch = matches[matches.length - 1];
  const routeId = activeMatch?.routeId ?? "(unknown)";
  const pathname =
    activeMatch?.pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const isDebug =
    import.meta.env.DEV ||
    (typeof window !== "undefined" && window.location.search.includes("debug=1"));

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
      routeId,
      pathname,
    });
  }, [error, routeId, pathname]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu être chargée
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>

        {isDebug && (
          <details
            open
            className="mt-8 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-left"
          >
            <summary className="cursor-pointer text-sm font-semibold text-destructive">
              Détails de débogage ({error.name || "Error"})
            </summary>
            <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="font-medium text-muted-foreground">Route ID</dt>
              <dd className="font-mono break-all">{routeId}</dd>
              <dt className="font-medium text-muted-foreground">Chemin</dt>
              <dd className="font-mono break-all">{pathname}</dd>
              <dt className="font-medium text-muted-foreground">Chaîne</dt>
              <dd className="font-mono break-all">
                {matches.map((m) => m.routeId).join(" → ") || "(aucune)"}
              </dd>
              <dt className="font-medium text-muted-foreground">Message</dt>
              <dd className="font-mono break-all text-destructive">{error.message}</dd>
            </dl>
            {error.stack && (
              <pre className="mt-3 max-h-72 overflow-auto rounded bg-background/60 p-3 text-[11px] leading-relaxed text-foreground">
                {error.stack}
              </pre>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              Ajoutez <code className="font-mono">?debug=1</code> à l'URL pour afficher ce panneau
              en production.
            </p>
          </details>
        )}
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ANSUT EVENT — Plateforme événementielle officielle" },
      {
        name: "description",
        content:
          "Plateforme de gestion événementielle de l'Agence Nationale du Service Universel des Télécommunications (ANSUT).",
      },
      { name: "author", content: "ANSUT — DTDI" },
      { property: "og:title", content: "ANSUT EVENT — Plateforme événementielle officielle" },
      {
        property: "og:description",
        content: "Gérez vos événements, inscriptions et check-ins avec la plateforme ANSUT EVENT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@ansut_ci" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* M-24 — Skip link global (visible au focus clavier uniquement) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
      <div className="flex min-h-dvh flex-col">
        <OfficialBanner />
        <div className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <OfficialFooter />
      </div>
      <CookieConsent />
      <Toaster richColors position="top-right" />
      <ConfirmRoot />
    </QueryClientProvider>
  );
}
