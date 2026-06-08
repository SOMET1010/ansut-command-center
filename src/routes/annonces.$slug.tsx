import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatBot } from "@/components/ChatBot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertTriangle, Info, Clock, MapPin, Pin, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/annonces/$slug")({
  head: () => ({ meta: [{ title: "Annonces — ANSUT EVENT" }] }),
  component: AnnoncesPage,
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

function AnnoncesPage() {
  const { slug } = Route.useParams();
  const { language, setLanguage, t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Charger l'événement
  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("id, name, slug, starts_at, ends_at, location")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (data) setEvent(data);
    }
    loadEvent();
  }, [slug]);

  // Charger les annonces et rafraîchir toutes les 10 secondes
  useEffect(() => {
    if (!event) return;

    async function loadAnnouncements() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("event_announcements")
        .select("id, title, content, announcement_type, is_pinned, published_at, expires_at")
        .eq("event_id", event!.id)
        .lte("published_at", now)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (data) {
        // Filtrer les annonces expirées côté client
        const active = data.filter((a) => !a.expires_at || new Date(a.expires_at) > new Date());
        setAnnouncements(active);
      }
      setLoading(false);
      setLastRefresh(new Date());
    }

    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 10000);
    return () => clearInterval(interval);
  }, [event]);

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

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

  // Événement non trouvé
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
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Annonces</h1>
              {event && <p className="text-sm text-muted-foreground">{event.name}</p>}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher language={language} onLanguageChange={setLanguage} compact />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                {lastRefresh.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">Aucune annonce pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Les annonces de l'organisateur apparaîtront ici en temps réel
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  {/* Header de l'annonce */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-1.5 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {ann.is_pinned && <Pin className="ml-1 inline h-3 w-3 text-primary" />}
                      </div>
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(ann.published_at)}
                    </time>
                  </div>

                  {/* Contenu */}
                  <h2 className="mt-3 font-semibold text-foreground">{ann.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                    {ann.content}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <p>Mise à jour automatique toutes les 10 secondes</p>
          {event && (
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              <Link to="/agenda/$slug" params={{ slug }} className="text-primary hover:underline">
                Programme
              </Link>
              <Link to="/networking/$slug" params={{ slug }} className="text-primary hover:underline">
                Annuaire
              </Link>
              <Link to="/e/$slug" params={{ slug }} className="text-primary hover:underline">
                Inscription
              </Link>
            </div>
          )}
        </footer>
      </main>

      {/* Chatbot IA flottant */}
      {event && <ChatBot eventName={event.name} eventSlug={slug} language={language} />}
    </div>
  );
}
