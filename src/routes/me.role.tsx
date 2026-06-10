import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, RefreshCw, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { isLovablePreview } from "@/lib/auth-preview";

export const Route = createFileRoute("/me/role")({
  head: () => ({ meta: [{ title: "Mon rôle — ANSUT EVENT" }] }),
  // Guard: route protégée — sans session on renvoie vers /login.
  ssr: false,
  beforeLoad: async () => {
    const user = isLovablePreview()
      ? (await supabase.auth.getSession()).data.session?.user
      : (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: MyRolePage,
});

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; email: string; userId: string; roles: string[] };

function MyRolePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  async function load() {
    setState({ status: "loading" });
    const user = isLovablePreview()
      ? (await supabase.auth.getSession()).data.session?.user
      : (await supabase.auth.getUser()).data.user;
    if (!user) {
      setState({ status: "anonymous" });
      return;
    }
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (error) {
      setState({
        status: "ready",
        email: user.email ?? "",
        userId: user.id,
        roles: [],
      });
      return;
    }
    setState({
      status: "ready",
      email: user.email ?? "",
      userId: user.id,
      roles: (roles ?? []).map((r) => r.role as string),
    });
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Vérification de votre rôle…</p>
      </div>
    );
  }

  if (state.status === "anonymous") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">Non connecté</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous ou créez un compte pour voir votre rôle.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" /> Se connecter
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/signup">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSuper = state.roles.includes("super_admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          {isSuper ? (
            <ShieldCheck className="h-10 w-10 text-primary" />
          ) : (
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <h1 className="text-xl font-bold">
              {isSuper ? "Vous êtes super_admin ✅" : "Compte standard"}
            </h1>
            <p className="text-sm text-muted-foreground">{state.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{state.userId}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Rôles ({state.roles.length})</span>
            <span className="font-mono text-xs">
              {state.roles.length === 0 ? "—" : state.roles.join(", ")}
            </span>
          </div>
        </div>

        {!isSuper && (
          <p className="mt-4 text-xs text-muted-foreground">
            Si vous venez de vous inscrire avec un email présent dans la liste blanche ANSUT et que
            le rôle n'apparaît pas, cliquez sur « Actualiser ».
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={load} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login" });
            }}
            variant="ghost"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
