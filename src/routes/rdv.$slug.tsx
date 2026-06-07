import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  MapPin,
  Check,
  X,
  Clock,
  Send,
  Inbox,
  ArrowLeft,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rdv/$slug")({
  head: () => ({ meta: [{ title: "Mes RDV — ANSUT EVENT" }] }),
  component: RdvPage,
});

type Meeting = {
  id: string;
  event_id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  proposed_time: string | null;
  proposed_location: string | null;
  message: string | null;
  response_message: string | null;
  created_at: string;
  responded_at: string | null;
  // Joined
  requester_name?: string;
  requester_org?: string;
  recipient_name?: string;
  recipient_org?: string;
};

function RdvPage() {
  const { slug } = Route.useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [authenticated, setAuthenticated] = useState(false);
  const [myRegId, setMyRegId] = useState("");
  const [myName, setMyName] = useState("");
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);

    const { data: reg } = await supabase
      .from("event_registrations")
      .select("id, full_name, event_id")
      .eq("qr_token", token.trim())
      .single();

    if (!reg) {
      toast.error("Code badge invalide.");
      setLoading(false);
      return;
    }

    setMyRegId(reg.id);
    setMyName(reg.full_name);
    setAuthenticated(true);
    await loadMeetings(reg.id);
    setLoading(false);
  }

  async function loadMeetings(regId: string) {
    // Charger les RDV où je suis requester ou recipient
    const { data } = await supabase
      .from("event_meetings")
      .select("*")
      .or(`requester_id.eq.${regId},recipient_id.eq.${regId}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Enrichir avec les noms des participants
    const participantIds = new Set<string>();
    data.forEach((m) => {
      participantIds.add(m.requester_id);
      participantIds.add(m.recipient_id);
    });

    const { data: participants } = await supabase
      .from("event_registrations")
      .select("id, full_name, organization")
      .in("id", Array.from(participantIds));

    const pMap = new Map(participants?.map((p) => [p.id, p]) || []);

    const enriched: Meeting[] = data.map((m) => ({
      ...m,
      requester_name: pMap.get(m.requester_id)?.full_name || "Inconnu",
      requester_org: pMap.get(m.requester_id)?.organization || "",
      recipient_name: pMap.get(m.recipient_id)?.full_name || "Inconnu",
      recipient_org: pMap.get(m.recipient_id)?.organization || "",
    }));

    setMeetings(enriched);
  }

  async function handleRespond(meetingId: string, status: "accepted" | "declined") {
    setRespondingTo(meetingId);

    const { error } = await supabase
      .from("event_meetings")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", meetingId);

    setRespondingTo(null);

    if (error) {
      toast.error("Erreur lors de la réponse.");
    } else {
      toast.success(status === "accepted" ? "RDV accepté !" : "RDV décliné.");
      await loadMeetings(myRegId);
    }
  }

  async function handleCancel(meetingId: string) {
    setRespondingTo(meetingId);

    const { error } = await supabase
      .from("event_meetings")
      .update({ status: "cancelled" })
      .eq("id", meetingId);

    setRespondingTo(null);

    if (error) {
      toast.error("Erreur lors de l'annulation.");
    } else {
      toast.success("Demande annulée.");
      await loadMeetings(myRegId);
    }
  }

  const received = meetings.filter((m) => m.recipient_id === myRegId);
  const sent = meetings.filter((m) => m.requester_id === myRegId);
  const currentList = tab === "received" ? received : sent;
  const pendingCount = received.filter((m) => m.status === "pending").length;

  function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return { label: "En attente", class: "bg-amber-100 text-amber-700" };
      case "accepted":
        return { label: "Accepté", class: "bg-green-100 text-green-700" };
      case "declined":
        return { label: "Décliné", class: "bg-red-100 text-red-700" };
      case "cancelled":
        return { label: "Annulé", class: "bg-slate-100 text-slate-500" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-600" };
    }
  }

  // Page d'identification
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Mes rendez-vous</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gérez vos demandes de RDV reçues et envoyées
              </p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Code badge</label>
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
                  <Calendar className="h-4 w-4" />
                )}
                Voir mes RDV
              </Button>
            </form>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/matchmaking/$slug"
              params={{ slug }}
              className="text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              Retour au matchmaking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Page principale
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Mes rendez-vous</h1>
              <p className="text-sm text-muted-foreground">{myName}</p>
            </div>
            <Link
              to="/matchmaking/$slug"
              params={{ slug }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              Matchmaking
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTab("received")}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "received"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
              }`}
            >
              <Inbox className="h-4 w-4" />
              Reçus ({received.length})
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("sent")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "sent"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
              }`}
            >
              <Send className="h-4 w-4" />
              Envoyés ({sent.length})
            </button>
          </div>
        </div>
      </header>

      {/* Liste */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {currentList.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
            {tab === "received" ? (
              <>
                <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">
                  Aucune demande reçue
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Les demandes de RDV des autres participants apparaîtront ici
                </p>
              </>
            ) : (
              <>
                <Send className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">
                  Aucune demande envoyée
                </p>
                <Link
                  to="/matchmaking/$slug"
                  params={{ slug }}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Découvrir des participants →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((meeting) => {
              const badge = getStatusBadge(meeting.status);
              const isReceived = tab === "received";
              const otherName = isReceived
                ? meeting.requester_name
                : meeting.recipient_name;
              const otherOrg = isReceived
                ? meeting.requester_org
                : meeting.recipient_org;

              return (
                <div
                  key={meeting.id}
                  className="rounded-xl border bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{otherName}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.class}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      {otherOrg && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {otherOrg}
                        </p>
                      )}

                      {meeting.message && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                          <MessageCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {meeting.message}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {meeting.proposed_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(meeting.proposed_time)}
                          </span>
                        )}
                        {meeting.proposed_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {meeting.proposed_location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Demandé le {formatDate(meeting.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isReceived && meeting.status === "pending" && (
                    <div className="mt-4 flex gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(meeting.id, "accepted")}
                        disabled={respondingTo === meeting.id}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(meeting.id, "declined")}
                        disabled={respondingTo === meeting.id}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Décliner
                      </Button>
                    </div>
                  )}

                  {!isReceived && meeting.status === "pending" && (
                    <div className="mt-4 border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(meeting.id)}
                        disabled={respondingTo === meeting.id}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                        Annuler la demande
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/matchmaking/$slug" params={{ slug }} className="text-primary hover:underline">
              Matchmaking
            </Link>
            <Link to="/networking/$slug" params={{ slug }} className="text-primary hover:underline">
              Annuaire
            </Link>
            <Link to="/agenda/$slug" params={{ slug }} className="text-primary hover:underline">
              Programme
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
