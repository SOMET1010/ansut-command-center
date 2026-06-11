/**
 * REDIRECT 301 — /salon/:slug → /e/:slug/annonces
 *
 * Ancienne route plate (Infos pratiques + Annonces + Sondages).
 * On redirige vers la nouvelle structure nested.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/salon/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/e/$slug/annonces", params });
  },
  component: function SalonRedirect() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirection…</p>
      </div>
    );
  },
});
