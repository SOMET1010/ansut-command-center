import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  Building2,
  IdCard,
  UserPlus,
  CreditCard,
  ScanLine,
  HelpCircle,
  Linkedin,
  Facebook,
  Youtube,
} from "lucide-react";

import { getLandingData } from "@/lib/landing.functions";
import heroImage from "@/assets/hero-conference.jpg";
import { cn } from "@/lib/utils";

// Wordmark vert spécifique à la landing (le logo officiel bleu jure avec la palette).
function GreenWordmark({ color = "#1F4D3A", light = false }: { color?: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: light ? "rgba(255,255,255,0.15)" : `${color}14` }}
      >
        <span className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: light ? "#ffffff" : color, opacity: 0.85 - (i % 3) * 0.15 }}
            />
          ))}
        </span>
      </span>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ color: light ? "#ffffff" : color, fontFamily: "'Instrument Serif', serif" }}
      >
        ANSUT
      </span>
    </div>
  );
}

// Palette maquette : vert foncé + or sur fond crème.
const GREEN = "#1F4D3A";
const GREEN_DARK = "#173829";
const GOLD = "#C9A24C";
const CREAM = "#F5EFE6";

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
      color: { dark: GREEN, light: "#ffffff" },
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
          "Inscriptions, badges QR, agenda et exposition pour le Salon Universel des Télécommunications.",
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

function Landing() {
  const { data } = useSuspenseQuery(landingQueryOptions);
  const ev = data.featuredEvent;

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
    <div className="min-h-dvh" style={{ backgroundColor: CREAM }}>
      {/* BANDEAU OFFICIEL */}
      <div
        className="fixed top-0 z-[60] w-full border-b backdrop-blur-md"
        style={{ backgroundColor: `${CREAM}f2`, borderColor: `${GREEN}1a` }}
      >
        <div
          className="mx-auto flex h-8 max-w-7xl items-center justify-center px-4 text-[10px] font-medium uppercase tracking-[0.18em] sm:px-6"
          style={{ color: `${GREEN}b3` }}
        >
          <span className="hidden sm:inline">
            République de Côte d'Ivoire · Ministère de la Transition Numérique et de l'Innovation Technologique
          </span>
          <span className="sm:hidden">RCI · MTNIT</span>
        </div>
      </div>

      {/* NAV */}
      <nav
        className="fixed top-8 z-50 w-full border-b backdrop-blur-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", borderColor: `${GREEN}1a` }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <GreenWordmark />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {["Programme", "Exposition", "Partenaires"].map((label) => (
              <ProgrammeLink
                key={label}
                className="text-[13px] font-medium transition hover:opacity-100"
              >
                <span style={{ color: GREEN }}>{label}</span>
              </ProgrammeLink>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/signup"
              className="inline-flex h-9 items-center rounded-full px-5 text-[13px] font-semibold text-white shadow-sm transition-colors"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A88838")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
            >
              Obtenir mon badge
            </Link>
          </div>

        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pb-10 pt-28 lg:pb-14 lg:pt-32" style={{ color: GREEN }}>
        <div
          className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${GREEN} 0%, transparent 60%)` }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div
                className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: `${GREEN}99` }}
              >
                <span className="h-px w-10" style={{ backgroundColor: GOLD }} />
                <span>IIIᵉ Édition · Salon Universel des Télécommunications</span>
              </div>

              <h1
                className="mt-5 text-6xl font-bold leading-[0.95] tracking-[-0.025em] sm:text-7xl lg:text-[88px]"
                style={{ fontFamily: "'Instrument Serif', serif", color: GREEN }}
              >
                SUTEL 2026
              </h1>
              <p
                className="mt-3 text-2xl italic sm:text-3xl"
                style={{ fontFamily: "'Instrument Serif', serif", color: GOLD }}
              >
                Le rendez-vous du service universel.
              </p>

              <p className="mt-5 max-w-lg text-base leading-relaxed" style={{ color: `${GREEN}b3` }}>
                Rassembler les acteurs, valoriser les innovations et accélérer l'inclusion numérique pour tous.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {ev?.slug ? (
                  <Link
                    to="/e/$slug"
                    params={{ slug: ev.slug }}
                    className="inline-flex items-center rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A88838")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
                  >
                    Obtenir mon badge
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A88838")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
                  >
                    Obtenir mon badge
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
                <ProgrammeLink
                  className="inline-flex items-center rounded-xl border-2 border-[#C9A24C] bg-transparent px-5 py-3 text-[15px] font-semibold transition-colors hover:bg-[#C9A24C]/10"
                >
                  <span style={{ color: GOLD }}>Consulter le programme</span>
                </ProgrammeLink>
              </div>

            </div>

            <aside className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl shadow-[0_20px_60px_-20px_rgba(31,77,58,0.3)]">
                <img
                  src={heroImage}
                  alt="Vue d'un centre de conférence avec participants"
                  className="h-[380px] w-full object-cover lg:h-[420px]"
                />

                <div
                  className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-2xl px-8 py-4 text-center backdrop-blur-sm"
                  style={{ backgroundColor: `${GREEN}f2` }}
                >
                  <ScanLine className="mb-1.5 h-5 w-5" style={{ color: GOLD }} />
                  <div className="font-bold leading-none text-white">
                    <span className="text-2xl">1 200</span>
                    <span style={{ color: GOLD }}>+</span>
                  </div>
                  <div className="mt-1.5 text-[10px] uppercase tracking-wider text-white/80">
                    participants attendus
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* BANDEAU INFO */}
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="grid grid-cols-1 gap-6 rounded-2xl bg-white px-8 py-5 shadow-sm sm:grid-cols-3 sm:gap-0"
            style={{ boxShadow: "0 4px 20px -8px rgba(31,77,58,0.12)" }}
          >
            <InfoItem
              icon={<Calendar className="h-6 w-6" strokeWidth={1.5} />}
              title="15 – 17 septembre 2026"
              subtitle="Trois jours d'échanges et d'innovations"
              border
            />
            <InfoItem
              icon={<MapPin className="h-6 w-6" strokeWidth={1.5} />}
              title="Abidjan, Côte d'Ivoire"
              subtitle="Sofitel Abidjan Hôtel Ivoire"
              border
            />
            <InfoItem
              icon={<ShieldCheck className="h-6 w-6" strokeWidth={1.5} />}
              title="Sous l'égide de l'UAT"
              subtitle="Union Africaine des Télécommunications"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-12">
        {/* feuille décorative gauche */}
        <div
          className="pointer-events-none absolute -left-8 top-32 hidden h-64 w-64 opacity-30 lg:block"
          style={{
            background: `radial-gradient(ellipse, ${GREEN}40 0%, transparent 70%)`,
            borderRadius: "60% 40% 50% 50%",
          }}
        />
        {/* points décoratifs droite */}
        <div className="pointer-events-none absolute right-8 top-32 hidden lg:block">
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 48 }).map((_, i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: `${GOLD}66` }}
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: GOLD }}
            >
              Notre plateforme
            </p>
            <h2
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif", color: GREEN }}
            >
              Une plateforme complète
              <br />
              pour un événement d'envergure
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<CalendarDays className="h-6 w-6" strokeWidth={1.5} />}
              title="Programme"
              desc="Conférences, panels et ateliers avec des experts de premier plan."
              cta="Découvrir"
              href={ev?.slug ? `/e/${ev.slug}/agenda` : "/signup"}
            />
            <FeatureCardCenter ev={ev} />
            <FeatureCard
              icon={<Building2 className="h-6 w-6" strokeWidth={1.5} />}
              title="Exposition"
              desc="Découvrez les innovations et solutions des exposants."
              cta="Explorer"
              href={ev?.slug ? `/e/${ev.slug}/agenda` : "/signup"}
            />
          </div>
        </div>
      </section>

      {/* 3 ÉTAPES */}
      <section className="pb-16 pt-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
              Votre badge en 3 étapes
            </p>
            <h2
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif", color: GREEN }}
            >
              Simple, rapide, sécurisé
            </h2>
          </div>

          <div
            className="mt-10 rounded-3xl bg-white px-8 py-9"
            style={{ boxShadow: "0 4px 24px -10px rgba(31,77,58,0.15)" }}
          >
            <div className="grid gap-10 md:grid-cols-3">
              <StepCard
                num="1"
                icon={<UserPlus className="h-8 w-8" strokeWidth={1.5} />}
                title="Inscription"
                desc="Créez votre compte et renseignez vos informations."
              />
              <StepCard
                num="2"
                icon={<CreditCard className="h-8 w-8" strokeWidth={1.5} />}
                title="Paiement"
                desc="Réglez en ligne de manière sécurisée."
              />
              <StepCard
                num="3"
                icon={<ScanLine className="h-8 w-8" strokeWidth={1.5} />}
                title="Badge QR"
                desc="Recevez votre badge par email et accédez à l'événement."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-sm text-white" style={{ backgroundColor: GREEN_DARK }}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Col 1 : logo + tagline + social */}
            <div>
              <GreenWordmark light />
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                L'Autorité Nationale du Service Universel des Télécommunications — Côte d'Ivoire.
              </p>
              <div className="mt-5 flex gap-3">
                <SocialIcon href="#" label="LinkedIn"><Linkedin className="h-4 w-4" /></SocialIcon>
                <SocialIcon href="#" label="Facebook"><Facebook className="h-4 w-4" /></SocialIcon>
                <SocialIcon href="#" label="YouTube"><Youtube className="h-4 w-4" /></SocialIcon>
              </div>
            </div>

            {/* Col 2 : Liens utiles */}
            <FooterCol title="Liens utiles" links={[
              { label: "À propos de l'ANSUT", href: "#" },
              { label: "Documents officiels", href: "#" },
              { label: "Presse", href: "#" },
              { label: "FAQ", href: "#" },
            ]} />

            {/* Col 3 : Informations */}
            <FooterCol title="Informations" links={[
              { label: "Programme", href: "#" },
              { label: "Exposition", href: "#" },
              { label: "Partenaires", href: "#" },
              { label: "Contact", href: "mailto:support@ansut.ci" },
            ]} />

            {/* Col 4 : CTA carte */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: GOLD }}
            >
              <HelpCircle className="h-7 w-7 text-white/90" strokeWidth={1.5} />
              <h4 className="mt-3 font-bold text-white">Une question ?</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-white/85">
                Notre équipe est à votre disposition pour vous accompagner.
              </p>
              <a
                href="mailto:support@ansut.ci"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:gap-2 transition-all"
              >
                Nous contacter <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/60 md:flex-row">
            <div>© {new Date().getFullYear()} ANSUT — Tous droits réservés</div>
            <div className="flex gap-6">
              <Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link>
              <Link to="/politique-confidentialite" className="hover:text-white">Politique de confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoItem({
  icon,
  title,
  subtitle,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        border && "sm:border-r",
      )}
      style={{ borderColor: `${GREEN}1a` }}
    >
      <div style={{ color: GREEN }}>{icon}</div>
      <div>
        <div className="text-sm font-bold" style={{ color: GREEN }}>{title}</div>
        <div className="mt-0.5 text-xs" style={{ color: `${GREEN}99` }}>{subtitle}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div
      className="group flex flex-col rounded-2xl bg-white p-7 transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "0 2px 14px -6px rgba(31,77,58,0.1)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: `${GREEN}14`, color: GREEN }}
      >
        {icon}
      </div>
      <h3
        className="mt-5 text-2xl font-bold"
        style={{ fontFamily: "'Instrument Serif', serif", color: GREEN }}
      >
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: `${GREEN}b3` }}>
        {desc}
      </p>
      <Link
        to="/signup"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2"
        style={{ color: GOLD }}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FeatureCardCenter({ ev }: { ev: { slug?: string } | null | undefined }) {
  return (
    <div
      className="group relative flex flex-col rounded-2xl p-7 text-white transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: GREEN, boxShadow: "0 8px 30px -10px rgba(31,77,58,0.4)" }}
    >
      {/* Illustration badge */}
      <div className="flex justify-center pb-4">
        <div className="relative">
          {/* lanyard */}
          <div className="absolute left-1/2 top-0 h-6 w-1 -translate-x-1/2" style={{ backgroundColor: GOLD }} />
          <div className="relative mt-5 flex h-40 w-28 flex-col items-center rounded-xl bg-white p-3 shadow-lg">
            <div className="h-1 w-8 rounded-full bg-slate-200" />
            <div className="mt-3 h-16 w-16">
              <SampleBadgeQr />
            </div>
            <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: `${GREEN}33` }} />
            <div className="mt-1 h-1 w-10 rounded-full" style={{ backgroundColor: `${GREEN}22` }} />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Badge QR
          </h3>
          <IdCard className="h-5 w-5 text-white/60" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Votre accréditation rapide et sécurisée en 3 étapes simples.
        </p>
        {ev?.slug ? (
          <Link
            to="/e/$slug"
            params={{ slug: ev.slug }}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2"
            style={{ color: GOLD }}
          >
            En savoir plus <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/signup"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2"
            style={{ color: GOLD }}
          >
            En savoir plus <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function StepCard({
  num,
  icon,
  title,
  desc,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="relative shrink-0">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${GOLD}1f`, color: GREEN }}
        >
          {icon}
        </div>
        <div
          className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: GREEN }}
        >
          {num}
        </div>
      </div>
      <div className="pt-2">
        <h4
          className="text-xl font-bold"
          style={{ fontFamily: "'Instrument Serif', serif", color: GREEN }}
        >
          {title}
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: `${GREEN}b3` }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-bold text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-white/75 transition hover:text-white">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white"
    >
      {children}
    </a>
  );
}
