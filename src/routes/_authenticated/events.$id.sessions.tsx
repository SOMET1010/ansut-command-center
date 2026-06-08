import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Users,
  Mic2,
  Save,
  X,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { RequireSuperAdmin } from "@/components/auth/RoleGuard";

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
  sort_order: number;
};

type Speaker = {
  id: string;
  full_name: string;
  title: string | null;
  organization: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
};

const SESSION_TYPES = [
  { value: "keynote", label: "Keynote" },
  { value: "panel", label: "Panel" },
  { value: "workshop", label: "Atelier" },
  { value: "networking", label: "Networking" },
  { value: "break", label: "Pause" },
  { value: "ceremony", label: "Cérémonie" },
  { value: "visit", label: "Visite terrain" },
];

/* ─── Route ─── */
export const Route = createFileRoute("/_authenticated/events/$id/sessions")({
  component: () => (
    <RequireSuperAdmin>
      <SessionsManager />
    </RequireSuperAdmin>
  ),
});

function SessionsManager() {
  const { id: eventId } = Route.useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sessions" | "speakers">("sessions");
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [showNewSpeaker, setShowNewSpeaker] = useState(false);

  // Charger l'événement
  const { data: event } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Charger les sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions-manage", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_sessions")
        .select("*")
        .eq("event_id", eventId)
        .order("starts_at", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Session[];
    },
  });

  // Charger les speakers
  const { data: speakers = [], isLoading: speakersLoading } = useQuery({
    queryKey: ["speakers-manage", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_speakers")
        .select("*")
        .eq("event_id", eventId)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as Speaker[];
    },
  });

  // Mutations sessions
  const createSession = useMutation({
    mutationFn: async (session: Omit<Session, "id">) => {
      const { error } = await supabase
        .from("event_sessions")
        .insert({ ...session, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-manage", eventId] });
      setShowNewSession(false);
      toast.success("Session créée");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateSession = useMutation({
    mutationFn: async (session: Session) => {
      const { id, ...rest } = session;
      const { error } = await supabase.from("event_sessions").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-manage", eventId] });
      setEditingSession(null);
      toast.success("Session mise à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-manage", eventId] });
      toast.success("Session supprimée");
    },
  });

  // Mutations speakers
  const createSpeaker = useMutation({
    mutationFn: async (speaker: Omit<Speaker, "id">) => {
      const { error } = await supabase
        .from("event_speakers")
        .insert({ ...speaker, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers-manage", eventId] });
      setShowNewSpeaker(false);
      toast.success("Intervenant ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateSpeaker = useMutation({
    mutationFn: async (speaker: Speaker) => {
      const { id, ...rest } = speaker;
      const { error } = await supabase.from("event_speakers").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers-manage", eventId] });
      setEditingSpeaker(null);
      toast.success("Intervenant mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteSpeaker = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_speakers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers-manage", eventId] });
      toast.success("Intervenant supprimé");
    },
  });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/events/$id/registrations"
            params={{ id: eventId }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Programme & Intervenants</h1>
            {event && <p className="text-sm text-gray-500">{event.name}</p>}
          </div>
        </div>
        {event?.slug && (
          <a
            href={`/agenda/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir l'agenda public
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "sessions"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1.5" />
          Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("speakers")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "speakers"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Mic2 className="h-4 w-4 inline mr-1.5" />
          Intervenants ({speakers.length})
        </button>
      </div>

      {/* Tab: Sessions */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <Button onClick={() => setShowNewSession(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle session
          </Button>

          {/* Formulaire nouvelle session */}
          {showNewSession && (
            <SessionForm
              onSubmit={(s) => createSession.mutate(s)}
              onCancel={() => setShowNewSession(false)}
              isLoading={createSession.isPending}
            />
          )}

          {/* Formulaire édition session */}
          {editingSession && (
            <SessionForm
              initial={editingSession}
              onSubmit={(s) => updateSession.mutate({ ...s, id: editingSession.id } as Session)}
              onCancel={() => setEditingSession(null)}
              isLoading={updateSession.isPending}
            />
          )}

          {/* Liste des sessions */}
          {sessionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune session. Créez la première.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-lg border p-4 flex items-center gap-4"
                >
                  <div className="flex-shrink-0 text-center min-w-[70px]">
                    <p className="text-xs font-bold text-primary">
                      {formatDateTime(session.starts_at)}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatDateTime(session.ends_at)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-medium text-gray-600">
                        {SESSION_TYPES.find((t) => t.value === session.session_type)?.label ||
                          session.session_type}
                      </span>
                      {session.track && (
                        <span className="text-[10px] text-gray-400">{session.track}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                      {session.title}
                    </p>
                    {session.location && (
                      <p className="text-[11px] text-gray-400">{session.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setEditingSession(session)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: "Supprimer cette session ?",
                          description: "Cette action est irréversible.",
                          confirmLabel: "Supprimer",
                          destructive: true,
                        });
                        if (ok) deleteSession.mutate(session.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Speakers */}
      {activeTab === "speakers" && (
        <div className="space-y-4">
          <Button onClick={() => setShowNewSpeaker(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel intervenant
          </Button>

          {/* Formulaire nouveau speaker */}
          {showNewSpeaker && (
            <SpeakerForm
              onSubmit={(s) => createSpeaker.mutate(s)}
              onCancel={() => setShowNewSpeaker(false)}
              isLoading={createSpeaker.isPending}
            />
          )}

          {/* Formulaire édition speaker */}
          {editingSpeaker && (
            <SpeakerForm
              initial={editingSpeaker}
              onSubmit={(s) => updateSpeaker.mutate({ ...s, id: editingSpeaker.id } as Speaker)}
              onCancel={() => setEditingSpeaker(null)}
              isLoading={updateSpeaker.isPending}
            />
          )}

          {/* Liste des speakers */}
          {speakersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : speakers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Mic2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun intervenant. Ajoutez le premier.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {speaker.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{speaker.full_name}</p>
                      {speaker.title && <p className="text-xs text-gray-500">{speaker.title}</p>}
                      {speaker.organization && (
                        <p className="text-xs text-gray-400">{speaker.organization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSpeaker(speaker)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Supprimer cet intervenant ?"))
                            deleteSpeaker.mutate(speaker.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

/* ─── Session Form ─── */
function SessionForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: Session;
  onSubmit: (s: Omit<Session, "id">) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [sessionType, setSessionType] = useState(initial?.session_type || "panel");
  const [track, setTrack] = useState(initial?.track || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 16) : "",
  );
  const [endsAt, setEndsAt] = useState(initial?.ends_at ? initial.ends_at.slice(0, 16) : "");
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() || "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order?.toString() || "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startsAt || !endsAt) {
      toast.error("Titre, début et fin sont obligatoires");
      return;
    }
    onSubmit({
      title,
      description: description || null,
      session_type: sessionType,
      track: track || null,
      location: location || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      capacity: capacity ? parseInt(capacity) : null,
      sort_order: parseInt(sortOrder) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {initial ? "Modifier la session" : "Nouvelle session"}
        </h3>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Titre *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la session"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de la session..."
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Type *</label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Track / Salle</label>
          <Input
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Ex: Salle Plénière"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Début *</label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Fin *</label>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Lieu</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Sofitel Ivoire"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Capacité</label>
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="200"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

/* ─── Speaker Form ─── */
function SpeakerForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: Speaker;
  onSubmit: (s: Omit<Speaker, "id">) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [organization, setOrganization] = useState(initial?.organization || "");
  const [bio, setBio] = useState(initial?.bio || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedin_url || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error("Le nom est obligatoire");
      return;
    }
    onSubmit({
      full_name: fullName,
      title: title || null,
      organization: organization || null,
      bio: bio || null,
      photo_url: initial?.photo_url || null,
      linkedin_url: linkedinUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {initial ? "Modifier l'intervenant" : "Nouvel intervenant"}
        </h3>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Nom complet *</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Prénom Nom"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Titre / Fonction</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Directeur Général"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Organisation</label>
          <Input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Ex: ANSUT"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">LinkedIn</label>
          <Input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Biographie</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Courte biographie..."
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
