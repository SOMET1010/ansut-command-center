import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Users } from "lucide-react";
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

  return (
    <div className="section-gap">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Événements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos événements et leurs inscriptions.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/events/new" })}>
          <Plus className="mr-2 h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      <div className="card-elevated rounded-lg border border-border bg-card">

        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Chargement...</p>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold">Aucun événement</h2>
            <p className="mt-1 text-sm text-muted-foreground">Commencez par en créer un.</p>
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
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.name}</TableCell>
                  <TableCell>{new Date(ev.starts_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{ev.location ?? "—"}</TableCell>
                  <TableCell>
                    <span className={
                      ev.status === "published"
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }>
                      {ev.status === "published" ? "Publié" : ev.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {ev.status === "published" && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/e/${ev.slug}`} target="_blank" rel="noreferrer" title="Voir page publique">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/events/$id/registrations" params={{ id: ev.id }} title="Participants">
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/events/$id/edit" params={{ id: ev.id }} title="Éditer">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => togglePublish(ev)}>
                        {ev.status === "published" ? "Dépublier" : "Publier"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(ev)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
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
