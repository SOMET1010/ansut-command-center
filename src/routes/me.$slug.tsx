/**
 * REDIRECT 301 — /me/:slug → /e/:slug/profil
 *
 * Ancienne route plate. On redirige vers la nouvelle structure nested.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/me/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/e/$slug/profil", params });
  },
  component: function MeRedirect() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirection…</p>
      </div>
    );
  },
});
