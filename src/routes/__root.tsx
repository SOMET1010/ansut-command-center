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

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
  const pathname = activeMatch?.pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  // Debug panel: DEV only. No production escape hatch (anciennement ?debug=1)
  // pour éviter d'exposer stack traces et IDs de routes internes.
  const isDebug = import.meta.env.DEV;

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
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>

        {isDebug && (
          <details
            open
            className="mt-8 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-left"
          >
            <summary className="cursor-pointer text-sm font-semibold text-destructive">
              Debug details ({error.name || "Error"})
            </summary>
            <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="font-medium text-muted-foreground">Route ID</dt>
              <dd className="font-mono break-all">{routeId}</dd>
              <dt className="font-medium text-muted-foreground">Pathname</dt>
              <dd className="font-mono break-all">{pathname}</dd>
              <dt className="font-medium text-muted-foreground">Match chain</dt>
              <dd className="font-mono break-all">
                {matches.map((m) => m.routeId).join(" → ") || "(none)"}
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
              Debug panel visible en développement uniquement.
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
      { title: "Lovable App" },
      { name: "description", content: "ANSUT Command Center is a web application for managing events, check-ins, and user subscriptions." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "ANSUT Command Center is a web application for managing events, check-ins, and user subscriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "ANSUT Command Center is a web application for managing events, check-ins, and user subscriptions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5b1cdede-1142-4660-889c-cda8bb333254/id-preview-da12807a--66dc7aca-dae4-45b7-807c-65e4f402042b.lovable.app-1780855744955.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5b1cdede-1142-4660-889c-cda8bb333254/id-preview-da12807a--66dc7aca-dae4-45b7-807c-65e4f402042b.lovable.app-1780855744955.png" },
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
    <html lang="en">
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
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
