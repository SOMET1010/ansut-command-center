import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

type Result =
  | { kind: "success"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "error"; message: string };

const MAX_RESEND_ATTEMPTS = 3;

export function NewsletterForm({ source = "landing" }: { source?: string }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [resending, setResending] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  function applyResult(
    res: Awaited<ReturnType<typeof subscribe>>,
    attempt: number,
  ) {
    if (!res.ok) {
      const msg = res.error;
      toast.error(msg);
      setResult({ kind: "error", message: msg });
      return;
    }

    if (res.emailStatus === "sent") {
      const msg =
        attempt > 0
          ? `Email renvoyé avec succès (tentative ${attempt}/${MAX_RESEND_ATTEMPTS}).`
          : "Inscription confirmée. Un email vient de vous être envoyé.";
      toast.success(msg);
      setResult({ kind: "success", message: msg });
    } else {
      const reason = res.emailError ? ` (${res.emailError})` : "";
      const msg =
        attempt > 0
          ? `Échec de la tentative ${attempt}/${MAX_RESEND_ATTEMPTS}${reason}.`
          : `Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé${reason}.`;
      toast.warning(msg);
      setResult({ kind: "warning", message: msg });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setResult(null);
    setResendAttempts(0);
    try {
      const res = await subscribe({ data: { email, source } });
      applyResult(res, 0);
      if (res.ok) {
        setSubmittedEmail(email);
        setEmail("");
        setState("done");
      } else {
        setState("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg);
      setResult({ kind: "error", message: msg });
      setState("idle");
    }
  }

  async function handleResend() {
    if (!submittedEmail || resending) return;
    if (resendAttempts >= MAX_RESEND_ATTEMPTS) return;

    const nextAttempt = resendAttempts + 1;
    setResending(true);
    try {
      const res = await subscribe({
        data: { email: submittedEmail, source: `${source}-resend` },
      });
      setResendAttempts(nextAttempt);
      applyResult(res, nextAttempt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg);
      setResult({ kind: "error", message: msg });
      setResendAttempts(nextAttempt);
    } finally {
      setResending(false);
    }
  }

  const canResend =
    state === "done" &&
    result?.kind === "warning" &&
    resendAttempts < MAX_RESEND_ATTEMPTS;

  const exhausted =
    state === "done" &&
    result?.kind === "warning" &&
    resendAttempts >= MAX_RESEND_ATTEMPTS;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center rounded-2xl bg-card p-6 shadow-sm"
    >
      {/* Titre et description gérés par la section parente dans index.tsx */}

      {state === "done" && result ? (
        <div className="mt-4 space-y-3">
          <div
            role="status"
            aria-live="polite"
            className={
              "flex items-start gap-2 rounded-lg p-3 text-sm " +
              (result.kind === "success"
                ? "bg-primary/5 text-primary"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300")
            }
          >
            {result.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>

          {canResend && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Tentatives utilisées : {resendAttempts}/{MAX_RESEND_ATTEMPTS}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                Renvoyer l'email
              </Button>
            </div>
          )}

          {exhausted && (
            <p className="text-xs text-muted-foreground">
              Nombre maximum de tentatives atteint ({MAX_RESEND_ATTEMPTS}/
              {MAX_RESEND_ATTEMPTS}). Contactez-nous si le problème persiste.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <Input
              type="email"
              required
              maxLength={255}
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "loading"}
            />
            <Button type="submit" disabled={state === "loading"}>
              {state === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              S'abonner
            </Button>
          </div>
          {result?.kind === "error" && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}
        </>
      )}
    </form>
  );
}
