import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
  head: () => ({ meta: [{ title: "Accès refusé — ANSUT EVENT" }] }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">403 — Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page est réservée aux super administrateurs. Si vous pensez qu'il
          s'agit d'une erreur, contactez l'administrateur du système.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/dashboard">Tableau de bord</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/me/role">Voir mon rôle</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">Accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
