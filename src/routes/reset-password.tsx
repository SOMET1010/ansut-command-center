import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/ansut/AuthLayout";
import { RequiredMark } from "@/components/ansut/RequiredMark";
import { resetPasswordSchema, zodFieldErrors } from "@/lib/auth-schemas";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nouveau mot de passe — ANSUT EVENT" }] }),
  component: ResetPasswordPage,
});

type LinkState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "invalid"; title: string; message: string };

/**
 * Map Supabase recovery errors (returned in the URL hash or by updateUser)
 * to clear French messages. Single-use is enforced server-side: once a
 * recovery token has been consumed, Supabase returns access_denied / otp_expired.
 */
function describeAuthError(
  code: string | null,
  description: string | null,
): {
  title: string;
  message: string;
} {
  const c = (code ?? "").toLowerCase();
  const d = (description ?? "").toLowerCase();

  if (c === "otp_expired" || d.includes("expired")) {
    return {
      title: "Lien expiré",
      message:
        "Ce lien de réinitialisation a expiré (valide 1 heure). Demandez un nouvel e-mail pour continuer.",
    };
  }
  if (c === "access_denied" || d.includes("invalid") || d.includes("used")) {
    return {
      title: "Lien déjà utilisé",
      message:
        "Ce lien a déjà été utilisé ou n'est plus valide. Les liens de réinitialisation sont à usage unique — demandez-en un nouveau.",
    };
  }
  if (c === "same_password" || d.includes("should be different")) {
    return {
      title: "Mot de passe identique",
      message: "Le nouveau mot de passe doit être différent de l'ancien. Choisissez-en un autre.",
    };
  }
  if (c === "weak_password" || d.includes("weak") || d.includes("pwned")) {
    return {
      title: "Mot de passe trop faible",
      message:
        "Ce mot de passe est trop faible ou compromis. Choisissez une combinaison plus longue avec chiffres et symboles.",
    };
  }
  return {
    title: "Lien invalide",
    message:
      description || "Le lien de réinitialisation n'est pas valide. Veuillez redemander un e-mail.",
  };
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<LinkState>({ status: "checking" });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);

    // Error returned directly by Supabase in the redirect URL
    const errorCode = params.get("error_code") ?? params.get("error");
    const errorDesc = params.get("error_description");
    if (errorCode || errorDesc) {
      const { title, message } = describeAuthError(errorCode, errorDesc);
      setLink({ status: "invalid", title, message });
      return;
    }

    const type = params.get("type");
    const hasToken = params.has("access_token") || params.has("token");

    // Subscribe to PASSWORD_RECOVERY (fires once Supabase consumes the token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setLink({ status: "ready" });
    });

    if (type === "recovery" || hasToken) {
      // Token present — let Supabase parse it. We unlock the form optimistically.
      setLink({ status: "ready" });
    } else {
      // No token and no error — direct visit, not from an email link
      setLink({
        status: "invalid",
        title: "Accès direct détecté",
        message:
          "Cette page n'est accessible qu'à partir du lien reçu par e-mail. Demandez un lien de réinitialisation pour continuer.",
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // M-12 Validation Zod (mot de passe + confirmation)
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fieldErrors = zodFieldErrors(parsed.error);
      setFormError(fieldErrors.password || fieldErrors.confirm || "Formulaire invalide.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const code = (error as { code?: string }).code ?? null;
      const { title, message } = describeAuthError(code, error.message);

      // Token-related errors → block the form, prompt for a fresh link
      const tokenIssue =
        code === "otp_expired" ||
        code === "access_denied" ||
        /expired|invalid|used|session/i.test(error.message);

      if (tokenIssue) {
        setLink({ status: "invalid", title, message });
      } else {
        setFormError(message);
      }
      toast.error(title);
      return;
    }

    toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const invalid = link.status === "invalid";
  const checking = link.status === "checking";

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
          Lien de réinitialisation sécurisé, à usage unique et valide 1 heure
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
      {invalid ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-foreground"
        >
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <AlertCircle className="h-4 w-4" />
            {link.title}
          </div>
          <p className="mt-2 text-muted-foreground">{link.message}</p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Demander un nouveau lien <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">
              Nouveau mot de passe
              <RequiredMark />
            </Label>
            <Input
              id="password"
              type="password"
              required
              autoFocus
              minLength={6}
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              autoComplete="new-password"
              aria-invalid={!!formError}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Confirmer le mot de passe
              <RequiredMark />
            </Label>
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
              aria-invalid={!!formError}
            />
          </div>

          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={loading || checking}
          >
            {loading ? (
              "Mise à jour..."
            ) : checking ? (
              "Vérification du lien..."
            ) : (
              <>
                Mettre à jour le mot de passe
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
