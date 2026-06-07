import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/auth-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — ANSUT EVENT" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    try {
      if (isLovablePreview()) {
        // Bypass the preview's fetch proxy via same-origin server route.
        const res = await fetch("/api/public/auth/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, redirectTo }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.msg || j.error || "Échec de l'envoi");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
      }
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi");
      return;
    }
    setLoading(false);
    setSent(true);
    toast.success("E-mail de réinitialisation envoyé");
  }

  return (
    <AuthLayout
      eyebrow="Réinitialisation"
      headline={
        <>
          Récupérez l'accès à
          <br />
          votre compte ANSUT.
        </>
      }
      description="Saisissez votre adresse e-mail : nous vous enverrons un lien sécurisé pour définir un nouveau mot de passe."
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien de réinitialisation par e-mail."
      footer={
        <>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Mail className="h-4 w-4" />
            E-mail envoyé
          </div>
          <p className="mt-2 text-muted-foreground">
            Si un compte existe pour <span className="font-medium text-foreground">{email}</span>,
            vous recevrez un lien de réinitialisation dans quelques instants. Pensez à vérifier vos spams.
          </p>
        </div>
      ) : (
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
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Envoi..." : (
              <>
                Envoyer le lien
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
