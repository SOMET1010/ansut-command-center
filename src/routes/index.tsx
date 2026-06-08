import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Calendar,
  QrCode,
  Mic,
  Building2,
  PlayCircle,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";
import { getLandingData } from "@/lib/landing.functions";
import heroImage from "@/assets/hero-conference.jpg";
import { AnsutLogo } from "@/components/ansut/Logo";

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
          "Inscriptions, accréditations, badges QR, agenda, live polling et analytics en temps réel pour le Salon Universel des Télécommunications.",
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
const features = [
  {
    icon: Mic,
    title: "Programme & conférences",
    items: ["Plénières et panels", "Intervenants & modérateurs", "Salles & sessions"],
    href: "/events" as const,
    cta: "Voir le programme",
  },
  {
    icon: QrCode,
    title: "Inscription & badge",
    items: ["Inscription en ligne guidée", "Badge QR par email", "Accès aux espaces"],
    href: "/signup" as const,
    cta: "S'inscrire au SUTEL 2026",
  },
  {
    icon: Building2,
    title: "Exposition & partenaires",
    items: ["Liste des exposants", "Stands & sponsors", "Plan du salon"],
    href: "/events" as const,
    cta: "Découvrir le salon",
  },
];

const partners = ["ANSUT", "RÉPUBLIQUE", "ITU", "GIZ", "Francophonie", "BANQUE MONDIALE", "UNESCO"];

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { start: fmt(start), end: fmt(end) };
}

function formatDates(startsAt: string | undefined, endsAt: string | undefined) {
  if (!startsAt || !endsAt) return "Dates à confirmer";
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const tz = "Africa/Abidjan";
  const startStr = start.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: tz,
  });
  const endStr = end.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  });
  return `${startStr} – ${endStr}`;
}

function Landing() {
  const { data } = useSuspenseQuery(landingQueryOptions);
  const ev = data.featuredEvent;
  const stats = data.stats;

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
            <span className="hidden md:inline">FR</span>
            <span className="hidden md:inline opacity-40">|</span>
            <span className="hidden md:inline opacity-60">EN</span>
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
            <Link
              to="/events"
              className="text-[13px] font-medium text-white/65 transition hover:text-white"
            >
              Programme
            </Link>
            <Link
              to="/events"
              className="text-[13px] font-medium text-white/65 transition hover:text-white"
            >
              Exposition
            </Link>
            <Link
              to="/events"
              className="text-[13px] font-medium text-white/65 transition hover:text-white"
            >
              Partenaires
            </Link>
            <Link
              to="/signup"
              className="text-[13px] font-medium text-white/65 transition hover:text-white"
            >
              S'inscrire
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
                <span className="sm:hidden">S'inscrire</span>
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
              {/* Eyebrow */}
              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                <span className="h-px w-10 bg-secondary" />
                <span>Sommet officiel du numérique ivoirien</span>
              </div>

              {/* Headline — editorial */}
              <h1 className="mt-6 font-display text-[44px] font-bold leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-[88px]">
                SUTEL{" "}
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="italic font-normal text-white/90"
                >
                  2026
                </span>
                <br />
                <span className="text-white/85">Bâtir l'avenir</span>
                <br />
                <span
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="italic font-normal text-secondary"
                >
                  numérique
                </span>
                <span className="text-white/85"> ivoirien.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Le rendez-vous institutionnel des décideurs, opérateurs et partenaires du service
                universel des télécommunications. Plateforme officielle d'inscription,
                d'accréditation, de programme et d'analytics temps réel.
              </p>

              {/* Meta line */}
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-white/10 py-5 text-sm">
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
                    Édition
                  </div>
                  <div className="mt-1 font-semibold text-white">III · Officielle</div>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="ansut-orange"
                  className="rounded-full px-8 py-6 text-[15px] font-semibold shadow-[0_10px_40px_-10px_rgba(240,130,36,0.6)]"
                >
                  {ev?.slug ? (
                    <Link to="/e/$slug" params={{ slug: ev.slug }}>
                      Demander son accréditation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/signup">
                      Demander son accréditation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/25 bg-transparent px-8 py-6 text-[15px] font-semibold text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/5 hover:text-white"
                >
                  <Link to="/events">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Découvrir le programme
                  </Link>
                </Button>
              </div>
            </div>

            {/* RIGHT — Programme du jour, institutional card */}
            <aside className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
                      À l'agenda
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-white">Programme du jour</h2>
                  </div>
                  <Link
                    to="/events"
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    Voir tout →
                  </Link>
                </div>

                <ul className="space-y-2">
                  {data.agenda.length === 0 && (
                    <li className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-6 text-center">
                      <Calendar className="mb-3 h-7 w-7 text-white/30" />
                      <p className="text-sm text-white/55">
                        Le programme officiel sera publié prochainement.
                      </p>
                    </li>
                  )}
                  {data.agenda.map((item) => {
                    const r = formatRange(item.starts_at, item.ends_at);
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                      >
                        <div className="flex w-12 shrink-0 flex-col text-[11px] font-semibold tabular-nums">
                          <span className="text-white">{r.start}</span>
                          <span className="text-white/40">{r.end}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="inline-block rounded bg-secondary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary">
                            Conférence
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white">
                            {item.name}
                          </p>
                          {item.location && (
                            <p className="mt-0.5 text-xs text-white/45">{item.location}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  asChild
                  variant="outline"
                  className="mt-5 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/events">
                    Programme complet
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
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
            <span>Défiler pour explorer la plateforme</span>
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
                Tout en un seul endroit
              </p>
            </div>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Une plateforme complète
              <br />
              pour un événement réussi
            </h2>
            <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-primary" />
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col rounded-3xl border border-border bg-muted p-8 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[var(--shadow-card)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm transition-transform group-hover:scale-110">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  {f.items.map((it) => (
                    <li key={it} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={f.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGE SECTION */}
      <section className="overflow-hidden bg-primary py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight">Votre badge, votre accès</h2>
                <p className="mt-4 text-lg text-white/70">
                  Téléchargez votre badge QR et accédez facilement à tous les espaces du SUTEL 2026.
                </p>

                <div className="mt-12 space-y-8">
                  <BadgeStep
                    num="1"
                    title="Inscription"
                    desc="Créez votre compte en quelques clics."
                  />
                  <BadgeStep
                    num="2"
                    title="Validation"
                    desc="Votre demande est examinée et validée."
                  />
                  <BadgeStep
                    num="3"
                    title="Accès"
                    desc="Recevez votre badge QR personnel par email."
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-secondary/30 blur-[100px]" />
                  <div className="relative flex h-[420px] w-64 flex-col items-center justify-center rounded-[2.5rem] border-[8px] border-white/10 bg-primary p-6 shadow-2xl">
                    <div className="mb-8 h-32 w-32 rounded-xl bg-white p-2">
                      <div className="grid h-full w-full grid-cols-5 gap-0.5 p-2">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className={i % 3 === 0 || i % 5 === 0 ? "bg-primary" : "bg-white"}
                          />
                        ))}
                      </div>
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
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-white">
              Mentions légales
            </a>
            <a href="#" className="hover:text-white">
              Confidentialité
            </a>
            <a href="#" className="hover:text-white">
              Support
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
