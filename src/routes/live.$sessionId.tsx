import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Users, QrCode, BarChart3, Mic2, Clock } from "lucide-react";

export const Route = createFileRoute("/live/$sessionId")({
  component: LivePresentation,
});

type Speaker = {
  id: string;
  full_name: string;
  title: string | null;
  organization: string | null;
  bio: string | null;
  photo_url: string | null;
  role: string;
};

type Session = {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  track: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  event_id: string;
};

type Poll = {
  id: string;
  question: string;
  poll_type: string;
  options: string[];
  is_active: boolean;
  show_results: boolean;
};

function LivePresentation() {
  const { sessionId } = Route.useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<Record<string, number>>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventSlug, setEventSlug] = useState("");

  // Charger les données de la session
  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase
        .from("event_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (!sess) return;
      setSession(sess);

      // Récupérer le slug de l'événement
      const { data: evt } = await supabase
        .from("events")
        .select("slug")
        .eq("id", sess.event_id)
        .single();
      if (evt) setEventSlug(evt.slug);

      // Speakers avec rôles
      const { data: sessionSpeakers } = await supabase
        .from("event_session_speakers")
        .select("role, speaker:event_speakers(*)")
        .eq("session_id", sessionId);

      if (sessionSpeakers) {
        setSpeakers(
          sessionSpeakers.map((ss: any) => ({
            ...ss.speaker,
            role: ss.role,
          })),
        );
      }

      setLoading(false);
    }
    load();
  }, [sessionId]);

  // Polling temps réel : présence
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const { count } = await supabase
        .from("session_attendance")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId);
      setAttendanceCount(count || 0);
    }, 5000);
    // Initial
    supabase
      .from("session_attendance")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .then(({ count }) => setAttendanceCount(count || 0));
    return () => clearInterval(interval);
  }, [session, sessionId]);

  // Polling temps réel : sondage actif + résultats
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const { data: polls } = await supabase
        .from("live_polls")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_active", true)
        .limit(1);

      if (polls && polls.length > 0) {
        const poll = polls[0];
        setActivePoll({
          ...poll,
          options: (Array.isArray(poll.options) ? poll.options : []) as string[],
        });

        // Compter les votes
        const { data: votes } = await supabase
          .from("live_poll_votes")
          .select("answer")
          .eq("poll_id", poll.id);

        if (votes) {
          const counts: Record<string, number> = {};
          votes.forEach((v: any) => {
            const ans = typeof v.answer === "string" ? v.answer : JSON.stringify(v.answer);
            counts[ans] = (counts[ans] || 0) + 1;
          });
          setPollResults(counts);
        }
      } else {
        setActivePoll(null);
        setPollResults({});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [session, sessionId]);

  // Navigation clavier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      setCurrentSlide((s) => Math.min(s + 1, 3));
    } else if (e.key === "ArrowLeft") {
      setCurrentSlide((s) => Math.max(s - 1, 0));
    } else if (e.key === "f" || e.key === "F") {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-2xl">Session introuvable</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const attendanceUrl = `${baseUrl}/attendance/${sessionId}`;
  const pollUrl = activePoll ? `${baseUrl}/poll/${activePoll.id}` : "";

  const moderators = speakers.filter((s) => s.role === "moderator");
  const panelists = speakers.filter((s) => s.role !== "moderator");

  const slides = ["session-info", "speakers", "attendance-qr", "live-poll"];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header fixe */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium uppercase tracking-wider text-white/60">
            En direct
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Users className="h-4 w-4" />
            <span className="font-mono text-sm font-bold">{attendanceCount}</span>
            <span className="text-xs text-white/60">présents</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">
              {new Date(session.starts_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" — "}
              {new Date(session.ends_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Slide 0 : Infos session */}
      {currentSlide === 0 && (
        <div className="flex h-full flex-col items-center justify-center px-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-5 py-2 text-orange-300">
            <Mic2 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {session.session_type === "keynote"
                ? "Keynote"
                : session.session_type === "panel"
                  ? "Panel"
                  : session.session_type === "workshop"
                    ? "Atelier"
                    : session.session_type}
            </span>
          </div>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
            {session.title}
          </h1>
          {session.description && (
            <p className="mt-6 max-w-3xl text-xl text-white/70 leading-relaxed">
              {session.description}
            </p>
          )}
          {session.location && <p className="mt-8 text-lg text-white/50">📍 {session.location}</p>}
          {session.track && (
            <div className="mt-4 rounded-full bg-blue-500/20 px-4 py-1 text-sm text-blue-300">
              {session.track}
            </div>
          )}
        </div>
      )}

      {/* Slide 1 : Speakers */}
      {currentSlide === 1 && (
        <div className="flex h-full flex-col items-center justify-center px-16">
          {moderators.length > 0 && (
            <div className="mb-12 text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-300">
                Modérateur
              </p>
              <div className="flex flex-wrap justify-center gap-8">
                {moderators.map((s) => (
                  <SpeakerCard key={s.id} speaker={s} large />
                ))}
              </div>
            </div>
          )}
          {panelists.length > 0 && (
            <div className="text-center">
              <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-blue-300">
                {panelists.length > 1 ? "Panélistes" : "Intervenant"}
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {panelists.map((s) => (
                  <SpeakerCard key={s.id} speaker={s} />
                ))}
              </div>
            </div>
          )}
          {speakers.length === 0 && (
            <p className="text-xl text-white/50">Aucun intervenant configuré pour cette session</p>
          )}
        </div>
      )}

      {/* Slide 2 : QR de présence */}
      {currentSlide === 2 && (
        <div className="flex h-full flex-col items-center justify-center px-16 text-center">
          <QrCode className="mb-6 h-16 w-16 text-green-400" />
          <h2 className="mb-2 text-4xl font-bold">Confirmez votre présence</h2>
          <p className="mb-10 text-xl text-white/70">
            Scannez ce QR code pour enregistrer votre participation à cette session
          </p>
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-green-500/20">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(attendanceUrl)}&color=1e293b`}
              alt="QR Code de présence"
              className="h-[350px] w-[350px]"
            />
          </div>
          <p className="mt-6 font-mono text-sm text-white/40">{attendanceUrl}</p>
          <div className="mt-8 flex items-center gap-2 rounded-full bg-green-500/20 px-5 py-2 text-green-300">
            <Users className="h-5 w-5" />
            <span className="font-bold">{attendanceCount}</span>
            <span className="text-sm">
              participant{attendanceCount > 1 ? "s" : ""} enregistré{attendanceCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Slide 3 : Live Poll */}
      {currentSlide === 3 && (
        <div className="flex h-full flex-col items-center justify-center px-16 text-center">
          {activePoll ? (
            <>
              <BarChart3 className="mb-6 h-16 w-16 text-purple-400" />
              <h2 className="mb-2 text-3xl font-bold">{activePoll.question}</h2>
              <p className="mb-8 text-lg text-white/70">Votez en scannant le QR code ci-dessous</p>

              <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
                {/* QR Code */}
                <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-purple-500/20">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pollUrl)}&color=1e293b`}
                    alt="QR Code sondage"
                    className="h-[280px] w-[280px]"
                  />
                </div>

                {/* Résultats en direct */}
                {activePoll.show_results && (
                  <div className="w-full max-w-lg space-y-4">
                    {activePoll.options.map((option, idx) => {
                      const count = pollResults[`"${option}"`] || pollResults[option] || 0;
                      const total = Object.values(pollResults).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const colors = [
                        "bg-blue-500",
                        "bg-orange-500",
                        "bg-green-500",
                        "bg-purple-500",
                        "bg-pink-500",
                        "bg-cyan-500",
                      ];
                      return (
                        <div key={idx} className="text-left">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-lg font-medium">{option}</span>
                            <span className="font-mono text-sm text-white/60">
                              {count} vote{count > 1 ? "s" : ""} ({pct}%)
                            </span>
                          </div>
                          <div className="h-8 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${colors[idx % colors.length]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <p className="mt-4 text-sm text-white/40">
                      {Object.values(pollResults).reduce((a, b) => a + b, 0)} vote(s) au total
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <BarChart3 className="mx-auto mb-6 h-16 w-16 text-white/30" />
              <h2 className="text-3xl font-bold text-white/50">Aucun sondage actif</h2>
              <p className="mt-4 text-lg text-white/40">
                Activez un sondage depuis le cockpit pour afficher le QR code ici
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6">
        <button
          onClick={() => setCurrentSlide((s) => Math.max(s - 1, 0))}
          disabled={currentSlide === 0}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Indicateurs de slide */}
        <div className="flex items-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentSlide ? "w-8 bg-white" : "w-2.5 bg-white/30"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((s) => Math.min(s + 1, slides.length - 1))}
          disabled={currentSlide === slides.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Instruction clavier */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30">
        ← → pour naviguer · F pour plein écran
      </div>
    </div>
  );
}

function SpeakerCard({ speaker, large }: { speaker: Speaker; large?: boolean }) {
  const initials = speaker.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex flex-col items-center ${large ? "w-64" : "w-48"}`}>
      {speaker.photo_url ? (
        <img
          src={speaker.photo_url}
          alt={speaker.full_name}
          className={`rounded-full object-cover border-4 border-white/20 ${
            large ? "h-32 w-32" : "h-24 w-24"
          }`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white ${
            large ? "h-32 w-32 text-3xl" : "h-24 w-24 text-xl"
          }`}
        >
          {initials}
        </div>
      )}
      <p className={`mt-4 font-bold text-center ${large ? "text-2xl" : "text-lg"}`}>
        {speaker.full_name}
      </p>
      {speaker.title && <p className="mt-1 text-center text-sm text-white/60">{speaker.title}</p>}
      {speaker.organization && (
        <p className="mt-1 text-center text-sm text-blue-300">{speaker.organization}</p>
      )}
    </div>
  );
}
