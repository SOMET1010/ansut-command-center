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
  const { status, data } = useMyRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "ready" && !data?.isSuperAdmin) {
      navigate({ to: "/forbidden", replace: true });
    } else if (status === "error") {
      navigate({ to: "/forbidden", replace: true });
    }
  }, [status, data, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Vérification des droits…</p>
      </div>
    );
  }

  if (status !== "ready" || !data?.isSuperAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Redirection vers la page « Accès refusé »…
        </div>
        <div className="sr-only">
          <Link to="/forbidden">Aller à la page Accès refusé</Link>
          <Button asChild variant="ghost">
            <Link to="/dashboard">Tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
