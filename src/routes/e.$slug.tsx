import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendHubMessage } from "@/lib/notifications.functions";

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
    const { error } = await supabase.from("event_registrations").insert({
      event_id: event.id,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone || null,
      organization: form.organization || null,
      position: form.position || null,
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
    setDone(true);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }
  if (!event) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">A</div>
            <span className="font-semibold">ANSUT EVENT</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {event.cover_url && (
          <img src={event.cover_url} alt={event.name} className="mb-8 aspect-[3/1] w-full rounded-xl object-cover" />
        )}

        <h1 className="text-4xl font-bold tracking-tight">{event.name}</h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(event.starts_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/90">{event.description}</p>
        )}

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Inscription confirmée</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Merci ! Un email de confirmation vous sera envoyé. Votre badge sera disponible avant l'événement.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">S'inscrire</h2>
              <p className="mt-1 text-sm text-muted-foreground">Remplissez le formulaire ci-dessous.</p>
              <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organisation</Label>
                  <Input id="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Poste / Fonction</Label>
                  <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Envoi..." : "Confirmer mon inscription"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
