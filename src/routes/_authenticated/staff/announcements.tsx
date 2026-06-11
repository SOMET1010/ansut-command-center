import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Pin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff/announcements")({
  head: () => ({ meta: [{ title: "Annonces staff — ANSUT EVENT" }] }),
  component: StaffAnnouncements,
});

type Announcement = { id: string; title: string; content: string; is_pinned: boolean; published_at: string; event_id: string };

function StaffAnnouncements() {
  const qc = useQueryClient();
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["staff-ann-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, name").eq("status", "published");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["staff-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_announcements")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const publish = useMutation({
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
      qc.invalidateQueries({ queryKey: ["staff-announcements"] });
      setAnnTitle(""); setAnnContent("");
      toast.success("Annonce publiée ✅");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Annonces
        </h1>
        <p className="text-muted-foreground mt-1">Publier des annonces pour les participants</p>
      </div>

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
          <input
            placeholder="Titre de l'annonce"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Contenu de l'annonce..."
          value={annContent}
          onChange={(e) => setAnnContent(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none"
        />
        <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
          {publish.isPending ? "Publication..." : "Publier l'annonce"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Aucune annonce publiée.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border bg-card p-4 shadow-sm">
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
          ))}
        </div>
      )}
    </div>
  );
}