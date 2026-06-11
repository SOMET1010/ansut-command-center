/**
 * REDIRECT 301 — /networking/:slug → /e/:slug/reseau
 *
 * Ancienne route plate. On redirige vers la nouvelle structure nested.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/networking/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/e/$slug/reseau", params });
  },
  component: function NetworkingRedirect() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirection…</p>
      </div>
    );
  },
});
