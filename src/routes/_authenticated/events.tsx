import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Users, Calendar, Globe, FileText, Archive } from "lucide-react";
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

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Globe }> = {
  published: {
    label: "Publié",
    className: "bg-signal-ok/10 text-signal-ok border border-signal-ok/20",
    icon: Globe,
  },
  draft: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border border-border",
    icon: FileText,
  },
  archived: {
    label: "Archivé",
    className: "bg-signal-warning/10 text-signal-warning border border-signal-warning/20",
    icon: Archive,
  },
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

  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;

  return (
    <div className="section-gap">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Événements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos événements et leurs inscriptions.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/events/new" })} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      {/* Compteurs rapides */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <CounterCard label="Total" value={events.length} icon={Calendar} />
          <CounterCard label="Publiés" value={published} icon={Globe} />
          <CounterCard label="Brouillons" value={drafts} icon={FileText} />
        </div>
      )}

      <div className="card-elevated overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Aucun événement</h2>
            <p className="mt-1 text-sm text-muted-foreground">Commencez par en créer un.</p>
            <Button onClick={() => navigate({ to: "/events/new" })} className="mt-4 rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Créer un événement
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => {
                const status = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={ev.id} className="group">
                    <TableCell className="font-medium">{ev.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {new Date(ev.starts_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{ev.location ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
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
                        <Button variant="ghost" size="sm" asChild title="Participants">
                          <Link to="/events/$id/registrations" params={{ id: ev.id }}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Éditer">
                          <Link to="/events/$id/edit" params={{ id: ev.id }}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => togglePublish(ev)} title={ev.status === "published" ? "Dépublier" : "Publier"}>
                          {ev.status === "published" ? "Dépublier" : "Publier"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(ev)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function CounterCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Calendar }) {
  return (
    <div className="card-elevated flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-xl font-bold tabular-nums text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
