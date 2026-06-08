import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toCSVChunked, downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/exports")({
  head: () => ({ meta: [{ title: "Exports CSV — ANSUT EVENT" }] }),
  component: ExportsPage,
});

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  status: string;
};

function ExportsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["exports", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, starts_at, status")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  async function exportRegistrations(ev: EventRow) {
    const key = `regs-${ev.id}`;
    setBusy(key);
    const toastId = toast.loading(`Préparation export — ${ev.name}`);
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", ev.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info("Aucun participant à exporter.", { id: toastId });
        return;
      }
      const csv = await toCSVChunked(
        rows,
        [
          { key: "full_name", label: "Nom" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Téléphone" },
          { key: "organization", label: "Organisation" },
          { key: "position", label: "Poste" },
          { key: "country", label: "Pays" },
          { key: "participant_category", label: "Catégorie" },
          { key: "status", label: "Statut" },
          { key: "created_at", label: "Inscrit le" },
          { key: "checked_in_at", label: "Présent à" },
        ],
        { chunkSize: 500 },
      );
      const slug = (ev.name || ev.id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadCSV(`participants-${slug}.csv`, csv);
      toast.success(`Exporté (${rows.length} lignes)`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur export", { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  async function exportCheckins(ev: EventRow) {
    const key = `chk-${ev.id}`;
    setBusy(key);
    const toastId = toast.loading(`Préparation présences — ${ev.name}`);
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", ev.id)
        .not("checked_in_at", "is", null)
        .order("checked_in_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info("Aucune présence enregistrée.", { id: toastId });
        return;
      }
      const csv = await toCSVChunked(
        rows,
        [
          { key: "full_name", label: "Nom" },
          { key: "email", label: "Email" },
          { key: "organization", label: "Organisation" },
          { key: "checked_in_at", label: "Présent à" },
        ],
        { chunkSize: 500 },
      );
      const slug = (ev.name || ev.id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadCSV(`presences-${slug}.csv`, csv);
      toast.success(`Exporté (${rows.length} lignes)`, { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Retour au tableau de bord
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          Exports de données
        </h1>
        <p className="text-sm text-muted-foreground">
          Téléchargez les listes de participants et les présences au format CSV pour chaque événement.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Aucun événement disponible.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="card-elevated flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{ev.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(ev.starts_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  · {ev.status}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === `regs-${ev.id}`}
                  onClick={() => exportRegistrations(ev)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Participants CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === `chk-${ev.id}`}
                  onClick={() => exportCheckins(ev)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Présences CSV
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/events/$id/registrations" params={{ id: ev.id }}>
                    <FileText className="mr-2 h-4 w-4" />
                    Détails
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
