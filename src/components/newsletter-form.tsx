import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

type Result =
  | { kind: "success"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "error"; message: string };

export function NewsletterForm({ source = "landing" }: { source?: string }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setResult(null);
    try {
      const res = await subscribe({ data: { email, source } });

      if (!res.ok) {
        toast.error(res.error);
        setResult({ kind: "error", message: res.error });
        setState("idle");
        return;
      }

      if (res.emailStatus === "sent") {
        const msg = "Inscription confirmée. Un email vient de vous être envoyé.";
        toast.success(msg);
        setResult({ kind: "success", message: msg });
      } else {
        const msg =
          "Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé. Nous reviendrons vers vous.";
        toast.warning(msg);
        setResult({ kind: "warning", message: msg });
      }

      setState("done");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg);
      setResult({ kind: "error", message: msg });
      setState("idle");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center rounded-2xl bg-card p-6 shadow-sm"
    >
      <h3 className="text-lg font-bold">Restez informé</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Recevez les dernières actualités, mises à jour et annonces du SUTEL.
      </p>

      {state === "done" && result ? (
        <div
          role="status"
          aria-live="polite"
          className={
            "mt-4 flex items-start gap-2 rounded-lg p-3 text-sm " +
            (result.kind === "success"
              ? "bg-primary/5 text-primary"
              : result.kind === "warning"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "bg-destructive/10 text-destructive")
          }
        >
          {result.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.message}</span>
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
