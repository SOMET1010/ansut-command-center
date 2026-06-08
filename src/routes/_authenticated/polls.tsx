import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Plus,
  Trash2,
  Play,
  Square,
  Eye,
  EyeOff,
  ExternalLink,
  Monitor,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RequireSuperAdmin } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/polls")({
  head: () => ({ meta: [{ title: "Live Polling — ANSUT EVENT" }] }),
  component: () => (
    <RequireSuperAdmin>
      <PollsPage />
    </RequireSuperAdmin>
  ),
});

type Session = {
  id: string;
  title: string;
  starts_at: string;
  event_id: string;
  event: { title: string; slug: string } | null;
};

type Poll = {
  id: string;
  session_id: string;
  question: string;
  poll_type: string;
  options: string[];
  is_active: boolean;
  show_results: boolean;
  sort_order: number;
  created_at: string;
  closed_at: string | null;
  vote_count?: number;
};

function PollsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState("single");
  const [options, setOptions] = useState(["", ""]);

  // Charger les sessions
  useEffect(() => {
    async function loadSessions() {
      const { data } = await supabase
        .from("event_sessions")
        .select("id, title, starts_at, event_id, event:events(title, slug)")
        .order("starts_at", { ascending: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) setSessions(data as any);
      setLoading(false);
    }
    loadSessions();
  }, []);

  // Charger les sondages de la session sélectionnée
  useEffect(() => {
    if (!selectedSession) {
      setPolls([]);
      return;
    }
    async function loadPolls() {
      const { data } = await supabase
        .from("live_polls")
        .select("*")
        .eq("session_id", selectedSession)
        .order("sort_order", { ascending: true });

      if (data) {
        const pollsWithVotes = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map(async (p: any) => {
            const { count } = await supabase
              .from("live_poll_votes")
              .select("*", { count: "exact", head: true })
              .eq("poll_id", p.id);
            return {
              ...p,
              options: Array.isArray(p.options) ? p.options : [],
              vote_count: count || 0,
            };
          }),
        );
        setPolls(pollsWithVotes);
      }
    }
    loadPolls();
    const interval = setInterval(loadPolls, 5000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !selectedSession) return;

    const validOptions = options.filter((o) => o.trim());
    if (pollType !== "rating" && validOptions.length < 2) {
      toast.error("Au moins 2 options sont requises");
      return;
    }

    const { error } = await supabase.from("live_polls").insert({
      session_id: selectedSession,
      question: question.trim(),
      poll_type: pollType,
      options: pollType === "rating" ? ["1", "2", "3", "4", "5"] : validOptions,
      sort_order: polls.length,
    });

    if (error) {
      toast.error("Erreur lors de la création");
    } else {
      toast.success("Sondage créé");
      setQuestion("");
      setOptions(["", ""]);
      setShowForm(false);
      // Refresh
      const { data } = await supabase
        .from("live_polls")
        .select("*")
        .eq("session_id", selectedSession)
        .order("sort_order");
      if (data)
        setPolls(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((p: any) => ({ ...p, options: Array.isArray(p.options) ? p.options : [] })),
        );
    }
  }

  async function toggleActive(poll: Poll) {
    if (!poll.is_active) {
      // Désactiver tous les autres sondages de cette session
      await supabase
        .from("live_polls")
        .update({ is_active: false })
        .eq("session_id", selectedSession);
    }

    await supabase
      .from("live_polls")
      .update({
        is_active: !poll.is_active,
        closed_at: poll.is_active ? new Date().toISOString() : null,
      })
      .eq("id", poll.id);

    toast.success(poll.is_active ? "Sondage fermé" : "Sondage activé — visible sur l'écran");
    // Refresh
    const { data } = await supabase
      .from("live_polls")
      .select("*")
      .eq("session_id", selectedSession)
      .order("sort_order");
    if (data)
      setPolls(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((p: any) => ({ ...p, options: Array.isArray(p.options) ? p.options : [] })),
      );
  }

  async function toggleResults(poll: Poll) {
    await supabase
      .from("live_polls")
      .update({ show_results: !poll.show_results })
      .eq("id", poll.id);

    toast.success(poll.show_results ? "Résultats masqués" : "Résultats visibles pour les votants");
    setPolls((prev) =>
      prev.map((p) => (p.id === poll.id ? { ...p, show_results: !p.show_results } : p)),
    );
  }

  async function deletePoll(pollId: string) {
    if (!confirm("Supprimer ce sondage et tous ses votes ?")) return;
    await supabase.from("live_polls").delete().eq("id", pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
    toast.success("Sondage supprimé");
  }

  const currentSession = sessions.find((s) => s.id === selectedSession);

  if (loading) {
    return (
      <div className="section-gap">
        <h1 className="font-display text-2xl font-bold">Live Polling</h1>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="section-gap">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Live Polling</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez et gérez les sondages interactifs pour vos sessions
          </p>
        </div>
        {selectedSession && currentSession && (
          <a
            href={`/live/${selectedSession}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Monitor className="h-4 w-4" />
            Mode Présentation
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Sélection de session */}
      <div className="rounded-xl border bg-card p-4">
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Sélectionner une session
        </label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Choisir une session —</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.event?.title} — {s.title} ({new Date(s.starts_at).toLocaleDateString("fr-FR")})
            </option>
          ))}
        </select>
      </div>

      {/* Message si aucune session */}
      {sessions.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune session créée</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Créez d'abord des sessions depuis la page de gestion d'un événement
          </p>
        </div>
      )}

      {/* Contenu si session sélectionnée */}
      {selectedSession && (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{polls.length}</p>
              <p className="text-xs text-muted-foreground">Sondage{polls.length > 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {polls.filter((p) => p.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">
                Actif{polls.filter((p) => p.is_active).length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {polls.reduce((acc, p) => acc + (p.vote_count || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Votes total</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <a
                href={`/live/${selectedSession}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl"
              >
                🖥️
              </a>
              <p className="text-xs text-muted-foreground">Écran live</p>
            </div>
          </div>

          {/* Bouton créer */}
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau sondage
            </Button>
          </div>

          {/* Formulaire de création */}
          {showForm && (
            <form onSubmit={handleCreatePoll} className="rounded-xl border bg-card p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Question</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Quel sujet vous intéresse le plus ?"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={pollType}
                  onChange={(e) => setPollType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="single">Choix unique</option>
                  <option value="multi">Choix multiple</option>
                  <option value="rating">Notation (1 à 5 étoiles)</option>
                </select>
              </div>
              {pollType !== "rating" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Options de réponse</label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[idx] = e.target.value;
                            setOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setOptions([...options, ""])}
                      className="text-sm text-primary hover:underline"
                    >
                      + Ajouter une option
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit">Créer le sondage</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {/* Liste des sondages */}
          <div className="space-y-4">
            {polls.length === 0 && !showForm && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucun sondage pour cette session</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Créez votre premier sondage pour animer la session
                </p>
              </div>
            )}

            {polls.map((poll) => (
              <div
                key={poll.id}
                className={`rounded-xl border p-5 transition ${
                  poll.is_active ? "border-green-300 bg-green-50/50" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {poll.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                          En direct
                        </span>
                      )}
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {poll.poll_type === "single"
                          ? "Choix unique"
                          : poll.poll_type === "multi"
                            ? "Choix multiple"
                            : "Notation"}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold">{poll.question}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {poll.options.map((opt, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-muted-foreground"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      {poll.vote_count || 0} vote{(poll.vote_count || 0) > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleActive(poll)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        poll.is_active
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {poll.is_active ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {poll.is_active ? "Fermer" : "Activer"}
                    </button>
                    <button
                      onClick={() => toggleResults(poll)}
                      className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      {poll.show_results ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {poll.show_results ? "Masquer" : "Montrer"}
                    </button>
                    <button
                      onClick={() => deletePoll(poll.id)}
                      className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
