import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Users, FileText, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type StatusFilter = "all" | "confirmed" | "pending" | "checked_in" | "cancelled";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "confirmed", label: "Confirmé" },
  { value: "pending", label: "En attente" },
  { value: "checked_in", label: "Présent (check-in)" },
  { value: "cancelled", label: "Annulé" },
];

function ExportsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  // Filtres
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

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

  // Catégories distinctes (rôle / type de participant)
  const { data: categories = [] } = useQuery({
    queryKey: ["exports", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("participant_category")
        .not("participant_category", "is", null);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r: { participant_category: string | null }) => {
        const v = (r.participant_category ?? "").trim();
        if (v) set.add(v);
      });
      return Array.from(set).sort();
    },
  });

  const filterSummary = useMemo(() => {
    const bits: string[] = [];
    if (dateFrom) bits.push(`depuis ${dateFrom}`);
    if (dateTo) bits.push(`jusqu'au ${dateTo}`);
    if (statusFilter !== "all") {
      bits.push(STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter);
    }
    if (categoryFilter !== "all") bits.push(`rôle : ${categoryFilter}`);
    return bits.length ? bits.join(" · ") : "aucun filtre actif";
  }, [dateFrom, dateTo, statusFilter, categoryFilter]);

  function resetFilters() {
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }

  function applyServerFilters<T extends ReturnType<typeof supabase.from>>(
    query: T,
    opts: { checkinsOnly?: boolean } = {},
  ) {
    let q: ReturnType<typeof supabase.from> = query;
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (categoryFilter !== "all") q = q.eq("participant_category", categoryFilter);
    if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59.999Z`);
    if (opts.checkinsOnly) q = q.not("checked_in_at", "is", null);
    return q as T;
  }

  async function exportRegistrations(ev: EventRow) {
    const key = `regs-${ev.id}`;
    setBusy(key);
    const toastId = toast.loading(`Préparation export — ${ev.name}`);
    try {
      const base = supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", ev.id)
        .order("created_at", { ascending: false });
      const { data, error } = await applyServerFilters(base);
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info("Aucun participant ne correspond aux filtres.", { id: toastId });
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
      const base = supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", ev.id)
        .order("checked_in_at", { ascending: true });
      const { data, error } = await applyServerFilters(base, { checkinsOnly: true });
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info("Aucune présence ne correspond aux filtres.", { id: toastId });
        return;
      }
      const csv = await toCSVChunked(
        rows,
        [
          { key: "full_name", label: "Nom" },
          { key: "email", label: "Email" },
          { key: "organization", label: "Organisation" },
          { key: "participant_category", label: "Catégorie" },
          { key: "checked_in_at", label: "Présent à" },
        ],
        { chunkSize: 500 },
      );
      const slug = (ev.name || ev.id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadCSV(`presences-${slug}.csv`, csv);
      toast.success(`Exporté (${rows.length} lignes)`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur export", { id: toastId });
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

      {/* Filtres */}
      <div className="card-elevated rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4 text-primary" /> Filtres d'export
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              Inscrits à partir du
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              Inscrits jusqu'au
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Statut</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rôle / catégorie</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Filtres actifs : {filterSummary}</p>
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
