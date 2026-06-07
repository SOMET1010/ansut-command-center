import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Calendar,
  QrCode,
  BarChart3,
  Vote,
  Users,
  Mic,
  Building2,
  CheckCircle2,
  PlayCircle,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";
import { getLandingData } from "@/lib/landing.functions";
import heroImage from "@/assets/hero-conference.jpg";

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
    <div className="p-8 text-center text-destructive">
      Erreur de chargement : {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Page introuvable.</div>,
});

const features = [
  {
    icon: Users,
    title: "Participants",
    items: ["Inscription en ligne", "Validation des demandes", "Gestion des profils"],
    href: "/participants" as const,
    cta: "Gérer les participants",
  },
  {
    icon: Mic,
    title: "Conférences",
    items: ["Programme détaillé", "Intervenants & modérateurs", "Salles & sessions"],
    href: "/events" as const,
    cta: "Voir le programme",
  },
  {
    icon: QrCode,
    title: "Accréditation",
    items: ["Génération de badges QR", "Contrôle d'accès temps réel", "Gestion des accès"],
    href: "/checkin" as const,
    cta: "Gérer les accès",
  },
  {
    icon: Vote,
    title: "Live Polling",
    items: ["Sondages en direct", "Questions & votes", "Résultats instantanés"],
    href: "/polls" as const,
    cta: "Participer",
  },
  {
    icon: Building2,
    title: "Exposition",
    items: ["Liste des exposants", "Stands & sponsors", "Plan d'exposition"],
    href: "/events" as const,
    cta: "Découvrir",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    items: ["Tableaux de bord", "Statistiques en temps réel", "Rapports exportables"],
    href: "/dashboard" as const,
    cta: "Voir les rapports",
  },
];

const partners = ["ANSUT", "RÉPUBLIQUE", "ITU", "GIZ", "Francophonie", "BANQUE MONDIALE", "UNESCO"];

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { start: fmt(start), end: fmt(end) };
}

function formatDates(startsAt: string | undefined, endsAt: string | undefined) {
  if (!startsAt || !endsAt) return "Dates à confirmer";
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const startStr = start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const endStr = end.toLocaleDateString("fr-FR", opts);
  return `${startStr} – ${endStr}`;
}

function Landing() {
  const { data } = useSuspenseQuery(landingQueryOptions);
  const ev = data.featuredEvent;
  const stats = data.stats;

  return (
    <div className="min-h-screen bg-background">
      {/* STICKY NAV */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-primary/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl font-bold text-secondary-foreground">
              A
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold tracking-tight text-white">ANSUT EVENT</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/75">
                SUTEL 2026 Official
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <Link to="/" className="text-sm font-medium text-white">Accueil</Link>
            <Link to="/events" className="text-sm font-medium text-white/70 transition hover:text-white">Programme</Link>
            <Link to="/participants" className="text-sm font-medium text-white/70 transition hover:text-white">Participants</Link>
            <Link to="/events" className="text-sm font-medium text-white/70 transition hover:text-white">Exposition</Link>
            <Link to="/events" className="text-sm font-medium text-white/70 transition hover:text-white">Partenaires</Link>
            <Link to="/dashboard" className="text-sm font-medium text-white/70 transition hover:text-white">Statistiques</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild variant="ansut-orange" className="rounded-full shadow-sm">
              <Link to="/signup">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pb-24 pt-32 text-white lg:pt-48" style={{ background: "var(--gradient-hero)" }}>
        {/* Background image + grid pattern */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            width={1920}
            height={1080}
            className="h-full w-full object-cover opacity-15"
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            {/* LEFT */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-secondary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {ev?.name?.includes("SUTEL") ? ev.name : "SUTEL 2026"} • {formatDates(ev?.starts_at, ev?.ends_at)}
                </span>
              </div>

              <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight lg:text-7xl">
                Plateforme officielle
                <br />
                <span className="bg-gradient-to-r from-white via-[oklch(0.85_0.05_245)] to-[oklch(0.70_0.10_245)] bg-clip-text text-transparent">
                  du SUTEL 2026
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                Gérez les inscriptions, accréditations, conférences, badges QR, accès, live polling
                et analytics en temps réel pour le plus grand événement télécom de Côte d'Ivoire.
              </p>

              {ev?.location && (
                <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4" />
                  {ev.location}
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-white px-8 py-6 text-base font-bold text-primary shadow-2xl hover:bg-white/95"
                >
                  {ev?.slug ? (
                    <Link to="/e/$slug" params={{ slug: ev.slug }}>
                      S'inscrire au SUTEL 2026
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  ) : (
                    <Link to="/signup">
                      S'inscrire au SUTEL 2026
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/20 bg-white/5 px-8 py-6 text-base font-bold text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                >
                  <Link to="/events">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Découvrir la plateforme
                  </Link>
                </Button>
              </div>

              {/* STATS */}
              <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StatCard icon={Users} label="Inscrits" value={stats.participants.toLocaleString("fr-FR")} />
                <StatCard icon={QrCode} label="Badges" value={stats.badges.toLocaleString("fr-FR")} />
                <StatCard icon={Mic} label="Conférences" value={stats.conferences.toString()} />
                <StatCard icon={Building2} label="Partenaires" value={stats.partners.toString()} />
                <StatCard icon={BarChart3} label="Présence" value={`${stats.attendanceRate}%`} highlight />
              </div>
            </div>

            {/* RIGHT — Programme du jour */}
            <aside className="lg:col-span-5">
              <div className="overflow-hidden rounded-3xl bg-white p-8 text-foreground shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Programme du jour</h2>
                  <Link to="/events" className="text-sm font-semibold text-primary hover:underline">
                    Voir tout
                  </Link>
                </div>

                <ul className="space-y-3">
                  {data.agenda.length === 0 && (
                    <li className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-muted-foreground">
                        Aucun événement programmé pour le moment.
                      </p>
                    </li>
                  )}
                  {data.agenda.map((item) => {
                    const r = formatRange(item.starts_at, item.ends_at);
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                      >
                        <div className="flex w-14 shrink-0 flex-col text-xs font-semibold text-muted-foreground">
                          <span className="text-foreground">{r.start}</span>
                          <span>{r.end}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            Conférence
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
                            {item.name}
                          </p>
                          {item.location && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.location}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Button asChild className="mt-6 w-full rounded-xl bg-primary py-6 font-bold hover:bg-primary/90">
                  <Link to="/events">
                    <Calendar className="mr-2 h-4 w-4" />
                    Voir le programme complet
                  </Link>
                </Button>
              </div>
            </aside>
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
                  <BadgeStep num="1" title="Inscription" desc="Créez votre compte en quelques clics." />
                  <BadgeStep num="2" title="Validation" desc="Votre demande est examinée et validée." />
                  <BadgeStep num="3" title="Accès" desc="Recevez votre badge QR personnel par email." />
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
            Recevez les dernières actualités, mises à jour et annonces du SUTEL directement par email.
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div>
            © {new Date().getFullYear()} <span className="font-bold text-white">ANSUT</span> — Agence Nationale du Service Universel des Télécommunications
          </div>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-white">Mentions légales</a>
            <a href="#" className="hover:text-white">Confidentialité</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-sm transition-all hover:bg-white/10 ${
        highlight
          ? "border-secondary/40 bg-secondary/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className={`mb-2 ${highlight ? "text-secondary" : "text-white/70"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold leading-none text-white">{value}</div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/85">
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
