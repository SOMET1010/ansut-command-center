/**
 * Admin security audit — /admin/security
 * Contenu identique à _authenticated/security-audit.tsx
 * (le guard RequireSuperAdmin est redondant ici car le layout admin vérifie le rôle)
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/security")({
  head: () => ({ meta: [{ title: "Audit de sécurité — ANSUT EVENT" }] }),
  component: SecurityAuditPage,
});

type AuditReport = {
  generated_at: string;
  total_issues: number;
  counts: {
    rls_disabled: number;
    permissive: number;
    pii_exposed: number;
    definer_anon: number;
  };
  checks: {
    rls_disabled_tables: Array<{ table: string }>;
    permissive_write_policies: Array<{ table: string; policy: string; command: string }>;
    sensitive_columns_exposed_to_anon: Array<{ table: string; column: string }>;
    security_definer_callable_by_anon: Array<{ function: string }>;
  };
};

type AuditRun = {
  id: string;
  generated_at: string;
  total_issues: number;
  trigger_source: "manual" | "ddl" | "cron";
  ddl_commands: string[] | null;
  report: AuditReport;
};

function SecurityAuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const qc = useQueryClient();

  const history = useQuery({
    queryKey: ["security-audit-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_audit_runs")
        .select("id, generated_at, total_issues, trigger_source, ddl_commands, report")
        .order("generated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as AuditRun[];
    },
  });

  const audit = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("run_security_audit");
      if (error) throw error;
      return data as unknown as AuditReport;
    },
    onSuccess: (data) => {
      setReport(data);
      qc.invalidateQueries({ queryKey: ["security-audit-history"] });
      toast.success(
        data.total_issues === 0
          ? "Aucune vulnérabilité détectée 🎉"
          : `${data.total_issues} problème(s) détecté(s)`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const displayed = report ?? history.data?.[0]?.report ?? null;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Shield className="size-7 text-primary" />
            Audit de sécurité
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vérifie RLS, colonnes sensibles et fonctions privilégiées.
          </p>
        </div>
        <Button onClick={() => audit.mutate()} disabled={audit.isPending} size="lg">
          {audit.isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Analyse…</>
          ) : (
            <><Shield className="size-4" /> Lancer un audit</>
          )}
        </Button>
      </header>

      {!displayed && !audit.isPending && (
        <Card className="p-10 text-center text-muted-foreground">
          Aucun audit enregistré. Cliquez sur « Lancer un audit » pour analyser la base.
        </Card>
      )}

      {displayed && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Rapport du {new Date(displayed.generated_at).toLocaleString("fr-FR")}
              </h2>
              <span className={`text-sm font-medium ${displayed.total_issues === 0 ? "text-green-600" : "text-orange-600"}`}>
                {displayed.total_issues === 0 ? "✅ Aucune vulnérabilité" : `⚠️ ${displayed.total_issues} problème(s)`}
              </span>
            </div>
          </Card>

          {displayed.counts.rls_disabled > 0 && (
            <Card className="p-6 border-orange-200 bg-orange-50">
              <h3 className="font-semibold text-orange-800 mb-2">🔴 Tables RLS désactivées</h3>
              <ul className="list-disc pl-5 text-sm text-orange-700">
                {displayed.checks.rls_disabled_tables.map((t) => (
                  <li key={t.table}>{t.table}</li>
                ))}
              </ul>
            </Card>
          )}

          {displayed.counts.permissive > 0 && (
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold text-yellow-800 mb-2">🟡 Politiques d'écriture permissives</h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                {displayed.checks.permissive_write_policies.map((p) => (
                  <li key={`${p.table}-${p.policy}`}>• {p.table}.{p.policy} ({p.command})</li>
                ))}
              </ul>
            </Card>
          )}

          {displayed.counts.pii_exposed > 0 && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-800 mb-2">🔴 Colonnes sensibles exposées à anon</h3>
              <ul className="list-disc pl-5 text-sm text-red-700">
                {displayed.checks.sensitive_columns_exposed_to_anon.map((c) => (
                  <li key={`${c.table}.${c.column}`}>{c.table}.{c.column}</li>
                ))}
              </ul>
            </Card>
          )}

          {displayed.counts.definer_anon > 0 && (
            <Card className="p-6 border-purple-200 bg-purple-50">
              <h3 className="font-semibold text-purple-800 mb-2">🟣 Fonctions SECURITY DEFINER accessibles à anon</h3>
              <ul className="list-disc pl-5 text-sm text-purple-700">
                {displayed.checks.security_definer_callable_by_anon.map((f) => (
                  <li key={f.function}>{f.function}</li>
                ))}
              </ul>
            </Card>
          )}

          {displayed.total_issues === 0 && (
            <Card className="p-6 border-green-200 bg-green-50">
              <p className="text-green-800 font-medium">✅ Aucune vulnérabilité détectée dans la configuration actuelle.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}