import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Search, IdCard } from "lucide-react";
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
import { toCSV, downloadCSV } from "@/lib/csv";
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



function RegistrationsPage() {
  const { id } = Route.useParams();
  const [eventName, setEventName] = useState("");
  const [regs, setRegs] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filtered = regs.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.organization?.toLowerCase().includes(q) ?? false);
    return matchesStatus && matchesSearch;
  });

  function exportCSV() {
    const csv = toCSV(filtered as unknown as Record<string, unknown>[], [
      { key: "full_name", label: "Nom" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Téléphone" },
      { key: "organization", label: "Organisation" },
      { key: "position", label: "Poste" },
      { key: "status", label: "Statut" },
      { key: "created_at", label: "Inscrit le" },
    ]);
    downloadCSV(`inscriptions-${eventName || id}.csv`, csv);
  }

  return (
    <div className="p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/events"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
      </Button>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Participants</h1>
          <p className="mt-1 text-muted-foreground">{eventName} — {filtered.length} inscrit{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="checked_in">Présent</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">Aucune inscription pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Badge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell>{r.organization ?? "—"}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.status}</span>
                  </TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await downloadBadge(r.qr_token);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur badge");
                        }
                      }}
                    >
                      <IdCard className="mr-2 h-4 w-4" /> PDF
                    </Button>
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
