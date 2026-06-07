import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useMyRole } from "@/hooks/useMyRole";
import { Button } from "@/components/ui/button";

/**
 * Inline guard — renders `children` only when the current user is super_admin.
 * Use to hide buttons, links, menu entries, or whole sections.
 *
 * ```tsx
 * <IfSuperAdmin>
 *   <Button onClick={publish}>Publier</Button>
 * </IfSuperAdmin>
 * ```
 */
export function IfSuperAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { status, data } = useMyRole();
  if (status !== "ready") return null;
  if (!data.isSuperAdmin) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Page guard — blocks an entire page when the user isn't super_admin.
 * Shows a friendly 403 with a link back home while the role loads silently.
 */
export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { status, data, error } = useMyRole();

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Vérification des droits…</p>
      </div>
    );
  }

  if (status === "error" || !data?.isSuperAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette page est réservée aux super administrateurs.
            {status === "error" && error ? ` (${error})` : ""}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link to="/dashboard">Retour au tableau de bord</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/me/role">Voir mon rôle</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
