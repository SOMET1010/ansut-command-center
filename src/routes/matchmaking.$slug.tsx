import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Sparkles,
  Send,
  Calendar,
  MapPin,
  Briefcase,
  Globe,
  Star,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/matchmaking/$slug")({
  head: () => ({ meta: [{ title: "Matchmaking — ANSUT EVENT" }] }),
  component: MatchmakingPage,
});

type Recommendation = {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  job_title: string;
  country: string;
  bio: string;
  photo_url: string;
  participant_category: string;
  interests: string[];
  linkedin_url: string;
  match_score: number;
};

type MyRegistration = {
  id: string;
  full_name: string;
  event_id: string;
};

function MatchmakingPage() {
  const { slug } = Route.useParams();
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [myReg, setMyReg] = useState<MyRegistration | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Modal de demande de RDV
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [targetParticipant, setTargetParticipant] = useState<Recommendation | null>(null);
  const [meetingMessage, setMeetingMessage] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [proposedLocation, setProposedLocation] = useState("");

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);

    const { data: regData } = await supabase.rpc("me_registration", { p_qr_token: token.trim() });
    const reg = Array.isArray(regData) && regData[0] ? regData[0] : null;
    if (!reg) {
      toast.error("Code badge invalide. Vérifiez votre badge.");
      setLoading(false);
      return;
    }

    setMyReg({ id: reg.id, full_name: reg.full_name, event_id: reg.event_id });
    setAuthenticated(true);

    const { data: recs } = await supabase.rpc("get_match_recommendations", {
      p_registration_id: reg.id,
      p_event_id: reg.event_id,
      p_limit: 15,
    });
    if (recs) setRecommendations(recs);

    const { data: existing } = await supabase.rpc("list_my_sent_meeting_recipients", {
      p_qr_token: token.trim(),
    });
    if (existing) setSentRequests(new Set((existing as any[]).map((m) => m.recipient_id)));

    setLoading(false);
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!myReg || !targetParticipant) return;
    setSendingTo(targetParticipant.id);

    const { error } = await supabase.rpc("create_meeting_request", {
      p_qr_token: token.trim(),
      p_recipient_id: targetParticipant.id,
      p_message: meetingMessage.trim() || undefined,
      p_proposed_time: proposedTime || undefined,
      p_proposed_location: proposedLocation.trim() || undefined,
    });

    setSendingTo(null);

    if (error) {
      if (error.message?.includes("duplicate") || (error as any).code === "23505") {
        toast.error("Vous avez déjà envoyé une demande à ce participant.");
      } else {
        toast.error("Erreur lors de l'envoi de la demande.");
      }
    } else {
      toast.success(`Demande envoyée à ${targetParticipant.full_name}`);
      setSentRequests((prev) => new Set([...prev, targetParticipant.id]));
      setShowRequestModal(false);
      setMeetingMessage("");
      setProposedTime("");
      setProposedLocation("");
      setTargetParticipant(null);
    }
  }

  function openRequestModal(rec: Recommendation) {
    setTargetParticipant(rec);
    setShowRequestModal(true);
  }

  function getScoreLabel(score: number) {
    if (score >= 10) return { label: "Excellent", color: "bg-green-100 text-green-700" };
    if (score >= 6) return { label: "Bon", color: "bg-blue-100 text-blue-700" };
    if (score >= 3) return { label: "Intéressant", color: "bg-amber-100 text-amber-700" };
    return { label: "Découverte", color: "bg-slate-100 text-slate-600" };
  }

  // Page d'identification
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Matchmaking</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Découvrez les participants qui partagent vos centres d'intérêt
              </p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Code badge
                </label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Votre code (sous le QR de votre badge)"
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Voir mes recommandations
              </Button>
            </form>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/networking/$slug"
              params={{ slug }}
              className="text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              Retour à l'annuaire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Page de recommandations
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Matchmaking</h1>
              <p className="text-sm text-muted-foreground">
                Bonjour {myReg?.full_name} — {recommendations.length} recommandation(s)
              </p>
            </div>
            <Link
              to="/rdv/$slug"
              params={{ slug }}
              search={{ token }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              <Calendar className="h-4 w-4" />
              Mes RDV
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {recommendations.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              Aucune recommandation disponible
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Complétez votre profil (intérêts, catégorie) pour recevoir des suggestions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const scoreInfo = getScoreLabel(rec.match_score);
              const alreadySent = sentRequests.has(rec.id);

              return (
                <div
                  key={rec.id}
                  className="rounded-xl border bg-white p-5 transition hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {rec.photo_url ? (
                        <img
                          src={rec.photo_url}
                          alt={rec.full_name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {rec.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {rec.full_name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${scoreInfo.color}`}
                        >
                          <Star className="h-3 w-3" />
                          {scoreInfo.label}
                        </span>
                      </div>

                      {rec.job_title && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          {rec.job_title}
                          {rec.organization && ` — ${rec.organization}`}
                        </p>
                      )}

                      {rec.country && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {rec.country}
                        </p>
                      )}

                      {rec.bio && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {rec.bio}
                        </p>
                      )}

                      {/* Intérêts communs */}
                      {rec.interests && rec.interests.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rec.interests.slice(0, 4).map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {interest}
                            </span>
                          ))}
                          {rec.interests.length > 4 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              +{rec.interests.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {alreadySent ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                          <Check className="h-3 w-3" />
                          Envoyé
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openRequestModal(rec)}
                          disabled={sendingTo === rec.id}
                          className="gap-1"
                        >
                          <Send className="h-3 w-3" />
                          RDV
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/networking/$slug" params={{ slug }} className="text-primary hover:underline">
              Annuaire
            </Link>
            <Link to="/agenda/$slug" params={{ slug }} className="text-primary hover:underline">
              Programme
            </Link>
            <Link to="/annonces/$slug" params={{ slug }} className="text-primary hover:underline">
              Annonces
            </Link>
          </div>
        </footer>
      </main>

      {/* Modal de demande de RDV */}
      {showRequestModal && targetParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              Demander un RDV
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              avec <strong>{targetParticipant.full_name}</strong>
              {targetParticipant.organization && ` (${targetParticipant.organization})`}
            </p>

            <form onSubmit={handleSendRequest} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Message (optionnel)
                </label>
                <textarea
                  value={meetingMessage}
                  onChange={(e) => setMeetingMessage(e.target.value)}
                  placeholder="Bonjour, j'aimerais échanger sur..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    Horaire proposé
                  </label>
                  <Input
                    type="datetime-local"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    Lieu proposé
                  </label>
                  <Input
                    value={proposedLocation}
                    onChange={(e) => setProposedLocation(e.target.value)}
                    placeholder="Ex: Hall B, Stand 12"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 gap-2" disabled={!!sendingTo}>
                  {sendingTo ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer la demande
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRequestModal(false);
                    setTargetParticipant(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
