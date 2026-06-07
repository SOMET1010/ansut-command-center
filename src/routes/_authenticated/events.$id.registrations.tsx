import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Search, IdCard, Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toCSVChunked, downloadCSV } from "@/lib/csv";
import { downloadBadge } from "@/lib/badges";

export const Route = createFileRoute("/_authenticated/events/$id/registrations")({
  head: () => ({ meta: [{ title: "Participants — ANSUT EVENT" }] }),
  component: RegistrationsPage,
});

type Reg = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  position: string | null;
  status: string;
  qr_token: string;
  created_at: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  confirmed: {
    label: "Confirmé",
    className: "bg-signal-ok/10 text-signal-ok border-signal-ok/20",
    icon: CheckCircle2,
  },
  pending: {
    label: "En attente",
    className: "bg-signal-warning/10 text-signal-warning border-signal-warning/20",
    icon: Clock,
  },
  checked_in: {
    label: "Présent",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Annulé",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
};

function RegistrationsPage() {
  const { id } = Route.useParams();
  const [eventName, setEventName] = useState("");
  const [regs, setRegs] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: ev }, { data: r, error }] = await Promise.all([
      supabase.from("events").select("name").eq("id", id).single(),
      supabase.from("event_registrations").select("*").eq("event_id", id).order("created_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setEventName(ev?.name ?? "");
    setRegs((r ?? []) as Reg[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  const filtered = useMemo(() => regs.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.organization?.toLowerCase().includes(q) ?? false);
    return matchesStatus && matchesSearch;
  }), [regs, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Statistiques rapides
  const confirmedCount = regs.filter((r) => r.status === "confirmed").length;
  const checkedInCount = regs.filter((r) => r.status === "checked_in").length;
  const pendingCount = regs.filter((r) => r.status === "pending").length;

  async function runBackgroundCSV(
    label: string,
    rows: Record<string, unknown>[],
    columns: { key: string; label: string }[],
    filename: string,
  ) {
    if (rows.length === 0) {
      toast.info("Rien à exporter.");
      return;
    }
    setExporting(true);
    const toastId = toast.loading(`${label} : préparation (0/${rows.length})...`);
    try {
      const csv = await toCSVChunked(rows, columns, {
        chunkSize: 500,
        onProgress: (done, total) => {
          toast.loading(`${label} : ${done}/${total}...`, { id: toastId });
        },
      });
      downloadCSV(filename, csv);
      toast.success(`${label} exporté (${rows.length} lignes)`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur export", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  function exportCSV() {
    void runBackgroundCSV(
      "Inscriptions",
      filtered as unknown as Record<string, unknown>[],
      [
        { key: "full_name", label: "Nom" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Téléphone" },
        { key: "organization", label: "Organisation" },
        { key: "position", label: "Poste" },
        { key: "status", label: "Statut" },
        { key: "created_at", label: "Inscrit le" },
      ],
      `inscriptions-${eventName || id}.csv`,
    );
  }

  async function exportCheckins() {
    const checked = regs.filter((r) => r.checked_in_at);
    if (checked.length === 0) {
      toast.info("Aucun check-in à exporter.");
      return;
    }
    const scannerIds = Array.from(
      new Set(checked.map((r) => r.checked_in_by).filter(Boolean) as string[]),
    );
    const scannerMap = new Map<string, string>();
    if (scannerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", scannerIds);
      (profs ?? []).forEach((p) => {
        scannerMap.set(p.id, p.full_name || p.email || p.id.slice(0, 8));
      });
    }
    const rows = checked
      .slice()
      .sort((a, b) => (a.checked_in_at! < b.checked_in_at! ? -1 : 1))
      .map((r) => ({
        full_name: r.full_name,
        email: r.email,
        status: r.status,
        checked_in_at: r.checked_in_at
          ? new Date(r.checked_in_at).toLocaleString("fr-FR")
          : "",
        scanner: r.checked_in_by ? scannerMap.get(r.checked_in_by) ?? r.checked_in_by : "",
      }));
    void runBackgroundCSV(
      "Check-ins",
      rows as unknown as Record<string, unknown>[],
      [
        { key: "full_name", label: "Nom" },
        { key: "email", label: "Email" },
        { key: "status", label: "Statut" },
        { key: "checked_in_at", label: "Heure check-in" },
        { key: "scanner", label: "Scanné par" },
      ],
      `checkins-${eventName || id}.csv`,
    );
  }

  return (
    <div className="section-gap">
      {/* Navigation retour */}
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux événements
        </Link>
      </Button>

      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Participants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {eventName} — {filtered.length} inscrit{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={exportCheckins}
            disabled={exporting || regs.every((r) => !r.checked_in_at)}
          >
            <Download className="mr-2 h-4 w-4" /> Export check-ins
          </Button>
          <Button
            size="sm"
            className="rounded-lg"
            onClick={exportCSV}
            disabled={exporting || filtered.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat icon={Users} label="Total" value={regs.length} />
        <QuickStat icon={CheckCircle2} label="Confirmés" value={confirmedCount} color="text-signal-ok" />
        <QuickStat icon={CheckCircle2} label="Présents" value={checkedInCount} color="text-primary" />
        <QuickStat icon={Clock} label="En attente" value={pendingCount} color="text-signal-warning" />
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou organisation..."
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="checked_in">Présent</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Chargement des inscriptions...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Aucune inscription pour le moment.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Participant</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Organisation</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold">Inscrit le</TableHead>
                <TableHead className="text-right font-semibold">Badge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r) => {
                const statusCfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <TableRow key={r.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {r.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{r.full_name}</p>
                          {r.position && (
                            <p className="truncate text-xs text-muted-foreground">{r.position}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="truncate">{r.email}</p>
                        {r.phone && (
                          <p className="text-xs text-muted-foreground">{r.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{r.organization ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg opacity-70 transition-opacity group-hover:opacity-100"
                        onClick={async () => {
                          try {
                            await downloadBadge(r.qr_token);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Erreur badge");
                          }
                        }}
                      >
                        <IdCard className="mr-1.5 h-3.5 w-3.5" /> Badge
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} sur {filtered.length}
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular-nums text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color = "text-foreground",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-1.5 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
