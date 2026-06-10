import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatBot } from "@/components/ChatBot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  Pin,
  RefreshCw,
  Wifi,
  Phone,
  Bus,
  UtensilsCrossed,
  BedDouble,
  Vote,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { ParticipantBottomNav } from "@/components/ParticipantBottomNav";

/**
 * Sprint B — Salon = centre d'informations pratiques.
 * Contrainte : 0 nouvelle table, 0 nouveau rôle, 0 nouveau flux métier.
 * Réutilisation stricte de l'existant : events, event_announcements, live_polls.
 */
export const Route = createFileRoute("/annonces/$slug")({
  head: () => ({ meta: [{ title: "Salon — ANSUT EVENT" }] }),
  component: SalonPage,
});

type Announcement = {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
};

type Event = {
  id: string;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
};

type ActivePoll = {
  id: string;
  question: string;
  poll_type: string;
  session_id: string;
};

const TYPE_CONFIG: Record<string, { icon: typeof Info; label: string; color: string; bg: string }> =
  {
    info: {
      icon: Info,
      label: "Information",
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
    },
    warning: {
      icon: AlertTriangle,
      label: "Attention",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
    urgent: {
      icon: Bell,
      label: "Urgent",
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
    },
    schedule_change: {
      icon: Clock,
      label: "Changement horaire",
      color: "text-purple-700",
      bg: "bg-purple-50 border-purple-200",
    },
    logistics: {
      icon: MapPin,
      label: "Logistique",
      color: "text-green-700",
      bg: "bg-green-50 border-green-200",
    },
  };

function SalonPage() {
  const { slug } = Route.useParams();
  const { language, setLanguage } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activePolls, setActivePolls] = useState<ActivePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("id, name, slug, starts_at, ends_at, location")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (data) setEvent(data);
      else setLoading(false);
    }
    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (!event) return;

    async function loadData() {
      const now = new Date().toISOString();

      // Annonces
      const { data: ann } = await supabase
        .from("event_announcements")
        .select("id, title, content, announcement_type, is_pinned, published_at, expires_at")
        .eq("event_id", event!.id)
        .lte("published_at", now)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (ann) {
        setAnnouncements(
          ann.filter((a) => !a.expires_at || new Date(a.expires_at) > new Date()),
        );
      }

      // Sondages actifs — bornés aux sessions de l'événement.
      const { data: sessions } = await supabase
        .from("event_sessions")
        .select("id")
        .eq("event_id", event!.id);
      const sessionIds = (sessions ?? []).map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: polls } = await supabase
          .from("live_polls")
          .select("id, question, poll_type, session_id")
          .in("session_id", sessionIds)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        setActivePolls(polls ?? []);
      } else {
        setActivePolls([]);
      }

      setLoading(false);
      setLastRefresh(new Date());
    }

    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [event]);

  function formatRelative(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatEventDates(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const sameDay = s.toDateString() === e.toDateString();
    return sameDay ? fmt(s) : `${fmt(s)} → ${fmt(e)}`;
  }

  if (!loading && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h1 className="text-xl font-bold">Événement introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Vérifiez le lien ou contactez l'organisateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ParticipantBottomNav slug={slug} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Salon</h1>
              {event && <p className="text-sm text-muted-foreground">{event.name}</p>}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher language={language} onLanguageChange={setLanguage} compact />
              {lastRefresh && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  {lastRefresh.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : (
          <>
            {/* ───── 1. Infos pratiques ───── */}
            <section aria-labelledby="infos-pratiques">
              <h2
                id="infos-pratiques"
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Informations pratiques
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Wi-Fi */}
                <InfoCard
                  icon={Wifi}
                  iconClass="text-sky-600 bg-sky-50"
                  title="Wi-Fi"
                >
                  <p>
                    Le code Wi-Fi est communiqué à l'accueil et affiché sur les panneaux
                    d'information du site.
                  </p>
                </InfoCard>

                {/* Horaires & lieu */}
                <InfoCard
                  icon={CalendarDays}
                  iconClass="text-primary bg-primary/10"
                  title="Horaires & lieu"
                >
                  {event && (
                    <>
                      <p className="font-medium text-foreground">
                        {formatEventDates(event.starts_at, event.ends_at)}
                      </p>
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{event.location}</span>
                        </p>
                      )}
                    </>
                  )}
                </InfoCard>

                {/* Contact assistance */}
                <InfoCard
                  icon={Phone}
                  iconClass="text-emerald-600 bg-emerald-50"
                  title="Contact assistance"
                >
                  <p>
                    Pour toute question pendant l'événement, rendez-vous au comptoir
                    d'accueil ou utilisez l'assistant en bas à droite de votre écran.
                  </p>
                </InfoCard>

                {/* Transport */}
                <InfoCard
                  icon={Bus}
                  iconClass="text-indigo-600 bg-indigo-50"
                  title="Transport"
                >
                  <p>
                    Navettes, taxis et accès au site : les informations sont mises à jour
                    par l'organisation dans les annonces ci-dessous.
                  </p>
                </InfoCard>

                {/* Restauration */}
                <InfoCard
                  icon={UtensilsCrossed}
                  iconClass="text-amber-600 bg-amber-50"
                  title="Restauration"
                >
                  <p>
                    Pauses café, déjeuners et cocktails sont signalés dans le programme.
                    Les zones de restauration sont indiquées sur le site.
                  </p>
                </InfoCard>

                {/* Hébergement */}
                <InfoCard
                  icon={BedDouble}
                  iconClass="text-rose-600 bg-rose-50"
                  title="Hébergement"
                >
                  <p>
                    Pour les hôtels partenaires et conditions de réservation, contactez
                    l'organisation à l'accueil.
                  </p>
                </InfoCard>
              </div>
            </section>

            {/* ───── 2. Annonces organisateur ───── */}
            <section aria-labelledby="annonces">
              <h2
                id="annonces"
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Annonces organisateur
              </h2>
              {announcements.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Aucune annonce pour le moment
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Les annonces apparaîtront ici en temps réel
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => {
                    const config = TYPE_CONFIG[ann.announcement_type] || TYPE_CONFIG.info;
                    const Icon = config.icon;
                    return (
                      <article
                        key={ann.id}
                        className={`rounded-xl border p-4 transition ${config.bg} ${
                          ann.is_pinned ? "ring-2 ring-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className={`rounded-lg p-1.5 ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <span className={`text-xs font-medium ${config.color}`}>
                                {config.label}
                              </span>
                              {ann.is_pinned && (
                                <Pin className="ml-1 inline h-3 w-3 text-primary" />
                              )}
                            </div>
                          </div>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelative(ann.published_at)}
                          </time>
                        </div>
                        <h3 className="mt-3 font-semibold text-foreground">{ann.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                          {ann.content}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ───── 3. Sondages actifs ───── */}
            <section aria-labelledby="sondages">
              <h2
                id="sondages"
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Sondages en cours
              </h2>
              {activePolls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-6 text-center">
                  <Vote className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Aucun sondage actif pour le moment
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activePolls.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/poll/$pollId"
                        params={{ pollId: p.id }}
                        className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Vote className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {p.question}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cliquez pour participer
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          <p>Mise à jour automatique toutes les 15 secondes</p>
          {event && (
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              <Link to="/agenda/$slug" params={{ slug }} className="text-primary hover:underline">
                Programme
              </Link>
              <Link
                to="/networking/$slug"
                params={{ slug }}
                className="text-primary hover:underline"
              >
                Participants
              </Link>
              <Link to="/e/$slug" params={{ slug }} className="text-primary hover:underline">
                Accueil
              </Link>
            </div>
          )}
        </footer>
      </main>

      {event && <ChatBot eventName={event.name} eventSlug={slug} language={language} />}
    </div>
  );
}

/* ───── Sous-composant ───── */
function InfoCard({
  icon: Icon,
  iconClass,
  title,
  children,
}: {
  icon: typeof Info;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
