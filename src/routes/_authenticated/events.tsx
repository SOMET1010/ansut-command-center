import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Événements — ANSUT EVENT" }] }),
  component: EventsPage,
});

type Event = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: string;
};

function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("events")
      .select("id,name,starts_at,ends_at,location,status")
      .order("starts_at", { ascending: false })
      .then(({ data }) => {
        setEvents((data ?? []) as Event[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Événements</h1>
          <p className="mt-1 text-muted-foreground">Tous vos événements en un coup d'œil.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Aucun événement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La création d'événements arrive en Phase 2.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">{e.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(e.starts_at).toLocaleDateString("fr-FR")} — {e.location ?? "Lieu à définir"}
              </p>
              <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
