import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, Vote, Plus, Pin, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/org/communication")({
  head: () => ({ meta: [{ title: "Communication — ANSUT EVENT" }] }),
  component: OrgCommunication,
});

type Announcement = { id: string; title: string; content: string; is_pinned: boolean; published_at: string; event_id: string };
type Poll = { id: string; title: string; question: string; is_active: boolean; created_at: string; event_id: string };

function OrgCommunication() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"announcements" | "polls">("announcements");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [pollTitle, setPollTitle] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["org-comm-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, name").eq("status", "published");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: announcements = [], isLoading: annLoading } = useQuery({
    queryKey: ["org-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_announcements")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const { data: polls = [], isLoading: pollLoading } = useQuery({
    queryKey: ["org-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_polls")
        .select("id, title, question, is_active, created_at, event_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Poll[];
    },
  });

  const createAnn = useMutation({
    mutationFn: async () => {
      if (!annTitle.trim() || !selectedEventId) throw new Error("Titre et événement requis");
      const { error } = await supabase.from("event_announcements").insert({
        title: annTitle,
        content: annContent,
        event_id: selectedEventId,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-announcements"] });
      setAnnTitle(""); setAnnContent("");
      toast.success("Annonce publiée");
    },
    onError: (e) => toast.error(e.message),
  });

  const createPoll = useMutation({
    mutationFn: async () => {
      if (!pollTitle.trim() || !selectedEventId) throw new Error("Titre et événement requis");
      const { error } = await supabase.from("live_polls").insert({
        title: pollTitle,
        question: pollQuestion,
        event_id: selectedEventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-polls"] });
      setPollTitle(""); setPollQuestion("");
      toast.success("Sondage créé");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communication</h1>
        <p className="text-muted-foreground mt-1">Annonces et sondages</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("announcements")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "announcements" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Megaphone className="h-4 w-4" /> Annonces ({announcements.length})
        </button>
        <button
          onClick={() => setTab("polls")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "polls" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Vote className="h-4 w-4" /> Sondages ({polls.length})
        </button>
      </div>

      {tab === "announcements" ? (
        <div className="space-y-6">
          {/* Créer une annonce */}
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle annonce
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Choisir un événement…</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <Input
                placeholder="Titre de l'annonce"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
              />
            </div>
            <textarea
              placeholder="Contenu de l'annonce..."
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none"
            />
            <Button onClick={() => createAnn.mutate()} disabled={createAnn.isPending}>
              {createAnn.isPending ? "Publication..." : "Publier l'annonce"}
            </Button>
          </div>

          {/* Liste */}
          {annLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune annonce.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {a.is_pinned && <Pin className="h-4 w-4 mt-0.5 text-amber-600" />}
                      <div>
                        <p className="font-semibold text-sm">{a.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(a.published_at).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Créer un sondage */}
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouveau sondage
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Choisir un événement…</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <Input
                placeholder="Titre du sondage"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
              />
            </div>
            <textarea
              placeholder="Question du sondage..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none"
            />
            <Button onClick={() => createPoll.mutate()} disabled={createPoll.isPending}>
              {createPoll.isPending ? "Création..." : "Créer le sondage"}
            </Button>
          </div>

          {/* Liste */}
          {pollLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : polls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun sondage.</p>
          ) : (
            <div className="space-y-3">
              {polls.map((p) => (
                <div key={p.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{p.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-muted-foreground"}`}>
                      {p.is_active ? "Actif ✅" : "Inactif"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}