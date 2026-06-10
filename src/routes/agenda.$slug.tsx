import { createFileRoute, Link } from "@tanstack/react-router";
import { ParticipantBottomNav } from "@/components/ParticipantBottomNav";
import { ChatBot } from "@/components/ChatBot";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  Bookmark,
  BookmarkCheck,
  Mic2,
  Coffee,
  Users,
  Award,
  Compass,
  Presentation,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ─── Types ─── */
type Session = {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  track: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  speakers: { full_name: string; title: string | null; organization: string | null }[];
};

const SESSION_TYPES: Record<string, { label: string; icon: typeof Mic2; color: string }> = {
  keynote: { label: "Keynote", icon: Mic2, color: "bg-purple-100 text-purple-800" },
  panel: { label: "Panel", icon: Users, color: "bg-blue-100 text-blue-800" },
  workshop: { label: "Atelier", icon: Presentation, color: "bg-green-100 text-green-800" },
  networking: { label: "Networking", icon: Users, color: "bg-orange-100 text-orange-800" },
  break: { label: "Pause", icon: Coffee, color: "bg-gray-100 text-gray-600" },
  ceremony: { label: "Cérémonie", icon: Award, color: "bg-yellow-100 text-yellow-800" },
  visit: { label: "Visite", icon: Compass, color: "bg-teal-100 text-teal-800" },
};

/* ─── Route ─── */
export const Route = createFileRoute("/agenda/$slug")({
  component: AgendaPage,
});

function AgendaPage() {
  const { slug } = Route.useParams();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  // Token participant — source unique partagée avec l'Accueil et le Profil.
  // Ordre : URL ?token=... > localStorage canonique `ansut:badge:{slug}` > legacy.
  const [myToken, setMyToken] = useState(() => {
    if (typeof window === "undefined") return "";
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken && /^[0-9a-f-]{20,}$/i.test(urlToken)) {
      window.localStorage.setItem(`ansut:badge:${slug}`, urlToken);
      return urlToken;
    }
    return (
      window.localStorage.getItem(`ansut:badge:${slug}`) ||
      window.localStorage.getItem("ansut_participant_token") ||
      ""
    );
  });
  const [showMyAgenda, setShowMyAgenda] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Charger l'événement
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event-agenda", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, starts_at, ends_at, location")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Charger les sessions avec speakers
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data: sessionsData, error } = await supabase
        .from("event_sessions")
        .select(
          "id, title, description, session_type, track, location, starts_at, ends_at, capacity, sort_order",
        )
        .eq("event_id", event!.id)
        .order("starts_at", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;

      // Charger les speakers pour chaque session
      const { data: sessionSpeakers } = await supabase
        .from("event_session_speakers")
        .select("session_id, speaker_id, role")
        .in(
          "session_id",
          sessionsData.map((s) => s.id),
        );

      const { data: speakers } = await supabase
        .from("event_speakers")
        .select("id, full_name, title, organization")
        .eq("event_id", event!.id);

      const speakersMap = new Map(speakers?.map((s) => [s.id, s]) || []);

      return sessionsData.map((session) => ({
        ...session,
        speakers: (sessionSpeakers || [])
          .filter((ss) => ss.session_id === session.id)
          .map((ss) => speakersMap.get(ss.speaker_id))
          .filter(Boolean) as Session["speakers"],
      }));
    },
  });

  // Charger mes bookmarks si token fourni
  const { data: myParticipant } = useQuery({
    queryKey: ["my-participant-agenda", myToken, event?.id],
    enabled: !!myToken && !!event?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("me_registration", { p_qr_token: myToken });
      const me = Array.isArray(data) && data[0] ? data[0] : null;
      if (!me || me.event_id !== event!.id) return null;
      return { id: me.id };
    },
  });

  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ["my-bookmarks", myParticipant?.id, event?.id],
    enabled: !!myParticipant?.id && !!event?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("list_my_bookmarks", {
        p_qr_token: myToken,
        p_event_id: event!.id,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((b: any) => b.session_id) as string[];
    },
  });

  const toggleBookmark = async (sessionId: string) => {
    if (!myParticipant?.id) return;
    const isBookmarked = bookmarks.includes(sessionId);
    await supabase.rpc("toggle_my_bookmark", {
      p_qr_token: myToken,
      p_session_id: sessionId,
      p_add: !isBookmarked,
    });
    refetchBookmarks();
  };

  // Grouper par jour
  const days = useMemo(() => {
    const dayMap = new Map<string, Session[]>();
    sessions.forEach((s) => {
      const day = new Date(s.starts_at).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(s);
    });
    return Array.from(dayMap.entries());
  }, [sessions]);

  // Filtrage
  const filteredDays = useMemo(() => {
    return days
      .filter(([day]) => dayFilter === "all" || day === dayFilter)
      .map(
        ([day, daySessions]) =>
          [
            day,
            daySessions.filter((s) => {
              const matchSearch =
                search === "" ||
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.speakers.some((sp) => sp.full_name.toLowerCase().includes(search.toLowerCase()));
              const matchType = typeFilter === "all" || s.session_type === typeFilter;
              const matchBookmark = !showMyAgenda || bookmarks.includes(s.id);
              return matchSearch && matchType && matchBookmark;
            }),
          ] as [string, Session[]],
      )
      .filter(([, s]) => s.length > 0);
  }, [days, search, typeFilter, dayFilter, showMyAgenda, bookmarks]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // ─── Loading ───
  if (eventLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-lg">Événement introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ParticipantBottomNav slug={slug} />
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{event.name}</h1>
            </div>

          </div>
          {event.location && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5 ml-8">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </p>
          )}
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Identification participant (pour bookmarks) — affichée uniquement
            si aucun token n'est connu. Lorsque le participant arrive depuis
            l'Accueil ou un lien ?token=..., on n'affiche rien : son agenda
            personnalisé est déjà disponible. */}
        {!myToken && !myParticipant && (
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-600 mb-2">
              Vous n'avez pas encore de badge ? <Link to="/e/$slug" params={{ slug }} className="text-primary font-medium underline">Inscrivez-vous</Link>, ou collez votre code badge ci-dessous pour personnaliser votre agenda :
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Code badge (UUID)"
                value={myToken}
                onChange={(e) => setMyToken(e.target.value)}
                className="flex-1"
              />
              <button
                onClick={() => {
                  if (myToken) localStorage.setItem(`ansut:badge:${slug}`, myToken);
                }}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Valider
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une session ou un intervenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres jour */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDayFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                dayFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tous les jours
            </button>
            {days.map(([day]) => (
              <button
                key={day}
                onClick={() => setDayFilter(day)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  dayFilter === day
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Filtres type */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                typeFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tous
            </button>
            {Object.entries(SESSION_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  typeFilter === key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Toggle Mon Agenda */}
          {myParticipant && (
            <button
              onClick={() => setShowMyAgenda(!showMyAgenda)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                showMyAgenda
                  ? "bg-ansut-orange text-white"
                  : "bg-orange-50 text-ansut-orange hover:bg-orange-100"
              }`}
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              Mon agenda ({bookmarks.length})
            </button>
          )}
        </div>

        {/* Programme */}
        {filteredDays.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune session trouvée</p>
          </div>
        ) : (
          filteredDays.map(([day, daySessions]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 capitalize sticky top-[85px] bg-gray-50 py-2 z-10">
                {day}
              </h2>
              <div className="space-y-2">
                {daySessions.map((session) => {
                  const typeInfo = SESSION_TYPES[session.session_type] || SESSION_TYPES.panel;
                  const Icon = typeInfo.icon;
                  const isExpanded = expandedSession === session.id;
                  const isBookmarked = bookmarks.includes(session.id);

                  return (
                    <div
                      key={session.id}
                      className={`bg-white rounded-xl border transition-all ${
                        isBookmarked ? "border-ansut-orange/30 ring-1 ring-ansut-orange/10" : ""
                      }`}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Horaire */}
                          <div className="flex-shrink-0 text-center min-w-[52px]">
                            <p className="text-sm font-bold text-primary">
                              {formatTime(session.starts_at)}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatTime(session.ends_at)}
                            </p>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${typeInfo.color}`}
                              >
                                <Icon className="h-3 w-3" />
                                {typeInfo.label}
                              </span>
                              {session.track && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {session.track}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                              {session.title}
                            </h3>
                            {session.speakers.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {session.speakers.map((s) => s.full_name).join(", ")}
                              </p>
                            )}
                            {session.location && (
                              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {myParticipant && session.session_type !== "break" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(session.id);
                                }}
                                className={`p-1.5 rounded-full transition-colors ${
                                  isBookmarked
                                    ? "text-ansut-orange bg-orange-50"
                                    : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                                }`}
                                aria-label={
                                  isBookmarked ? "Retirer de mon agenda" : "Ajouter à mon agenda"
                                }
                              >
                                {isBookmarked ? (
                                  <BookmarkCheck className="h-4 w-4" />
                                ) : (
                                  <Bookmark className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Détails expandés */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t mx-4 mt-0 pt-3">
                          {session.description && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                              {session.description}
                            </p>
                          )}
                          {session.speakers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Intervenants
                              </p>
                              {session.speakers.map((sp, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-primary">
                                      {sp.full_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {sp.full_name}
                                    </p>
                                    {(sp.title || sp.organization) && (
                                      <p className="text-[11px] text-gray-500">
                                        {[sp.title, sp.organization].filter(Boolean).join(" — ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {session.capacity && (
                            <p className="text-[11px] text-gray-400 mt-2">
                              Capacité : {session.capacity} places
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Liens utiles */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Link
            to="/networking/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Users className="h-4 w-4" />
            Annuaire participants
          </Link>
          <Link
            to="/e/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Inscription
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-400 pt-6 pb-8">
          Programme susceptible de modifications. Dernière mise à jour automatique.
        </footer>
      </main>

      {/* Chatbot IA flottant */}
      {event && (
        <ChatBot
          eventName={event.name}
          eventSlug={slug}
          venue={event.location || undefined}
          language="fr"
        />
      )}
    </div>
  );
}
