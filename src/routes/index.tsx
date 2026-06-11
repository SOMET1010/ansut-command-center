import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  QrCode,
  Mic,
  Building2,
  PlayCircle,
  MapPin,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";
import { getLandingData } from "@/lib/landing.functions";
import heroImage from "@/assets/hero-conference.jpg";
import { AnsutLogo } from "@/components/ansut/Logo";

function SampleBadgeQr() {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://ansut-craft-kit.lovable.app";
    QRCode.toDataURL(`${origin}/signup`, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: "M",
      color: { dark: "#0E2440", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, []);
  if (!src) {
    return <div className="h-full w-full animate-pulse rounded-md bg-slate-100" />;
  }
  return <img src={src} alt="Exemple de QR code badge" className="h-full w-full rounded-md" />;
}

const landingQueryOptions = queryOptions({
  queryKey: ["landing-data"],
  queryFn: () => getLandingData(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANSUT EVENT — Plateforme officielle du SUTEL 2026" },
      {
        name: "description",
        content:
          "Inscriptions, badges QR, agenda, live polling et analytics en temps réel pour le Salon Universel des Télécommunications.",
      },
      { property: "og:title", content: "ANSUT EVENT — SUTEL 2026" },
      {
        property: "og:description",
        content: "Plateforme événementielle officielle de l'ANSUT pour le SUTEL 2026.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQueryOptions),
  component: Landing,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erreur de chargement : {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Page introuvable.</div>,
});

// Front-office uniquement — pas de lien vers le cockpit administrateur.
type FeatureItem = {
  icon: typeof Mic;
  title: string;
  items: string[];
  cta: string;
};
const features: FeatureItem[] = [
  {
    icon: Mic,
    title: "Programme",
    items: ["Plénières", "Ateliers & panels", "Intervenants", "Salles"],
    cta: "Consulter le programme",
  },
  {
    icon: QrCode,
    title: "Inscription & badge",
    items: ["Formulaire officiel d'inscription", "Badge QR personnel", "Accès aux espaces"],
    cta: "M'inscrire au SUTEL 2026",
  },
  {
    icon: Building2,
    title: "Exposants & partenaires",
    items: ["Liste des exposants", "Stands & sponsors", "Plan de l'événement"],
    cta: "Consulter les exposants",
  },
];

const partners = ["ANSUT", "RÉPUBLIQUE", "ITU", "GIZ", "Francophonie", "BANQUE MONDIALE", "UNESCO"];

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });
  return { start: fmt(start), end: fmt(end) };
}

function formatDates(startsAt: string | undefined, endsAt: string | undefined) {
  if (!startsAt || !endsAt) return "Dates à confirmer";
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const tz = "Africa/Abidjan";
  const fullFmt: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  };
  const dayKey = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: tz });
  // Single-day event → render one date, not a range.
  if (dayKey(start) === dayKey(end)) {
    return start.toLocaleDateString("fr-FR", fullFmt);
  }
  const startStr = start.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: tz,
  });
  const endStr = end.toLocaleDateString("fr-FR", fullFmt);
  return `${startStr} – ${endStr}`;
}

function Landing() {
  const { data } = useSuspenseQuery(landingQueryOptions);
  const ev = data.featuredEvent;
  const stats = data.stats;

  // Pas de page /events publique : on route les liens "programme" vers
  // /e/:slug/agenda si un événement est connu, sinon vers /signup.
  function ProgrammeLink({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) {
    if (ev?.slug) {
      return (
        <Link to="/e/$slug/agenda" params={{ slug: ev.slug }} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <Link to="/signup" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* TOP UTILITY BAR */}
      <div className="fixed top-0 z-[60] w-full border-b border-white/10 bg-[#08172E]/95 backdrop-blur-md">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 sm:px-6">
          <span className="hidden sm:inline">
            République de Côte d'Ivoire · Ministère de la Transition Numérique et de l'Innovation Technologique
          </span>
          <span className="sm:hidden">RCI · ANSUT</span>
          <div className="flex items-center gap-4">
            <span className="opacity-60">Édition officielle 2026</span>
          </div>
        </div>
      </div>

      {/* STICKY NAV */}
      <nav className="fixed top-8 z-50 w-full border-b border-white/5 bg-[#0E2440]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <AnsutLogo size="md" className="shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-[15px] font-semibold tracking-[0.02em] text-white">
                ANSUT Event
              </div>
              <div className="hidden text-[9px] uppercase tracking-[0.25em] text-white/55 md:block">
                SUTEL 2026 — Plateforme officielle
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <Link to="/" className="text-[13px] font-medium text-white">
              Accueil
            </Link>
            <ProgrammeLink className="text-[13px] font-medium text-white/65 transition hover:text-white">
              Programme
            </ProgrammeLink>
            <ProgrammeLink className="text-[13px] font-medium text-white/65 transition hover:text-white">
              Exposition
            </ProgrammeLink>
            <ProgrammeLink className="text-[13px] font-medium text-white/65 transition hover:text-white">
              Partenaires
            </ProgrammeLink>
            <Link
              to="/signup"
              className="text-[13px] font-medium text-white/65 transition hover:text-white"
            >
              Obtenir mon badge
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link to="/login">Connexion</Link>
            </Button>
            <Button
              asChild
              variant="ansut-orange"
              size="sm"
              className="rounded-full px-4 shadow-sm"
            >
              <Link to="/signup">
                <span className="sm:hidden">Badge</span>
                <span className="hidden sm:inline">Créer un compte</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO — full bleed institutional */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-40 text-white lg:pb-24 lg:pt-44">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            width={1920}
            height={1080}
            className="h-full w-full object-cover object-center"
          />
          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(34,86,163,0.45),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08172E]/95 via-[#08172E]/75 to-[#08172E]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08172E] via-[#08172E]/30 to-transparent" />
          {/* Fine grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6">
          <div className="grid items-end gap-16 lg:grid-cols-12">
            {/* LEFT */}
            <div className="lg:col-span-7">
              {/* Eyebrow — premier élément visuel, espacé de la nav */}
              <div className="flex items-center gap-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                <span className="h-px w-10 bg-secondary" />
                <span>IIIe édition · Salon Universel des Télécommunications</span>
              </div>

              {/* Headline — editorial */}
              <h1 className="mt-8 font-display text-[44px] font-bold leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-[88px]">
                SUTEL{" "}
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="italic font-normal text-white/90"
                >
                  2026
                </span>
                <br />
                <span className="text-white/85">Le rendez-vous du</span>
                <br />
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="italic font-normal text-secondary"
                >
                  service universel
                </span>
                <span className="text-white/85"> des télécommunications.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Le SUTEL réunit les acteurs africains du service universel des télécommunications
                — agences FSU, régulateurs, opérateurs et partenaires institutionnels — pour
                trois jours de plénières, ateliers et mises en relation. Plateforme officielle
                de gestion des inscriptions, accréditations et du programme.
              </p>

              {/* Meta line — séparateur visuel fort */}
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-white/10 py-5 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Dates</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatDates(ev?.starts_at, ev?.ends_at)}
                  </div>
                </div>
                {ev?.location && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Lieu</div>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
                      <MapPin className="h-3.5 w-3.5 text-secondary" />
                      {ev.location}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Organisateur
                  </div>
                  <div className="mt-1 font-semibold text-white">ANSUT</div>
                </div>
              </div>

              {/* Countdown — only shown when event is in the future */}
              {ev?.starts_at && (() => {
                const daysLeft = Math.ceil(
                  (new Date(ev.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                if (daysLeft <= 0) return null;
                return (
                  <div className="mt-8 flex items-center gap-3 rounded-full border border-secondary/30 bg-secondary/10 px-5 py-2.5 w-fit">
                    <Clock className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                      J-{daysLeft} avant le SUTEL 2026
                    </span>
                  </div>
                );
              })()}

              {/* CTAs — primary dominant, secondary plus léger */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  variant="ansut-orange"
                  className="rounded-full px-8 py-6 text-[15px] font-semibold shadow-[0_10px_40px_-10px_rgba(240,130,36,0.6)]"
                >
                  {ev?.slug ? (
                    <Link to="/e/$slug" params={{ slug: ev.slug }}>
                      M'inscrire au SUTEL 2026
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/signup">
                      M'inscrire au SUTEL 2026
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-medium text-white/80 backdrop-blur-sm hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <ProgrammeLink>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Consulter le programme
                  </ProgrammeLink>
                </Button>
              </div>
            </div>

            {/* RIGHT — Stat block institutionnel */}
            <aside className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="mb-5 border-b border-white/10 pb-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
                    À retenir
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                      <MapPin className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">Lieu</div>
                      <p className="mt-0.5 font-semibold text-white">{ev?.location ?? "Abidjan, Côte d'Ivoire"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                      <Calendar className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">Dates</div>
                      <p className="mt-0.5 font-semibold text-white">15 – 17 septembre 2026</p>
                      <p className="mt-0.5 text-xs text-white/55">3 jours de conférences</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                      <Users className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">Participants</div>
                      <p className="mt-0.5 font-semibold text-white">1 200+ attendus</p>
                      <p className="mt-0.5 text-xs text-white/55">Agences FSU · Régulateurs · Opérateurs</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                      <Mic className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">Format</div>
                      <p className="mt-0.5 font-semibold text-white">Plénières · Ateliers · Networking</p>
                      <p className="mt-0.5 text-xs text-white/55">Sous l'égide de l'UAT</p>
                    </div>
                  </div>
                </div>

                <ProgrammeLink className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline">
                  Consulter le programme complet →
                </ProgrammeLink>
              </div>

              {/* Key figures strip */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Inscrits" value={stats.participants.toLocaleString("fr-FR")} />
                <MiniStat label="Conférences" value={stats.conferences.toString()} />
                <MiniStat label="Partenaires" value={stats.partners.toString()} />
              </div>
            </aside>
          </div>

          {/* Scroll cue */}
          <div className="mt-16 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/40">
            <span className="h-px w-12 bg-white/20" />
            <span>En savoir plus sur la plateforme</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                La plateforme
              </p>
            </div>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Plateforme officielle
              <br />
              du SUTEL 2026
            </h2>
            <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-primary" />
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, idx) => {
              const isCenter = idx === 1;
              const ctaClass =
                "mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3";
              const cta =
                idx === 1 ? (
                  <Link to="/signup" className={ctaClass}>
                    {f.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <ProgrammeLink className={ctaClass}>
                    {f.cta}
                    <ArrowRight className="h-4 w-4" />
                  </ProgrammeLink>
                );
              return (
                <div
                  key={f.title}
                  className={cn(
                    "group relative flex flex-col rounded-3xl border p-8 transition-all hover:-translate-y-1",
                    isCenter
                      ? "border-secondary/40 bg-secondary/5 shadow-lg shadow-secondary/10"
                      : "border-border bg-muted hover:border-primary/30 hover:bg-card hover:shadow-[var(--shadow-card)]",
                  )}
                >
                  {/* Badge Essentiel pour la card centrale */}
                  {isCenter && (
                    <span className="absolute -top-3 right-6 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                      Essentiel
                    </span>
                  )}
                  <div className={cn(
                    "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110",
                    isCenter ? "bg-secondary/15 text-secondary" : "bg-card text-primary",
                  )}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
                  <ul className="mt-4 flex-1 space-y-2.5 text-sm text-muted-foreground">
                    {f.items.map((it) => (
                      <li key={it} className="flex items-start gap-3">
                        <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", isCenter ? "bg-secondary" : "bg-primary")} />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  {cta}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BADGE SECTION */}
      <section className="overflow-hidden bg-primary py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight">Badge QR d'accréditation</h2>
                <p className="mt-4 text-lg text-white/70">
                  Chaque participant reçoit un badge QR personnel après validation de son inscription. Ce badge donne accès à l'ensemble des espaces du SUTEL 2026.
                </p>

                <div className="mt-12 space-y-8">
                  <BadgeStep
                    num="1"
                    title="Inscription"
                    desc="Remplissez le formulaire officiel avec vos informations."
                  />
                  <BadgeStep
                    num="2"
                    title="Validation"
                    desc="L'équipe ANSUT valide votre demande d'accréditation."
                  />
                  <BadgeStep
                    num="3"
                    title="Accréditation"
                    desc="Un lien d'accès personnel vous est adressé par email."
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-secondary/30 blur-[100px]" />
                  <div className="relative flex h-[420px] w-64 flex-col items-center justify-center rounded-[2.5rem] border-[8px] border-white/10 bg-primary p-6 shadow-2xl">
                    <div className="mb-8 h-32 w-32 rounded-xl bg-white p-2">
                      <SampleBadgeQr />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">SUTEL 2026</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                        Participant
                      </div>
                      <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Restez informé
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Recevez les dernières actualités, mises à jour et annonces du SUTEL directement par
            email.
          </p>
          <div className="mx-auto mt-10 max-w-xl">
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-t border-border bg-muted py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Ils nous font confiance
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 transition-opacity hover:opacity-100">
            {partners.map((p) => (
              <span
                key={p}
                className="font-display text-lg font-extrabold tracking-tight text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-primary py-12 text-sm text-white/75">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-4">
            <AnsutLogo size="md" />
            <div className="text-center md:text-left">
              © {new Date().getFullYear()} <span className="font-bold text-white">ANSUT</span> —
              Agence Nationale du Service Universel des Télécommunications
            </div>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-8 font-medium">
            <Link to="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <a href="mailto:support@ansut.ci" className="hover:text-white">
              Support
            </a>
            <a
              href="https://uat-africa.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              UAT
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm">
      <div className="text-lg font-bold tabular-nums leading-none text-white">{value}</div>
      <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function BadgeStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-secondary/40 bg-secondary/15 font-bold text-secondary">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-white">{title}</h4>
        <p className="mt-1 text-sm text-white/75">{desc}</p>
      </div>
    </div>
  );
}
