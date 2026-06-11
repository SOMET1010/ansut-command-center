import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/org/exports")({
  head: () => ({ meta: [{ title: "Exports — ANSUT EVENT" }] }),
  component: OrgExports,
});

type EventRow = { id: string; name: string; starts_at: string; status: string };

async function exportRegistrations(eventId: string, eventName: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, full_name, email, phone, organization, job_position, participant_category, status, checked_in_at, created_at")
    .eq("event_id", eventId);

  if (error || !data) return;

  const rows = data.map((r) => [
    r.id,
    r.full_name,
    r.email,
    r.phone ?? "",
    r.organization ?? "",
    r.job_position ?? "",
    r.participant_category ?? "",
    r.status,
    r.checked_in_at ?? "",
    r.created_at,
  ]);

  const csv = ["ID,Nom,Email,Téléphone,Organisation,Fonction,Catégorie,Statut,Check-in,Date inscription", ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inscriptions-${eventName.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function OrgExports() {
  const [selectedEvent, setSelectedEvent] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["org-export-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, starts_at, status")
        .in("status", ["published", "draft"])
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exports de données</h1>
        <p className="text-muted-foreground mt-1">Téléchargez les inscriptions en CSV</p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export inscriptions
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Événement</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Choisir un événement…</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({new Date(e.starts_at).toLocaleDateString("fr-FR")})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={async () => {
                const ev = events.find((e) => e.id === selectedEvent);
                if (!ev) return;
                await exportRegistrations(ev.id, ev.name);
              }}
              disabled={!selectedEvent}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter en CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Export par type */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Inscriptions complètes</p>
              <p className="text-xs text-muted-foreground">Toutes les colonnes</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Inclut : ID, nom, email, téléphone, organisation, fonction, catégorie, statut, check-in, date.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Participants check-in</p>
              <p className="text-xs text-muted-foreground">Uniquement les check-ins</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Filtre automatique sur les participants ayant été scannés à l'entrée.
          </p>
        </div>
      </div>
    </div>
  );
}