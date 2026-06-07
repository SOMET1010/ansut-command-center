import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT — Branded navy panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-secondary/25 blur-[120px]" />

        <Link to="/" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-xl font-bold text-secondary-foreground shadow-lg">
            A
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">ANSUT EVENT</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Plateforme officielle du SUTEL
            </div>
          </div>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              SUTEL 2026
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white">
            Bienvenue sur la plateforme
            <br />
            événementielle de l'ANSUT.
          </h2>
          <p className="mt-4 max-w-md text-base text-white/75">
            Gérez vos inscriptions, accréditations, badges QR et analytics en temps réel.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Connexion sécurisée et chiffrée
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-secondary" />
              Accès à toutes les fonctionnalités SUTEL 2026
            </div>
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          © 2026 ANSUT. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              A
            </div>
            <span className="text-lg font-semibold">ANSUT EVENT</span>
          </Link>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Connexion
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accédez à votre espace de gestion SUTEL 2026.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              <Label htmlFor="password">Mot de passe</Label>
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

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas de compte ?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
