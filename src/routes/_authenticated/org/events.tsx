import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/org/events")({
  head: () => ({ meta: [{ title: "Programme — ANSUT EVENT" }] }),
  component: OrgEvents,
});

type EventRow = { id: string; name: string; slug: string; location: string | null; starts_at: string; ends_at: string; status: string; capacity: number | null };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "Africa/Abidjan" });
}

function OrgEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["org-events-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, location, starts_at, ends_at, status, capacity")
        .in("status", ["published", "draft"])
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    archived: "bg-slate-100 text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programme</h1>
          <p className="text-muted-foreground mt-1">{events.length} événement(s)</p>
        </div>
        <a href="/org/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nouvel événement
          </Button>
        </a>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3" />
          <p>Aucun événement. Créez-en un nouveau.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Événement</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lieu</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">{ev.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(ev.starts_at)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ev.location ? (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[ev.status] ?? ""}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/org/events/${ev.id}/sessions`} className="text-xs text-muted-foreground hover:text-primary">
                        Sessions
                      </a>
                      <a href={`/org/events/${ev.id}/registrations`} className="text-xs text-muted-foreground hover:text-primary">
                        Inscriptions
                      </a>
                      <a href={`/org/events/${ev.id}/edit`} className="text-xs text-muted-foreground hover:text-primary">
                        Modifier
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}