import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/staff/participants")({
  head: () => ({ meta: [{ title: "Participants staff — ANSUT EVENT" }] }),
  component: StaffParticipants,
});

type Participant = { id: string; full_name: string; email: string; organization: string | null; status: string; checked_in_at: string | null; created_at: string };

function StaffParticipants() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { data: result, isLoading } = useQuery({
    queryKey: ["staff-participants", page, search],
    queryFn: async () => {
      let query = supabase
        .from("event_registrations")
        .select("id, full_name, email, organization, status, checked_in_at, created_at", { count: "exact" })
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

  const checkedIn = result?.data.filter((p) => p.checked_in_at).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Participants
        </h1>
        <p className="text-muted-foreground mt-1">
          {result?.count ?? 0} inscription(s) — {checkedIn} check-in(s)
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{checkedIn}</p>
              <p className="text-sm text-muted-foreground">Check-ins</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{(result?.count ?? 0) - checkedIn}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !result?.data.length ? (
        <p className="text-center text-muted-foreground py-8">Aucune inscription.</p>
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organisation</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.organization ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.checked_in_at ? (
                        <span className="text-xs text-green-600 font-medium">✅ Check-in ✅</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">En attente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(page * PAGE_SIZE) + 1}–{Math.min((page + 1) * PAGE_SIZE, result.count)} sur {result.count}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">
                ← Précédent
              </button>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * PAGE_SIZE >= result.count}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}