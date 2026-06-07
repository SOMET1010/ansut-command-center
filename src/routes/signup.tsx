import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";

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
        emailRedirectTo: `${window.location.origin}/me/role`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé. Vérification de votre rôle…");
    navigate({ to: "/me/role" });
  }

  return (
    <AuthLayout
      eyebrow="Rejoignez SUTEL 2026"
      headline={
        <>
          Créez votre compte et préparez
          <br />
          votre événement.
        </>
      }
      description="En quelques clics, accédez à toutes les fonctionnalités de la plateforme officielle ANSUT."
      highlights={
        <ul className="space-y-3">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm text-white/85">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              {p}
            </li>
          ))}
        </ul>
      }
      title="Créer un compte"
      subtitle="Rejoignez la plateforme officielle du SUTEL 2026."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
    </AuthLayout>
  );
}
