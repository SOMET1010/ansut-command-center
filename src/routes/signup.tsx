import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnsutLogo } from "@/components/ansut/Logo";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Créer un compte — ANSUT EVENT" }] }),
  component: SignupPage,
});

const perks = [
  "Inscription en ligne au SUTEL 2026",
  "Génération automatique de votre badge QR",
  "Accès au programme et au live polling",
  "Tableaux de bord et statistiques en temps réel",
];

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé. Bienvenue !");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
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
          <AnsutLogo size="lg" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">EVENT</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/75">
              Plateforme officielle du SUTEL
            </div>
          </div>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Rejoignez SUTEL 2026
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white">
            Créez votre compte et préparez
            <br />
            votre événement.
          </h2>
          <p className="mt-4 max-w-md text-base text-white/75">
            En quelques clics, accédez à toutes les fonctionnalités de la plateforme officielle ANSUT.
          </p>

          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/60">
          © 2026 ANSUT. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <AnsutLogo size="md" />
            <span className="text-lg font-semibold">EVENT</span>
          </Link>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Créer un compte
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rejoignez la plateforme officielle du SUTEL 2026.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                required
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
              />
            </div>
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
                minLength={6}
                placeholder="6 caractères minimum"
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
              {loading ? "Création..." : (
                <>
                  Créer mon compte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
