import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/setup")({
  head: () => ({ meta: [{ title: "Configuration administrateur — ANSUT EVENT" }] }),
  component: AdminSetup,
});

function AdminSetup() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    supabase.rpc("super_admin_exists").then(({ data }) => setAdminExists(Boolean(data)));
  }, []);

  async function claim() {
    setClaiming(true);
    const { error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vous êtes désormais super administrateur. Reconnectez-vous pour activer.");
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Configuration initiale</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecté en tant que <strong>{user?.email}</strong>.
        </p>

        {roles.includes("super_admin") ? (
          <p className="mt-6 rounded-md bg-primary/10 p-4 text-sm text-primary">
            Vous êtes déjà super administrateur.
          </p>
        ) : adminExists === null ? (
          <p className="mt-6 text-muted-foreground">Vérification...</p>
        ) : adminExists ? (
          <p className="mt-6 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            Un super administrateur est déjà configuré. Contactez-le pour obtenir des droits.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm">
              Aucun super administrateur n'existe encore. Cliquez ci-dessous pour vous attribuer
              ce rôle. Cette action est unique.
            </p>
            <Button className="mt-6" onClick={claim} disabled={claiming}>
              {claiming ? "Configuration..." : "Devenir super administrateur"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
