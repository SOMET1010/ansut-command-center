import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, Download } from "lucide-react";

export const Route = createFileRoute("/org/participants")({
  head: () => ({ meta: [{ title: "Participants — ANSUT EVENT" }] }),
  component: OrgParticipants,
});

type Participant = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  job_position: string | null;
  participant_category: string | null;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  event_id: string;
  events: { name: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

function OrgParticipants() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { data: result, isLoading } = useQuery({
    queryKey: ["org-participants", page, search],
    queryFn: async () => {
      let query = supabase
        .from("event_registrations")
        .select("id, full_name, email, phone, organization, job_position, participant_category, status, created_at, checked_in_at, event_id, events(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as unknown as Participant[], count: count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-muted-foreground mt-1">{result?.count ?? 0} inscription(s)</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !result?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3" />
          <p>Aucune inscription trouvée.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organisation</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-slate-100" };
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.organization ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.checked_in_at ? (
                          <span className="text-xs text-green-600">✅ {new Date(p.checked_in_at).toLocaleTimeString("fr-FR", { timeStyle: "short" })}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(page * PAGE_SIZE) + 1}–{Math.min((page + 1) * PAGE_SIZE, result.count)} sur {result.count}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                ← Précédent
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= result.count}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}