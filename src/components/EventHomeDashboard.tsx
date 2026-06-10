import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Users,
  MessageSquare,
  User,
  Megaphone,
  Clock,
  MapPin,
  Pin,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Phase 4 — Accueil inscrit simplifié.
 *
 * 4 blocs sous le badge :
 *   1. Ma prochaine action (statique, dérivée de status)
 *   2. Programme du jour (2-3 prochaines sessions du jour)
 *   3. Annonces importantes (1-2 dernières, épinglées en priorité)
 *   4. Accès rapides (4 tuiles)
 *
 * Pas de logique métier complexe (cf. mémoire Phase 4.1).
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
  announcement_type: string;
  is_pinned: boolean;
  published_at: string;
};

const TZ = "Africa/Abidjan";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

function todayBoundsAbidjan() {
  // Borne large : on prend la journée locale Abidjan
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const ymd = fmt.format(now); // YYYY-MM-DD
  const start = new Date(`${ymd}T00:00:00+00:00`);
  // Africa/Abidjan = UTC+0, donc pas d'offset à appliquer
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function EventHomeDashboard({
  eventId,
  slug,
  isCheckedIn,
}: {
  eventId: string;
  slug: string;
  isCheckedIn: boolean;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { start, end } = todayBoundsAbidjan();
      const nowIso = new Date().toISOString();

      const [sessRes, annRes] = await Promise.all([
        supabase
          .from("event_sessions")
          .select("id, title, starts_at, ends_at, location, track")
          .eq("event_id", eventId)
          .gte("ends_at", nowIso)
          .lt("starts_at", end)
          .gte("starts_at", start)
          .order("starts_at", { ascending: true })
          .limit(3),
        supabase
          .from("event_announcements")
          .select("id, title, content, announcement_type, is_pinned, published_at")
          .eq("event_id", eventId)
          .lte("published_at", nowIso)
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(2),
      ]);

      if (cancelled) return;
      if (sessRes.data) setSessions(sessRes.data as Session[]);
      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className="space-y-6">
      {/* 1. Ma prochaine action */}
      <NextActionBlock slug={slug} isCheckedIn={isCheckedIn} />

      {/* 2. Programme du jour */}
      <section
        aria-labelledby="home-program-heading"
        className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="home-program-heading"
            className="flex items-center gap-2 text-base font-bold text-foreground"
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            Programme du jour
          </h2>
          <Link
            to="/agenda/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </header>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune session prévue aujourd’hui.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-center">
                    <div className="text-sm font-bold leading-none text-primary">
                      {formatTime(s.starts_at)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {s.title}
                    </div>
                    {s.location && (
                      <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Annonces importantes */}
      <section
        aria-labelledby="home-ann-heading"
        className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="home-ann-heading"
            className="flex items-center gap-2 text-base font-bold text-foreground"
          >
            <Megaphone className="h-4 w-4 text-primary" />
            Annonces importantes
          </h2>
          <Link
            to="/annonces/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Toutes <ArrowRight className="h-3 w-3" />
          </Link>
        </header>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune annonce pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/60 bg-background p-3">
                <div className="flex items-center gap-2">
                  {a.is_pinned && (
                    <Pin className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Épinglée" />
                  )}
                  <h3 className="truncate text-sm font-semibold text-foreground">{a.title}</h3>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(a.published_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: TZ,
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Accès rapides */}
      <section
        aria-labelledby="home-quick-heading"
        className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <h2
          id="home-quick-heading"
          className="mb-3 text-base font-bold text-foreground"
        >
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickTile
            to="/agenda/$slug"
            params={{ slug }}
            icon={CalendarDays}
            label="Programme"
          />
          <QuickTile
            to="/networking/$slug"
            params={{ slug }}
            icon={Users}
            label="Participants"
          />
          <QuickTile
            to="/annonces/$slug"
            params={{ slug }}
            icon={MessageSquare}
            label="Salon"
          />
          <QuickTile to="/me/role" icon={User} label="Mon Profil" />
        </div>
      </section>
    </div>
  );
}

function NextActionBlock({ slug, isCheckedIn }: { slug: string; isCheckedIn: boolean }) {
  if (isCheckedIn) {
    return (
      <Link
        to="/agenda/$slug"
        params={{ slug }}
        className="group block rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-[var(--shadow-card)] transition-colors hover:bg-primary/10"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Ma prochaine action
            </div>
            <div className="mt-1 text-base font-bold text-foreground">
              Consultez le programme du jour
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 shadow-[var(--shadow-card)] dark:border-amber-500/30 dark:bg-amber-950/30">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
          <ScanLine className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
            Ma prochaine action
          </div>
          <div className="mt-1 text-base font-bold text-foreground">
            Présentez votre badge à l’accueil
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Le QR ci-dessus sera scanné pour votre check-in.
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickTile({
  to,
  params,
  icon: Icon,
  label,
}: {
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      params={params}
      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </Link>
  );
}
