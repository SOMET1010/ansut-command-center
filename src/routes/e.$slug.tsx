import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Calendar, MapPin, CheckCircle2, IdCard, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendHubMessage, buildRegistrationTemplateParams } from "@/lib/notifications.functions";
import { downloadBadge } from "@/lib/badges";
import { AnsutLogo } from "@/components/ansut/Logo";


export const Route = createFileRoute("/e/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Inscription — ${params.slug} | ANSUT EVENT` },
      { name: "description", content: "Inscrivez-vous à cet événement ANSUT." },
    ],
  }),
  component: PublicEventPage,
});

type PublicEvent = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  cover_url: string | null;
  status: string;
};

function PublicEventPage() {
  const { slug } = Route.useParams();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [downloadingBadge, setDownloadingBadge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", organization: "", position: "",
  });


  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        setEvent(data as PublicEvent | null);
        setLoading(false);
      });
  }, [slug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    const { data: token, error } = await supabase.rpc("register_for_event", {
      p_event_id: event.id,
      p_full_name: form.full_name,
      p_email: form.email,
      p_phone: form.phone,
      p_organization: form.organization,
      p_position: form.position,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        toast.error("Cet email est déjà inscrit à cet événement.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setQrToken(token as string);


    // Confirmation WhatsApp (best-effort, ne bloque pas l'UI)
    if (form.phone.trim()) {
      const params = buildRegistrationTemplateParams({
        fullName: form.full_name,
        eventName: event.name,
        startsAt: event.starts_at,
        location: event.location,
      });
      const fallbackText = `Bonjour ${params[0]}, votre inscription à "${params[1]}" est confirmée.\nDate : ${params[2]}\nLieu : ${params[3]}\n\nMerci — ANSUT EVENT.`;
      sendHubMessage({
        data: {
          to: form.phone.replace(/\s+/g, ""),
          channel: "WhatsApp",
          content: fallbackText,
          template: {
            name: "ansut_event_confirmation",
            languageCode: "fr",
            parameters: params,
          },
        },
      }).catch((err) => console.warn("Hub notify failed", err));
    }

    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex flex-col items-center gap-3">
          <AnsutLogo size="lg" />
          <p className="text-sm font-medium text-white/80">Chargement...</p>
        </div>
      </div>
    );
  }
  if (!event) {
    throw notFound();
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header institutionnel */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <AnsutLogo size="md" />
            <div className="leading-tight">
              <span className="font-display text-sm font-bold text-foreground">ANSUT EVENT</span>
              <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Plateforme officielle
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        {/* Couverture de l'événement */}
        {event.cover_url && (
          <img
            src={event.cover_url}
            alt={event.name}
            className="mb-8 aspect-[3/1] w-full rounded-2xl object-cover shadow-lg"
          />
        )}

        {/* Titre et métadonnées */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{event.name}</h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
            <Calendar className="h-4 w-4" />
            {new Date(event.starts_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 font-medium">
              <MapPin className="h-4 w-4" /> {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/85">{event.description}</p>
        )}

        {/* Formulaire d'inscription */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          {/* En-tête du formulaire */}
          <div className="border-b border-border bg-primary/5 px-6 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {done ? "Inscription confirmée" : "S'inscrire à cet événement"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {done
                    ? "Votre place est réservée. Téléchargez votre badge ci-dessous."
                    : "Remplissez le formulaire ci-dessous pour réserver votre place."}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 md:px-8 md:py-8">
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-signal-ok/10">
                  <CheckCircle2 className="h-10 w-10 text-signal-ok" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">Félicitations !</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Votre inscription est confirmée. Présentez votre badge QR à l'entrée de l'événement.
                </p>
                {qrToken && (
                  <Button
                    variant="ansut-orange"
                    size="lg"
                    className="mt-8 rounded-xl px-8"
                    disabled={downloadingBadge}
                    onClick={async () => {
                      setDownloadingBadge(true);
                      try {
                        await downloadBadge(qrToken);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erreur badge");
                      } finally {
                        setDownloadingBadge(false);
                      }
                    }}
                  >
                    <IdCard className="mr-2 h-5 w-5" />
                    {downloadingBadge ? "Génération en cours..." : "Télécharger mon badge"}
                  </Button>
                )}
              </div>

            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="full_name" className="text-sm font-semibold">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    required
                    placeholder="Entrez votre nom et prénom"
                    className="h-11"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="votre@email.com"
                    className="h-11"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    className="h-11"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-sm font-semibold">Organisation</Label>
                  <Input
                    id="organization"
                    placeholder="Nom de votre structure"
                    className="h-11"
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-semibold">Poste / Fonction</Label>
                  <Input
                    id="position"
                    placeholder="Votre fonction"
                    className="h-11"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="ansut-orange"
                    size="lg"
                    className="w-full rounded-xl py-6 text-base font-bold sm:w-auto sm:px-10"
                  >
                    {submitting ? "Envoi en cours..." : "Confirmer mon inscription"}
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer léger */}
      <footer className="border-t border-border bg-muted/50 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-6 text-xs text-muted-foreground">
          <AnsutLogo size="sm" />
          <span>© {new Date().getFullYear()} ANSUT — Agence Nationale du Service Universel des Télécommunications</span>
        </div>
      </footer>
    </div>
  );
}
