import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Calendar, MapPin, CheckCircle2, IdCard, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnsutLogo } from "@/components/ansut/Logo";
import { ChatBot } from "@/components/ChatBot";
import { WifiQrCode } from "@/components/WifiQrCode";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { sendRegistrationConfirmation } from "@/lib/notifications.functions";
import { downloadBadge } from "@/lib/badges";
import { ParticipantBottomNav } from "@/components/ParticipantBottomNav";
import { MyBadgeCard } from "@/components/MyBadgeCard";

const BADGE_STORAGE_PREFIX = "ansut:badge:";

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
    .refine((v) => !v || /^[+0-9 .()-]{6,}$/.test(v), {
      message: "Numéro invalide. Utilisez le format international, ex : +225 07 00 00 00 00.",
    }),
  organization: z
    .string()
    .trim()
    .max(150, { message: "Nom trop long (150 max)." })
    .optional()
    .or(z.literal("")),
  position: z
    .string()
    .trim()
    .max(150, { message: "Intitulé trop long (150 max)." })
    .optional()
    .or(z.literal("")),
});

type FormErrors = Partial<Record<string, string>>;

function PublicEventPage() {
  const { slug } = Route.useParams();
  const { language, setLanguage, t } = useLanguage();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [downloadingBadge, setDownloadingBadge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [isFull, setIsFull] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    position: "",
    country: "",
    participant_category: "other",
    bio: "",
    linkedin_url: "",
    is_visible_in_directory: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select(
          "id, organization_id, name, slug, description, location, starts_at, ends_at, capacity, cover_url, status, created_by, created_at, updated_at",
        )
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

  // Lot 2 : rehydrater le badge si le participant est déjà inscrit.
  // Sources, par ordre de priorité :
  //   1. URL ?token=... (récupération depuis l'email sur un nouvel appareil)
  //   2. localStorage (appareil déjà utilisé pour l'inscription)
  // Au prochain rendu, le token URL est aussi persisté pour les visites suivantes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken && /^[0-9a-f-]{20,}$/i.test(urlToken)) {
      window.localStorage.setItem(`${BADGE_STORAGE_PREFIX}${slug}`, urlToken);
      setQrToken(urlToken);
      return;
    }
    const stored = window.localStorage.getItem(`${BADGE_STORAGE_PREFIX}${slug}`);
    if (stored) setQrToken(stored);
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

    // Mise à jour des champs profil networking (best-effort, après inscription)
    if (!error && token) {
      await supabase.rpc("update_my_profile", {
        p_qr_token: token as string,
        p_country: form.country || undefined,
        p_participant_category: form.participant_category,
        p_bio: form.bio || undefined,
        p_linkedin_url: form.linkedin_url || undefined,
        p_is_visible_in_directory: form.is_visible_in_directory,
      });
    }
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
    if (typeof window !== "undefined" && token) {
      window.localStorage.setItem(`${BADGE_STORAGE_PREFIX}${slug}`, token as string);
    }

    // Confirmation multi-canal (best-effort, ne bloque pas l'UI).
    // Le serveur regénère destinataire + contenu depuis le qr_token.
    // Canaux : Email (toujours), WhatsApp + Telegram (si téléphone fourni).
    if (token) {
      // Email toujours
      sendRegistrationConfirmation({
        data: { qr_token: token as string, channel: "Email" },
      }).catch((err) => console.warn("Hub Email failed", err));
      // WhatsApp + Telegram si téléphone fourni (les deux utilisent le numéro)
      if (parsed.data.phone) {
        sendRegistrationConfirmation({
          data: { qr_token: token as string, channel: "WhatsApp" },
        }).catch((err) => console.warn("Hub WhatsApp failed", err));
        sendRegistrationConfirmation({
          data: { qr_token: token as string, channel: "Telegram" },
        }).catch((err) => console.warn("Hub Telegram failed", err));
      }
    }

    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }
  if (!event) {
    throw notFound();
  }

  return (
    <div className="min-h-dvh bg-background">
      <ParticipantBottomNav slug={slug} />
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
          <div className="flex items-center gap-3">
            <LanguageSwitcher language={language} onLanguageChange={setLanguage} compact />
            <Link
              to="/annonces/$slug"
              params={{ slug }}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              {t("nav.announcements")}
            </Link>
            <Link
              to="/agenda/$slug"
              params={{ slug }}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              {t("nav.program")}
            </Link>
            <Link
              to="/login"
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-6 py-10">
        {qrToken && <MyBadgeCard qrToken={qrToken} />}
        {event.cover_url && (
          <img
            src={event.cover_url}
            alt={event.name}
            className="mb-8 aspect-[3/1] w-full rounded-xl object-cover"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.name}</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {new Date(event.starts_at).toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Africa/Abidjan",
            })}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {event.location}
            </span>
          )}
        </div>
        {event.description && (
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {event.description}
          </p>
        )}
        {/* WiFi QR Code */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(event as any).wifi_ssid && (
          <div className="mt-8">
            <WifiQrCode
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ssid={(event as any).wifi_ssid}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              password={(event as any).wifi_password || ""}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              encryption={(event as any).wifi_encryption || "WPA"}
            />
          </div>
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
                La capacité maximale de cet événement a été atteinte ({registrationCount}/
                {event?.capacity} places). Les inscriptions sont automatiquement clôturées.
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
                Merci ! Téléchargez votre badge ci-dessous et présentez-le à l'entrée de
                l'événement. Une copie vous a également été envoyée par email.
              </p>
              {qrToken && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base"
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
                  <Link
                    to="/networking/$slug"
                    params={{ slug }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Users className="h-4 w-4" />
                    Découvrir les autres participants
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-7 border-b border-border pb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Étape 1 sur 1 · Inscription gratuite
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Je m'inscris à cet événement
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Remplissez les informations ci-dessous. Les champs marqués d'un{" "}
                  <span className="font-semibold text-destructive">*</span> sont obligatoires. Vous
                  recevrez votre badge QR par email.
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
                  label="Téléphone (WhatsApp / SMS / Telegram)"
                  helper="Optionnel — pour recevoir des confirmations par WhatsApp, SMS et Telegram."
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
                <FormField
                  id="country"
                  label="Pays"
                  helper="Optionnel."
                  error={errors.country}
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(v) => updateField("country", v)}
                  placeholder="Côte d'Ivoire"
                />

                {/* Section Networking (repliable) */}
                <details className="sm:col-span-2 rounded-lg border border-slate-200 p-4 mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-primary select-none">
                    Compléter mon profil networking (optionnel)
                  </summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="participant_category" className="text-sm font-medium">
                        Catégorie
                      </Label>
                      <select
                        id="participant_category"
                        value={form.participant_category}
                        onChange={(e) => updateField("participant_category", e.target.value)}
                        className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                      >
                        <option value="fsu">Fonds de Service Universel</option>
                        <option value="regulator">Régulateur</option>
                        <option value="operator">Opérateur télécom</option>
                        <option value="partner">Partenaire financier</option>
                        <option value="startup">Startup / Innovation</option>
                        <option value="international_org">Organisation internationale</option>
                        <option value="government">Gouvernement</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <FormField
                      id="linkedin_url"
                      label="Profil LinkedIn"
                      helper="URL complète."
                      value={form.linkedin_url}
                      onChange={(v) => updateField("linkedin_url", v)}
                      placeholder="https://linkedin.com/in/votre-profil"
                    />
                    <div className="sm:col-span-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Courte présentation
                      </Label>
                      <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        maxLength={280}
                        rows={2}
                        placeholder="Quelques mots sur vous et vos attentes..."
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary resize-none"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">280 caractères max.</p>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_visible_in_directory"
                        checked={form.is_visible_in_directory}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, is_visible_in_directory: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <Label htmlFor="is_visible_in_directory" className="text-sm cursor-pointer">
                        Apparaître dans l’annuaire des participants
                      </Label>
                    </div>
                  </div>
                </details>

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
                    En confirmant, vous acceptez le traitement de vos données par l'ANSUT pour la
                    gestion de cet événement.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-muted py-6">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold text-foreground">ANSUT</span>{" "}
          — Agence Nationale du Service Universel des Télécommunications
        </div>
      </footer>

      {/* Chatbot IA flottant */}
      <ChatBot
        eventName={event.name}
        eventSlug={slug}
        venue={event.location || undefined}
        language={language}
      />
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
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
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
