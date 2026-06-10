import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Megaphone,
  Clock,
  MapPin,
  Pin,
  ArrowRight,
  Users,
  IdCard,
  Radio,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MyBadgeCard } from "@/components/MyBadgeCard";

/**
 * Phase 4 — Accueil inscrit, refonte "événement d'abord".
 *
 * Structure (standards Whova / Swapcard / Eventee / Brella) :
 *   1. Maintenant       — session en cours (hero dominant)
 *   2. Ensuite          — prochaine session
 *   3. Alertes          — annonces récentes
 *   4. Réseau           — 3 participants à découvrir
 *   5. Mon badge        — accès secondaire repliable
 *
 * Le participant comprend en moins de 5 s :
 *   où il est, ce qui se passe maintenant, ce qu'il doit faire ensuite.
 */

type Session = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  track: string | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  published_at: string;
};

type Participant = {
  id: string;
  full_name: string;
  organization: string | null;
  position: string | null;
  photo_url: string | null;
  participant_category: string;
};

const TZ = "Africa/Abidjan";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function EventHomeDashboard({
  eventId,
  eventName,
  slug,
  qrToken,
}: {
  eventId: string;
  eventName: string;
  slug: string;
  qrToken: string;
}) {
  const [current, setCurrent] = useState<Session | null>(null);
  const [next, setNext] = useState<Session | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myCategory, setMyCategory] = useState<string | null>(null);
  // Tick : recalcule statut/countdown chaque minute
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();

      const [currRes, nextRes, annRes, partRes, meRes] = await Promise.all([
        supabase
          .from("event_sessions")
          .select("id, title, starts_at, ends_at, location, track")
          .eq("event_id", eventId)
          .lte("starts_at", nowIso)
          .gte("ends_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(1),
        supabase
          .from("event_sessions")
          .select("id, title, starts_at, ends_at, location, track")
          .eq("event_id", eventId)
          .gt("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(1),
        supabase
          .from("event_announcements")
          .select("id, title, content, is_pinned, published_at")
          .eq("event_id", eventId)
          .lte("published_at", nowIso)
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(3),
        supabase.rpc("list_event_networking", { p_slug: slug }),
        supabase.rpc("me_registration", { p_qr_token: qrToken }),
      ]);

      if (cancelled) return;
      setCurrent(((currRes.data ?? [])[0] as Session) ?? null);
      setNext(((nextRes.data ?? [])[0] as Session) ?? null);
      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);

      // Identifier ma catégorie pour prioriser le réseau
      const meRow = Array.isArray(meRes.data) ? meRes.data[0] : meRes.data;
      const myCat: string | null = meRow?.participant_category ?? null;
      const myId: string | null = meRow?.id ?? null;
      setMyCategory(myCat);

      if (partRes.data) {
        const all = (partRes.data as Participant[]).filter(
          (p) => !myId || p.id !== myId,
        );
        // Priorité : même catégorie d'abord
        const sorted = myCat
          ? [...all].sort((a, b) => {
              const aMatch = a.participant_category === myCat ? 1 : 0;
              const bMatch = b.participant_category === myCat ? 1 : 0;
              return bMatch - aMatch;
            })
          : all;
        setParticipants(sorted.slice(0, 3));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, slug, qrToken]);

  // Si rien en cours mais prochaine session dans ≤ 60 min, promouvoir au hero
  const minutesUntilNext = next
    ? Math.round((new Date(next.starts_at).getTime() - nowTs) / 60_000)
    : null;
  const promoteNext =
    !current && next && minutesUntilNext !== null && minutesUntilNext <= 60;

  return (
    <div className="space-y-5">
      {/* Bloc 1 — MAINTENANT */}
      <NowBlock
        eventName={eventName}
        current={current}
        upcoming={promoteNext ? next : null}
        minutesUntilUpcoming={promoteNext ? minutesUntilNext : null}
        slug={slug}
      />

      {/* Bloc 2 — ENSUITE (masqué si la prochaine est déjà dans le hero) */}
      {!promoteNext && (
        <NextBlock session={next} slug={slug} hasCurrent={!!current} />
      )}

      {/* Bloc 3 — ALERTES */}
      <AlertsBlock announcements={announcements} slug={slug} />

      {/* Bloc 4 — RÉSEAU */}
      <NetworkBlock
        participants={participants}
        slug={slug}
        sameCategory={!!myCategory}
      />

      {/* Bloc 5 — BADGE (repliable) */}
      <BadgeBlock qrToken={qrToken} />
    </div>
  );
}


function NowBlock({
  eventName,
  current,
  upcoming,
  minutesUntilUpcoming,
  slug,
}: {
  eventName: string;
  current: Session | null;
  upcoming: Session | null;
  minutesUntilUpcoming: number | null;
  slug: string;
}) {
  // Statut + session à afficher
  const featured = current ?? upcoming;
  const statusLabel = current
    ? "En cours"
    : upcoming && minutesUntilUpcoming !== null
      ? minutesUntilUpcoming <= 0
        ? "Commence maintenant"
        : minutesUntilUpcoming === 1
          ? "Commence dans 1 min"
          : `Commence dans ${minutesUntilUpcoming} min`
      : null;

  return (
    <section
      aria-labelledby="home-now-heading"
      className="rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-6 text-primary-foreground shadow-[var(--shadow-card)] sm:p-8"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/85">
        <span>{eventName}</span>
      </div>

      {featured && statusLabel ? (
        <>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/95">
            {current && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            )}
            {statusLabel}
          </div>
          <h2
            id="home-now-heading"
            className="mt-2 text-xl font-bold leading-tight sm:text-2xl"
          >
            {featured.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-primary-foreground/90">
            {featured.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {featured.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(featured.starts_at)} – {formatTime(featured.ends_at)}
            </span>
          </div>
          <div className="mt-5">
            <Link
              to="/agenda/$slug"
              params={{ slug }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
            >
              <Radio className="h-4 w-4" />
              Voir le programme
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2
            id="home-now-heading"
            className="mt-3 text-xl font-bold leading-tight sm:text-2xl"
          >
            Bienvenue
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/85">
            Aucune session en cours. Consultez le programme pour la prochaine.
          </p>
          <div className="mt-5">
            <Link
              to="/agenda/$slug"
              params={{ slug }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
            >
              <CalendarDays className="h-4 w-4" />
              Voir le programme
            </Link>
          </div>
        </>
      )}
    </section>
  );
}


function NextBlock({
  session,
  slug,
  hasCurrent,
}: {
  session: Session | null;
  slug: string;
  hasCurrent: boolean;
}) {
  if (!session) return null;
  return (
    <Link
      to="/agenda/$slug"
      params={{ slug }}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {hasCurrent ? "Prochaine session" : "Ensuite"}
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">
            {session.title}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(session.starts_at)}
            </span>
            {session.location && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" /> {session.location}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function AlertsBlock({
  announcements,
  slug,
}: {
  announcements: Announcement[];
  slug: string;
}) {
  if (announcements.length === 0) return null;
  const last = announcements[0];
  return (
    <div className="block rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Megaphone className="h-3.5 w-3.5 text-primary" />
        {announcements.length === 1
          ? "1 annonce"
          : `${announcements.length} nouvelles annonces`}
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {last.is_pinned && (
              <Pin className="h-3 w-3 shrink-0 text-amber-600" />
            )}
            <div className="truncate text-sm font-bold text-foreground">
              {last.title}
            </div>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {last.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function NetworkBlock({
  participants,
  slug,
  sameCategory,
}: {
  participants: Participant[];
  slug: string;
  sameCategory: boolean;
}) {
  if (participants.length === 0) return null;
  const label = sameCategory
    ? `${participants.length} personnes de votre catégorie`
    : `${participants.length} personnes à découvrir`;
  return (
    <Link
      to="/networking/$slug"
      params={{ slug }}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Users className="mr-1 inline h-3.5 w-3.5 text-primary" />
          {label}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-card bg-primary/10 text-xs font-bold text-primary"
              title={p.full_name}
            >
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                p.full_name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase()
              )}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          {participants
            .map((p) => p.full_name.split(" ")[0])
            .join(" · ")}
        </div>
      </div>
    </Link>
  );
}

function BadgeBlock({ qrToken }: { qrToken: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground select-none">
        <IdCard className="h-4 w-4 text-primary" />
        Mon badge
        <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
          Agrandir
        </span>
        <span className="ml-auto hidden text-xs font-normal text-muted-foreground group-open:inline">
          Réduire
        </span>
      </summary>
      <div className="mt-4">
        <MyBadgeCard qrToken={qrToken} />
      </div>
    </details>
  );
}
