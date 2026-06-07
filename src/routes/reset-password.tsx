import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nouveau mot de passe — ANSUT EVENT" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Supabase places the recovery token in the URL hash and emits PASSWORD_RECOVERY.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = hash.includes("type=recovery");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Fallback: if the hash says recovery, allow the form even before the event fires.
    if (isRecovery) setReady(true);

    // If neither hash nor event fires shortly, surface a friendly error.
    const timeout = setTimeout(() => {
      if (!isRecovery) {
        setLinkError("Lien invalide ou expiré. Veuillez redemander un e-mail de réinitialisation.");
      }
    }, 800);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/login" });
  }

  return (
    <AuthLayout
      eyebrow="Sécurité du compte"
      headline={
        <>
          Définissez un nouveau
          <br />
          mot de passe sécurisé.
        </>
      }
      description="Choisissez un mot de passe robuste : au moins 6 caractères, idéalement avec chiffres et symboles."
      highlights={
        <div className="flex items-center gap-3 text-sm text-white/80">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          Lien de réinitialisation sécurisé et à usage unique
        </div>
      }
      title="Nouveau mot de passe"
      subtitle="Saisissez et confirmez votre nouveau mot de passe."
      footer={
        <>
          Retour à la{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            connexion
          </Link>
        </>
      }
    >
      {linkError && !ready ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-foreground">
          <p className="font-semibold text-destructive">Lien non valide</p>
          <p className="mt-2 text-muted-foreground">{linkError}</p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Redemander un lien <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              placeholder="Retapez le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11"
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={loading || (!ready && !linkError)}
          >
            {loading ? "Mise à jour..." : (
              <>
                Mettre à jour
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
