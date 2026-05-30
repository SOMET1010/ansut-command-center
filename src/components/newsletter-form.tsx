import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

export function NewsletterForm({ source = "landing" }: { source?: string }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await subscribe({ data: { email, source } });
      if (!res.ok) {
        toast.error(res.error);
        setState("idle");
        return;
      }
      toast.success("Inscription confirmée. Vérifiez votre boîte mail.");
      setState("done");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur réseau");
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

      {state === "done" ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Merci ! Un email de confirmation vous a été envoyé.
        </div>
      ) : (
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
      )}
    </form>
  );
}
