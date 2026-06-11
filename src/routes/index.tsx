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
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";
import { getLandingData } from "@/lib/landing.functions";
import heroImage from "@/assets/hero-conference.jpg";
import { AnsutLogo } from "@/components/ansut/Logo";
import { cn } from "@/lib/utils";

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
      {/* BANDEAU OFFICIEL FIN */}
      <div className="fixed top-0 z-[60] w-full border-b border-[#0E2440]/10 bg-[#F5EFE6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-center px-4 text-[10px] font-medium uppercase tracking-[0.18em] text-[#0E2440]/70 sm:px-6">
          <span className="hidden sm:inline">
            République de Côte d'Ivoire · Ministère de la Transition Numérique et de l'Innovation Technologique
          </span>
          <span className="sm:hidden">RCI · MTNIT</span>
        </div>
      </div>

      {/* STICKY NAV — fond clair, epuré */}
      <nav className="fixed top-8 z-50 w-full border-b border-[#0E2440]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <AnsutLogo size="md" className="shrink-0" />
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            <ProgrammeLink className="text-[13px] font-medium text-[#0E2440]/75 transition hover:text-[#0E2440]">
              Programme
            </ProgrammeLink>
            <ProgrammeLink className="text-[13px] font-medium text-[#0E2440]/75 transition hover:text-[#0E2440]">
              Exposition
            </ProgrammeLink>
            <ProgrammeLink className="text-[13px] font-medium text-[#0E2440]/75 transition hover:text-[#0E2440]">
              Partenaires
            </ProgrammeLink>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="default"
              size="sm"
              className="rounded-full bg-[#B8763A] px-5 text-white shadow-sm hover:bg-[#A6692F]"
            >
              <Link to="/signup">Obtenir mon badge</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO — clair, asymétrique 60/40, image à droite */}
      <section className="relative overflow-hidden bg-[#F5EFE6] pb-20 pt-40 text-[#0E2440] lg:pb-28 lg:pt-44">
        {/* Décor feuille gauche */}
        <div
          className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #0E2440 0%, transparent 60%)" }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* LEFT — 60% texte */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0E2440]/60">
                <span className="h-px w-10 bg-[#B8763A]" />
                <span>IIIe Édition · Salon Universel des Télécommunications</span>
              </div>

              <h1 className="mt-6 font-display text-[64px] font-bold leading-[0.95] tracking-[-0.025em] text-[#0E2440] sm:text-7xl lg:text-[104px]">
                SUTEL{" "}
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="italic font-normal text-[#0E2440]"
                >
                  2026
                </span>
              </h1>
              <p
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="mt-4 text-2xl italic text-[#B8763A] sm:text-3xl lg:text-4xl"
              >
                Le rendez-vous du service universel.
              </p>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#0E2440]/70 sm:text-lg">
                Rassembler les acteurs, valoriser les innovations et accélérer l'inclusion numérique pour tous.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-[#B8763A] px-7 py-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#A6692F]"
                >
                  {ev?.slug ? (
                    <Link to="/e/$slug" params={{ slug: ev.slug }}>
                      Obtenir mon badge
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/signup">
                      Obtenir mon badge
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-[#0E2440]/20 bg-transparent px-6 py-6 text-[15px] font-semibold text-[#0E2440] hover:bg-[#0E2440]/5"
                >
                  <ProgrammeLink>
                    Consulter le programme
                  </ProgrammeLink>
                </Button>
              </div>
            </div>

            {/* RIGHT — 40% image + stat overlay */}
            <aside className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl shadow-[0_30px_80px_-20px_rgba(14,36,64,0.25)]">
                <img
                  src={heroImage}
                  alt="Vue intérieure d'un centre de conférence moderne"
                  className="h-[480px] w-full object-cover"
                />
                <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-[#0E2440]/95 px-5 py-4 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B8763A]/20">
                    <Users className="h-5 w-5 text-[#B8763A]" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold leading-none text-white">
                      1 200<span className="text-[#B8763A]">+</span>
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/70">
                      participants attendus
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* BANDEAU RÉASSURANCE — 3 infos claires, aérées */}
      <section className="border-y border-[#0E2440]/10 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0">
            <div className="flex items-center justify-center gap-4 sm:border-r sm:border-[#0E2440]/10">
              <Calendar className="h-6 w-6 shrink-0 text-[#0E2440]" strokeWidth={1.5} />
              <div>
                <div className="text-sm font-bold text-[#0E2440]">15 – 17 septembre 2026</div>
                <div className="mt-0.5 text-xs text-[#0E2440]/60">Trois jours d'échanges et d'innovations</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 sm:border-r sm:border-[#0E2440]/10">
              <MapPin className="h-6 w-6 shrink-0 text-[#0E2440]" strokeWidth={1.5} />
              <div>
                <div className="text-sm font-bold text-[#0E2440]">Abidjan, Côte d'Ivoire</div>
                <div className="mt-0.5 text-xs text-[#0E2440]/60">Sofitel Abidjan Hôtel Ivoire</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <ShieldCheck className="h-6 w-6 shrink-0 text-[#0E2440]" strokeWidth={1.5} />
              <div>
                <div className="text-sm font-bold text-[#0E2440]">Sous l'égide de l'UAT</div>
                <div className="mt-0.5 text-xs text-[#0E2440]/60">Union Africaine des Télécommunications</div>
              </div>
            </div>
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
