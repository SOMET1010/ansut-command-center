import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/auth-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";
import { RequiredMark } from "@/components/ansut/RequiredMark";
import { loginSchema, zodFieldErrors } from "@/lib/auth-schemas";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Connexion — ANSUT EVENT" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    // M-12 Validation Zod
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    const data = parsed.data;

    setLoading(true);
    try {
      if (isLovablePreview()) {
        const res = await fetch("/api/public/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error_description || json.msg || "Connexion impossible");
        const { error } = await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Connexion impossible");
      return;
    }
    setLoading(false);
    toast.success("Connexion réussie");
    // Lot 1 Phase 4.1 — redirection post-login par rôle.
    // super_admin / org_admin → /dashboard (Cockpit)
    // staff                   → /checkin
    // participant / autre     → /me/role (qui affichera son contexte)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let target: "/dashboard" | "/checkin" | "/me/role" = "/me/role";
      if (user) {
        const { data: rolesRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roles = (rolesRows ?? []).map((r) => r.role as string);
        if (roles.includes("super_admin") || roles.includes("org_admin")) {
          target = "/dashboard";
        } else if (roles.includes("staff")) {
          target = "/checkin";
        }
      }
      navigate({ to: target });
    } catch {
      navigate({ to: "/dashboard" });
    }
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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail
            <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="vous@ansut.ci"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Mot de passe
              <RequiredMark />
            </Label>
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.password}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? (
            "Connexion..."
          ) : (
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
