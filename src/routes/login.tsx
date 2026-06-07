import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Connexion — ANSUT EVENT" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Connexion réussie");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthLayout
      eyebrow="SUTEL 2026"
      headline={
        <>
          Bienvenue sur la plateforme
          <br />
          événementielle de l'ANSUT.
        </>
      }
      description="Gérez vos inscriptions, accréditations, badges QR et analytics en temps réel."
      highlights={
        <div className="grid gap-3 text-sm text-white/80">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            Connexion sécurisée et chiffrée
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-secondary" />
            Accès à toutes les fonctionnalités SUTEL 2026
          </div>
        </div>
      }
      title="Connexion"
      subtitle="Accédez à votre espace de gestion SUTEL 2026."
      footer={
        <>
          Pas de compte ?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="vous@ansut.ci"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Connexion..." : (
            <>
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
