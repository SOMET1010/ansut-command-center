import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Calendar, MapPin, CheckCircle2, IdCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnsutLogo } from "@/components/ansut/Logo";
import { sendRegistrationConfirmation } from "@/lib/notifications.functions";
import { downloadBadge } from "@/lib/badges";

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
  capacity: number | null;
  status: string;
};

// Validation — messages explicites, orientés grand public.
const registrationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Indiquez votre nom complet (au moins 2 caractères)." })
    .max(100, { message: "Le nom est trop long (100 caractères maximum)." }),
  email: z
    .string()
    .trim()
    .email({ message: "Adresse email invalide (exemple : nom@domaine.ci)." })
    .max(255),
  phone: z
    .string()
    .trim()
    .max(30, { message: "Numéro trop long." })
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[+0-9 .()-]{6,}$/.test(v),
      { message: "Numéro invalide. Utilisez le format international, ex : +225 07 00 00 00 00." },
    ),
  organization: z.string().trim().max(150, { message: "Nom trop long (150 max)." }).optional().or(z.literal("")),
  position: z.string().trim().max(150, { message: "Intitulé trop long (150 max)." }).optional().or(z.literal("")),
});

type FormErrors = Partial<Record<keyof z.infer<typeof registrationSchema>, string>>;

function PublicEventPage() {
  const { slug } = Route.useParams();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [downloadingBadge, setDownloadingBadge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [isFull, setIsFull] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", organization: "", position: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      const ev = data as PublicEvent | null;
      setEvent(ev);

      // Vérifier la capacité si l'événement existe et a une capacité définie
      if (ev?.capacity) {
        const { count } = await supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id);
        const regCount = count ?? 0;
        setRegistrationCount(regCount);
        setIsFull(regCount >= ev.capacity);
      }

      setLoading(false);
    }
    loadEvent();
  }, [slug]);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Merci de corriger les champs en rouge avant d'envoyer.");
      return;
    }
    setErrors({});

    setSubmitting(true);
    const { data: token, error } = await supabase.rpc("register_for_event", {
      p_event_id: event.id,
      p_full_name: parsed.data.full_name,
      p_email: parsed.data.email,
      p_phone: parsed.data.phone ?? "",
      p_organization: parsed.data.organization ?? "",
      p_position: parsed.data.position ?? "",
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        setErrors({ email: "Cette adresse email est déjà inscrite à cet événement." });
        toast.error("Cet email est déjà inscrit à cet événement.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setQrToken(token as string);

    // Confirmation WhatsApp (best-effort, ne bloque pas l'UI).
    // Le serveur regénère destinataire + contenu depuis le qr_token — l'appelant
    // ne peut donc pas cibler un numéro arbitraire ni un message arbitraire.
    if (parsed.data.phone && token) {
      sendRegistrationConfirmation({
        data: { qr_token: token as string, channel: "whatsapp" },
      }).catch((err) => console.warn("Hub notify failed", err));
    }

    setDone(true);
  }

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-muted-foreground">Chargement...</div>;
  }
  if (!event) {
    throw notFound();
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* HEADER officiel ANSUT */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <AnsutLogo size="md" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">ANSUT EVENT</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Plateforme officielle
              </div>
            </div>
          </Link>
          <Link to="/login" className="text-xs font-medium text-muted-foreground hover:text-primary">
            Espace organisateur
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {event.cover_url && (
          <img src={event.cover_url} alt={event.name} className="mb-8 aspect-[3/1] w-full rounded-xl object-cover" />
        )}

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.name}</h1>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {new Date(event.starts_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/90">{event.description}</p>
        )}

        {/* CARTE FORMULAIRE */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-10">
          {isFull && !done ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-warning/10">
                <AlertCircle className="h-8 w-8 text-signal-warning" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">Inscriptions clôturées</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                La capacité maximale de cet événement a été atteinte ({registrationCount}/{event?.capacity} places).
                Les inscriptions sont automatiquement clôturées.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Pour toute demande, contactez l’équipe organisatrice de l’ANSUT.
              </p>
            </div>
          ) : done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold">Inscription confirmée</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                Merci ! Téléchargez votre badge ci-dessous et présentez-le à l'entrée de l'événement.
                Une copie vous a également été envoyée par email.
              </p>
              {qrToken && (
                <Button
                  size="lg"
                  className="mt-8 h-12 px-8 text-base"
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
                  {downloadingBadge ? "Génération du badge..." : "Télécharger mon badge"}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-7 border-b border-border pb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Étape 1 sur 1 · Inscription gratuite
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Je m'inscris à cet événement</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Remplissez les informations ci-dessous. Les champs marqués d'un{" "}
                  <span className="font-semibold text-destructive">*</span> sont obligatoires.
                  Vous recevrez votre badge QR par email.
                </p>
              </div>

              <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                <FormField
                  className="sm:col-span-2"
                  id="full_name"
                  label="Nom et prénoms"
                  required
                  helper="Tel qu'il apparaîtra sur votre badge."
                  error={errors.full_name}
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(v) => updateField("full_name", v)}
                />
                <FormField
                  id="email"
                  type="email"
                  label="Adresse email"
                  required
                  helper="Pour recevoir votre badge et les notifications."
                  error={errors.email}
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                />
                <FormField
                  id="phone"
                  type="tel"
                  label="Téléphone WhatsApp"
                  helper="Optionnel — pour recevoir une confirmation WhatsApp."
                  placeholder="+225 07 00 00 00 00"
                  error={errors.phone}
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(v) => updateField("phone", v)}
                />
                <FormField
                  id="organization"
                  label="Organisation"
                  helper="Entreprise, ministère, association…"
                  error={errors.organization}
                  autoComplete="organization"
                  value={form.organization}
                  onChange={(v) => updateField("organization", v)}
                />
                <FormField
                  id="position"
                  label="Poste / Fonction"
                  helper="Optionnel."
                  error={errors.position}
                  autoComplete="organization-title"
                  value={form.position}
                  onChange={(v) => updateField("position", v)}
                />

                <div className="mt-2 sm:col-span-2">
                  <Button
                    type="submit"
                    size="lg"
                    variant="ansut-orange"
                    disabled={submitting}
                    className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
                  >
                    {submitting ? "Envoi en cours..." : "Confirmer mon inscription"}
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    En confirmant, vous acceptez le traitement de vos données par l'ANSUT
                    pour la gestion de cet événement.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-muted py-6">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold text-foreground">ANSUT</span> — Agence Nationale du Service Universel des Télécommunications
        </div>
      </footer>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  helper,
  error,
  placeholder,
  autoComplete,
  inputMode,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "search" | "url";
  className?: string;
}) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`h-12 rounded-lg border-2 px-4 text-base transition-colors ${
          error
            ? "border-destructive focus-visible:ring-destructive/30"
            : "border-input focus-visible:border-primary"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
