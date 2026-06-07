import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnsutLogo } from "@/components/ansut/Logo";

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
      toast.error("Identifiants incorrects. Veuillez réessayer.");
      return;
    }
    toast.success("Connexion réussie");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-dvh">
      {/* LEFT — Branded navy panel */}
      <div
        className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-secondary/15 blur-[120px]" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <AnsutLogo size="lg" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">ANSUT EVENT</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Console de gestion
            </div>
          </div>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white">
            Pilotez vos événements
            <br />
            <span className="text-secondary">en toute confiance.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            Accédez à votre console de gestion pour gérer les inscriptions, accréditations,
            conférences et analytics du SUTEL 2026.
          </p>

          <div className="mt-10 space-y-5">
            <FeatureItem icon={ShieldCheck} text="Sécurité renforcée et contrôle d'accès par rôles" />
            <FeatureItem icon={Zap} text="Données en temps réel et notifications instantanées" />
            <FeatureItem icon={BarChart3} text="Tableaux de bord analytiques pour la Direction" />
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} ANSUT — Tous droits réservés
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <AnsutLogo size="md" />
              <span className="font-display text-sm font-bold">ANSUT EVENT</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Adresse email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-bold"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-border bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              En cas de difficulté, contactez l'administrateur de votre organisation ou la DTDI de l'ANSUT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4 text-secondary" />
      </div>
      <span className="text-sm leading-relaxed text-white/80">{text}</span>
    </div>
  );
}
