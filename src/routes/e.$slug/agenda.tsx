import { createFileRoute } from "@tanstack/react-router";
import { EventLayout } from "@/components/EventLayout";
import { getParticipantToken } from "@/lib/token";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Mic2,
  Coffee,
  Users,
  Award,
  Compass,
  Presentation,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/e/$slug/agenda")({
  head: () => ({ meta: [{ title: "Programme du SUTEL 2026 — ANSUT EVENT" }] }),
  component: AgendaPage,
});

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

function AgendaPage() {
  const { slug } = Route.useParams();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [myToken] = useState(() => getParticipantToken(slug));
  const [showMyAgenda, setShowMyAgenda] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { data: event } = useQuery({
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

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data: sessionsData, error } = await supabase
        .from("event_sessions")
        .select("id, title, description, session_type, track, location, starts_at, ends_at, capacity, sort_order")
        .eq("event_id", event!.id)
        .order("starts_at", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;

      const { data: sessionSpeakers } = await supabase
        .from("event_session_speakers")
        .select("session_id, speaker_id, role")
        .in("session_id", sessionsData.map((s) => s.id));

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

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["my-bookmarks", myParticipant?.id, event?.id],
    enabled: !!myParticipant?.id && !!event?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("list_my_bookmarks", {
        p_qr_token: myToken,
        p_event_id: event!.id,
      });
      return ((data ?? []) as { session_id: string }[]).map((b) => b.session_id);
    },
  });

  const days = [...new Set(sessions.map((s) => s.starts_at.split("T")[0]))].sort();

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.speakers.some((sp) => sp.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || s.session_type === typeFilter;
    const matchesDay = dayFilter === "all" || s.starts_at.startsWith(dayFilter);
    return matchesSearch && matchesType && matchesDay;
  });

  async function toggleBookmark(sessionId: string) {
    if (!myParticipant) return;
    const isBookmarked = bookmarks.includes(sessionId);
    await supabase.rpc("toggle_my_bookmark", {
      p_qr_token: myToken,
      p_session_id: sessionId,
      p_add: !isBookmarked,
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">Chargement du programme…</p>
      </div>
    );
  }

  return (
    <EventLayout eventId={event.id} eventName={event.name} slug={slug} qrToken={myToken}>
      <div className="space-y-4">
        {/* Recherche + filtres */}
        <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une session ou un intervenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">Tous les jours</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">Tous les types</option>
              {Object.entries(SESSION_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            {myParticipant && (
              <button
                onClick={() => setShowMyAgenda(!showMyAgenda)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  showMyAgenda
                    ? "bg-primary text-white"
                    : "border border-border bg-white hover:bg-slate-50"
                }`}
              >
                <Bookmark className="h-4 w-4" />
                Mon agenda ({bookmarks.length})
              </button>
            )}
          </div>
        </div>

        {/* Sessions */}
        {sessionsLoading ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-xs text-muted-foreground">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune session trouvée
          </div>
        ) : (
          <div className="space-y-3">
            {(showMyAgenda ? filtered.filter((s) => bookmarks.includes(s.id)) : filtered).map((session) => {
              const typeInfo = SESSION_TYPES[session.session_type] ?? SESSION_TYPES.keynote;
              const Icon = typeInfo.icon;
              const isExpanded = expandedSession === session.id;
              const isBookmarked = bookmarks.includes(session.id);

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeInfo.color}`}>
                            <Icon className="h-3 w-3" />
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm">{session.title}</h3>
                        {session.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {session.location}
                          </p>
                        )}
                      </div>
                      {myParticipant && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(session.id);
                          }}
                          aria-label={isBookmarked ? "Retirer de mon agenda" : "Ajouter à mon agenda"}
                          className="shrink-0 p-1 text-muted-foreground hover:text-primary"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="h-5 w-5 text-primary" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {session.description && (
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                      )}
                      {session.speakers.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Intervenants</p>
                          <div className="space-y-1.5">
                            {session.speakers.map((sp, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium">{sp.full_name}</span>
                                {sp.title && <span className="text-muted-foreground"> — {sp.title}</span>}
                                {sp.organization && <span className="text-muted-foreground">, {sp.organization}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.capacity && (
                        <p className="text-xs text-muted-foreground">Capacité : {session.capacity} places</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EventLayout>
  );
}