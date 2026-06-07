import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Plus,
  Trash2,
  Pin,
  PinOff,
  ExternalLink,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Annonces — ANSUT EVENT" }] }),
  component: AnnouncementsPage,
});

type Event = {
  id: string;
  name: string;
  slug: string;
};

type Announcement = {
  id: string;
  event_id: string;
  title: string;
  content: string;
  announcement_type: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  created_at: string;
};

const TYPES = [
  { value: "info", label: "Information", icon: Info, color: "text-blue-600" },
  { value: "warning", label: "Attention", icon: AlertTriangle, color: "text-amber-600" },
  { value: "urgent", label: "Urgent", icon: Bell, color: "text-red-600" },
  { value: "schedule_change", label: "Changement horaire", icon: Clock, color: "text-purple-600" },
  { value: "logistics", label: "Logistique", icon: MapPin, color: "text-green-600" },
];

function AnnouncementsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("info");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>("");

  // Charger les événements
  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, name, slug")
        .order("starts_at", { ascending: false });
      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, []);

  // Charger les annonces de l'événement sélectionné
  useEffect(() => {
    if (!selectedEvent) {
      setAnnouncements([]);
      return;
    }
    async function loadAnnouncements() {
      const { data } = await supabase
        .from("event_announcements")
        .select("*")
        .eq("event_id", selectedEvent)
        .order("published_at", { ascending: false });
      if (data) setAnnouncements(data);
    }
    loadAnnouncements();
  }, [selectedEvent]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedEvent) return;

    setSubmitting(true);

    let expiresAt: string | null = null;
    if (expiresIn) {
      const hours = parseInt(expiresIn);
      if (!isNaN(hours) && hours > 0) {
        expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
      }
    }

    const { error } = await supabase.from("event_announcements").insert({
      event_id: selectedEvent,
      title: title.trim(),
      content: content.trim(),
      announcement_type: type,
      is_pinned: isPinned,
      expires_at: expiresAt,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Erreur lors de la publication");
    } else {
      toast.success("Annonce publiée — visible par les participants");
      setTitle("");
      setContent("");
      setType("info");
      setIsPinned(false);
      setExpiresIn("");
      setShowForm(false);
      // Refresh
      const { data } = await supabase
        .from("event_announcements")
        .select("*")
        .eq("event_id", selectedEvent)
        .order("published_at", { ascending: false });
      if (data) setAnnouncements(data);
    }
  }

  async function togglePin(ann: Announcement) {
    await supabase
      .from("event_announcements")
      .update({ is_pinned: !ann.is_pinned })
      .eq("id", ann.id);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === ann.id ? { ...a, is_pinned: !a.is_pinned } : a))
    );
    toast.success(ann.is_pinned ? "Annonce désépinglée" : "Annonce épinglée en haut");
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    await supabase.from("event_announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Annonce supprimée");
  }

  const currentEvent = events.find((ev) => ev.id === selectedEvent);

  if (loading) {
    return (
      <div className="section-gap">
        <h1 className="font-display text-2xl font-bold">Annonces</h1>
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Annonces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publiez des annonces visibles en temps réel par les participants
          </p>
        </div>
        {selectedEvent && currentEvent && (
          <a
            href={`/annonces/${currentEvent.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le fil public
          </a>
        )}
      </div>

      {/* Sélection d'événement */}
      <div className="rounded-xl border bg-card p-4">
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Sélectionner un événement
        </label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Choisir un événement —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {/* Contenu si événement sélectionné */}
      {selectedEvent && (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {announcements.filter((a) => a.is_pinned).length}
              </p>
              <p className="text-xs text-muted-foreground">Épinglées</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {announcements.filter((a) => a.announcement_type === "urgent").length}
              </p>
              <p className="text-xs text-muted-foreground">Urgentes</p>
            </div>
          </div>

          {/* Bouton publier */}
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle annonce
            </Button>
          </div>

          {/* Formulaire de publication */}
          {showForm && (
            <form onSubmit={handlePublish} className="rounded-xl border bg-card p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Titre</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Changement de salle pour le Panel IA"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Détaillez l'annonce ici..."
                  rows={3}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Expire après (heures)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    placeholder="Optionnel"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Laisser vide = pas d'expiration
                  </p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Épingler en haut</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? "Publication..." : "Publier maintenant"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {/* Liste des annonces */}
          <div className="space-y-3">
            {announcements.length === 0 && !showForm && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune annonce publiée</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Les annonces seront visibles en temps réel par les participants
                </p>
              </div>
            )}

            {announcements.map((ann) => {
              const typeInfo = TYPES.find((t) => t.value === ann.announcement_type) || TYPES[0];
              const Icon = typeInfo.icon;
              const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date();

              return (
                <div
                  key={ann.id}
                  className={`rounded-xl border bg-card p-4 transition ${
                    isExpired ? "opacity-50" : ""
                  } ${ann.is_pinned ? "ring-2 ring-primary/20" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                        <span className={`text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {ann.is_pinned && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                            <Pin className="h-3 w-3" /> Épinglée
                          </span>
                        )}
                        {isExpired && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-muted-foreground">
                            Expirée
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-semibold">{ann.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {ann.content}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Publiée le{" "}
                        {new Date(ann.published_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {ann.expires_at && (
                          <>
                            {" "}
                            — Expire le{" "}
                            {new Date(ann.expires_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePin(ann)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-slate-100 hover:text-primary"
                        title={ann.is_pinned ? "Désépingler" : "Épingler"}
                      >
                        {ann.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
