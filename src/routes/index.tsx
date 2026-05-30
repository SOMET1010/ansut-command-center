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
  Send,
  PlayCircle,
  MapPin,
  Smartphone,
  FileCheck2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          "Inscriptions, accréditations, badges QR, agenda, live polling et analytics en temps réel pour le Salon International des Technologies de l'Éducation et de la Formation.",
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
    items: ["Génération de badges QR", "Contrôle d'accès en temps réel", "Gestion des accès"],
    href: "/checkin" as const,
    cta: "Voir les accès",
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
      {/* HERO */}
      <section className="relative overflow-hidden bg-[oklch(0.18_0.06_250)] text-white">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            width={1920}
            height={1080}
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.18_0.06_250)]/85 via-[oklch(0.18_0.06_250)]/70 to-[oklch(0.18_0.06_250)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6">
          {/* NAV */}
          <header className="flex items-center justify-between py-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white font-bold backdrop-blur">
                A
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold tracking-wide">ANSUT EVENT</div>
                <div className="text-xs text-white/70">Plateforme officielle du SUTEL</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 lg:flex">
              <Link to="/" className="border-b-2 border-accent pb-1 text-white">Accueil</Link>
              <Link to="/events" className="hover:text-white">Programme</Link>
              <Link to="/participants" className="hover:text-white">Participants</Link>
              <Link to="/events" className="hover:text-white">Conférences</Link>
              <Link to="/events" className="hover:text-white">Exposition</Link>
              <Link to="/events" className="hover:text-white">Partenaires</Link>
              <Link to="/dashboard" className="hover:text-white">Statistiques</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/signup">Créer un compte</Link>
              </Button>
            </div>
          </header>

          {/* Hero content */}
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-md bg-accent px-3 py-1 font-semibold text-accent-foreground">
                  {ev?.name?.includes("SUTEL") ? ev.name : "SUTEL 2026"}
                </span>
                <span className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-4 w-4" />
                  {formatDates(ev?.starts_at, ev?.ends_at)}
                </span>
                {ev?.location && (
                  <span className="flex items-center gap-2 text-white/80">
                    <MapPin className="h-4 w-4" />
                    {ev.location}
                  </span>
                )}
              </div>

              <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] sm:text-6xl">
                Plateforme officielle
                <br />
                du <span className="text-accent">SUTEL 2026</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg text-white/75">
                Gérez les inscriptions, accréditations, conférences, badges QR, accès, live polling
                et analytics en temps réel.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {ev?.slug ? (
                    <Link to="/e/$slug" params={{ slug: ev.slug }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      S'inscrire au SUTEL 2026
                    </Link>
                  ) : (
                    <Link to="/signup">
                      <Calendar className="mr-2 h-4 w-4" />
                      S'inscrire au SUTEL 2026
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/events">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Découvrir la plateforme
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={Users} label="Participants inscrits" value={stats.participants.toLocaleString("fr-FR")} />
                <StatCard icon={QrCode} label="Badges générés" value={stats.badges.toLocaleString("fr-FR")} />
                <StatCard icon={Mic} label="Conférences" value={stats.conferences.toString()} sub="programmées" />
                <StatCard icon={Building2} label="Partenaires" value={stats.partners.toString()} sub="institutions" />
                <StatCard
                  icon={BarChart3}
                  label="Taux de présence"
                  value={`${stats.attendanceRate}%`}
                  sub="En temps réel"
                  highlight
                />
              </div>
            </div>

            {/* Programme du jour */}
            <aside className="rounded-2xl bg-white p-5 text-foreground shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Programme du jour</h2>
                <Link to="/events" className="text-sm font-medium text-primary hover:underline">
                  Voir tout
                </Link>
              </div>

              <ul className="mt-4 space-y-3">
                {data.agenda.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Aucun événement programmé pour le moment.
                  </li>
                )}
                {data.agenda.map((item) => {
                  const r = formatRange(item.starts_at, item.ends_at);
                  return (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
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

              <Button asChild className="mt-4 w-full">
                <Link to="/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir le programme complet
                </Link>
              </Button>
            </aside>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Tout en un seul endroit
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Une plateforme complète pour un événement réussi
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {f.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={f.href}
                  className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {f.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGE + NEWSLETTER */}
      <section className="bg-secondary/40 pb-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Badge */}
          <div className="grid gap-6 rounded-2xl bg-primary p-8 text-primary-foreground sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex h-32 w-24 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Votre badge, votre accès</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Téléchargez votre badge QR et accédez facilement à tous les espaces du SUTEL 2026.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <BadgeStep icon={FileCheck2} num="1" title="Inscription" desc="Créez votre compte en quelques clics" />
                <BadgeStep icon={CheckCircle2} num="2" title="Validation" desc="Votre demande est examinée et validée" />
                <BadgeStep icon={KeyRound} num="3" title="Accès" desc="Recevez votre badge QR par email" />
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col justify-center rounded-2xl bg-card p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold">Restez informé</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recevez les dernières actualités, mises à jour et annonces du SUTEL.
            </p>
            <div className="mt-4 flex gap-2">
              <Input type="email" required placeholder="Votre adresse email" />
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                S'abonner
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-medium text-primary">Ils nous font confiance</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {partners.map((p) => (
              <span
                key={p}
                className="text-base font-bold uppercase tracking-wider text-muted-foreground/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ANSUT — Agence Nationale du Service Universel des
          Télécommunications
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent/20 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-white/70">{label}</div>
      <div className="mt-0.5 text-2xl font-bold">{value}</div>
      {sub && (
        <div className={`mt-0.5 text-xs ${highlight ? "text-[oklch(0.78_0.18_150)]" : "text-white/60"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function BadgeStep({
  icon: Icon,
  num,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">
          {num}. {title}
        </p>
        <p className="text-xs text-primary-foreground/75">{desc}</p>
      </div>
    </div>
  );
}
