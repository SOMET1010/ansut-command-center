import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/lib/supabase";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit trail — ANSUT EVENT" }] }),
  component: AuditTrailPage,
});

type AuditEntry = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

function AuditTrailPage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-audit-trail"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from("audit_trail")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AuditEntry[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Journal d'audit
        </h1>
        <p className="text-muted-foreground mt-1">{entries.length} entrée(s)</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun événement dans le journal d'audit.
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Table</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Record</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.table_name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.record_id ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.ip_address ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}