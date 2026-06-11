/**
 * REDIRECT 301 — /agenda/:slug → /e/:slug/agenda
 *
 * Ancienne route plate. Les participants avaient ce lien dans les emails/calendriers.
 * On redirige définitivement vers la nouvelle structure nested.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agenda/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/e/$slug/agenda", params });
  },
  component: function AgendaRedirect() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirection…</p>
      </div>
    );
  },
});
