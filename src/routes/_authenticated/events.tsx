import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Users, Calendar, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Événements — ANSUT EVENT" }] }),
  component: EventsPage,
});

type EventRow = {
  id: string;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: string;
};

function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id,name,slug,starts_at,ends_at,location,status")
      .order("starts_at", { ascending: false });
    if (error) toast.error(error.message);
    setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(ev: EventRow) {
    const next = ev.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("events").update({ status: next }).eq("id", ev.id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? "Événement publié" : "Événement dépublié");
    load();
  }

  async function remove(ev: EventRow) {
    if (!confirm(`Supprimer "${ev.name}" ? Cette action est irréversible.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) return toast.error(error.message);
    toast.success("Événement supprimé");
    load();
  }

  const publishedCount = events.filter((e) => e.status === "published").length;
  const draftCount = events.filter((e) => e.status === "draft").length;

  return (
    <div className="section-gap">
      {/* En-tête avec statistiques rapides */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Événements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos événements, publications et inscriptions.
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/events/new" })}
          variant="ansut-orange"
          className="rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat icon={Calendar} label="Total" value={events.length} />
        <MiniStat icon={Globe} label="Publiés" value={publishedCount} color="text-signal-ok" />
        <MiniStat icon={Edit} label="Brouillons" value={draftCount} color="text-muted-foreground" />
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Chargement des événements...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-foreground">Aucun événement</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Commencez par créer votre premier événement pour gérer les inscriptions et accréditations.
            </p>
            <Button
              onClick={() => navigate({ to: "/events/new" })}
              variant="ansut-orange"
              className="mt-6 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" /> Créer un événement
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Événement</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Lieu</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{ev.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{ev.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(ev.starts_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ev.location ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {ev.location}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ev.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      {ev.status === "published" && (
                        <Button variant="ghost" size="sm" asChild title="Voir page publique">
                          <a href={`/e/${ev.slug}`} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild title="Inscriptions">
                        <Link to="/events/$id/registrations" params={{ id: ev.id }}>
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild title="Éditer">
                        <Link to="/events/$id/edit" params={{ id: ev.id }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => togglePublish(ev)}
                      >
                        {ev.status === "published" ? "Dépublier" : "Publier"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(ev)}
                        title="Supprimer"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    published: {
      label: "Publié",
      className: "bg-signal-ok/10 text-signal-ok border-signal-ok/20",
    },
    draft: {
      label: "Brouillon",
      className: "bg-muted text-muted-foreground border-border",
    },
    archived: {
      label: "Archivé",
      className: "bg-muted text-muted-foreground/60 border-border",
    },
  };
  const c = config[status] ?? config.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-signal-ok" : "bg-muted-foreground/40"}`} />
      {c.label}
    </span>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color = "text-foreground",
}: {
  icon: typeof Calendar;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
