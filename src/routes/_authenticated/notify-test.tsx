import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { sendAdminTestNotification } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/notify-test")({
  head: () => ({ meta: [{ title: "Test notifications — ANSUT EVENT" }] }),
  component: NotifyTestPage,
});

type Channel = "sms" | "email" | "whatsapp" | "telegram";

const PLACEHOLDERS: Record<Channel, string> = {
  sms: "+225 07 09 75 32 32",
  email: "destinataire@ansut.ci",
  whatsapp: "+225 07 09 75 32 32",
  telegram: "Chat ID (ex: 123456789)",
};

function NotifyTestPage() {
  const [channel, setChannel] = useState<Channel>("sms");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Test ANSUT EVENT");
  const [text, setText] = useState("Ceci est un test depuis le cockpit ANSUT EVENT.");

  const sendFn = useServerFn(sendAdminTestNotification);
  const mutation = useMutation({
    mutationFn: () =>
      sendFn({
        data: {
          channel,
          to: to.trim(),
          text: text.trim(),
          subject: channel === "email" ? subject.trim() || undefined : undefined,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Notification envoyée — voir le journal d'audit");
      } else {
        toast.error(res.error ?? "Échec de l'envoi");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !text.trim()) {
      toast.error("Destinataire et message obligatoires");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Test notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envoyez un message de test via la passerelle ANSUT Hub. Chaque envoi est journalisé dans
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">audit_trail</code>.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau test</CardTitle>
          <CardDescription>
            SMS / Email / WhatsApp / Telegram — chaîne complète Hub → audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp (texte libre)</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">
                {channel === "email"
                  ? "Adresse e-mail"
                  : channel === "telegram"
                    ? "Chat ID Telegram"
                    : "Numéro de téléphone (E.164)"}
              </Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={PLACEHOLDERS[channel]}
                required
              />
            </div>

            {channel === "email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {text.length} / 1000 caractères
                {channel === "sms" && text.length > 160 && (
                  <span className="ml-2 text-warning">
                    Sera découpé en plusieurs SMS au-delà de 160 caractères.
                  </span>
                )}
              </p>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Envoi..." : "Envoyer le test"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>WhatsApp</strong> : ce formulaire envoie en mode texte libre (réservé aux
            sessions ouvertes &lt; 24h). Pour un premier contact, créez un template approuvé
            côté Hub gouv.ci.
          </p>
          <p>
            • <strong>SMS</strong> : l'expéditeur affiché sera <code>ANSUT</code> (sender
            alphanumérique).
          </p>
          <p>
            • Les destinataires sont masqués dans le journal d'audit (RGPD).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
