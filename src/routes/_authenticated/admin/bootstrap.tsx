import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/bootstrap")({
  head: () => ({ meta: [{ title: "Bootstrap — ANSUT EVENT" }] }),
  component: AdminBootstrap,
});

function AdminBootstrap() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    supabase.rpc("super_admin_exists").then(({ data }) => setAdminExists(Boolean(data)));
  }, []);

  useEffect(() => {
    if (loading || adminExists === null) return;
    if (adminExists && !roles.includes("super_admin")) {
      navigate({ to: "/forbidden", replace: true });
    }
  }, [loading, adminExists, roles, navigate]);

  async function claim() {
    setClaiming(true);
    const { error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vous êtes désormais super administrateur.");
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuration initiale</h1>
        <p className="text-muted-foreground mt-1">Paramétrage du premier administrateur de la plateforme.</p>
      </div>

      <div className="max-w-xl">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>

          <h2 className="mt-5 text-lg font-bold">Rôle super administrateur</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecté en tant que <span className="font-semibold">{user?.email}</span>
          </p>

          <div className="mt-6">
            {roles.includes("super_admin") ? (
              <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Déjà configuré</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vous disposez du rôle super administrateur.
                  </p>
                </div>
              </div>
            ) : adminExists === null ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">Vérification...</span>
              </div>
            ) : adminExists ? (
              <div className="flex items-start gap-3 rounded-xl bg-yellow-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Accès restreint</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Un super administrateur existe déjà. Contactez-le pour obtenir des droits.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Aucun super administrateur n'existe encore. Cliquez ci-dessous pour vous attribuer
                  ce rôle. Cette action est <span className="font-semibold">unique et irréversible</span>.
                </p>
                <Button className="w-full rounded-xl" onClick={claim} disabled={claiming}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {claiming ? "Configuration..." : "Devenir super administrateur"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}