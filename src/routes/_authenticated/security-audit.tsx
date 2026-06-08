import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Loader2, History, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { RequireSuperAdmin } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/security-audit")({
  head: () => ({ meta: [{ title: "Audit de sécurité — ANSUT EVENT" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SecurityAuditPage />
    </RequireSuperAdmin>
  ),
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

  // Fall back to the latest persisted run if the user hasn't clicked "run" yet.
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
            Vérifie la configuration RLS, les colonnes sensibles exposées et les fonctions privilégiées.
            Accessible aux super administrateurs uniquement.
          </p>
        </div>
        <Button onClick={() => audit.mutate()} disabled={audit.isPending} size="lg">
          {audit.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Analyse…
            </>
          ) : (
            <>
              <Shield className="size-4" /> Lancer un audit
            </>
          )}
        </Button>
      </header>

      {!displayed && !audit.isPending && (
        <Card className="p-10 text-center text-muted-foreground">
          Aucun audit enregistré. Clique sur « Lancer un audit » pour analyser la base.
        </Card>
      )}

      {displayed && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {report ? "Score global (dernier lancement)" : "Dernier rapport enregistré"}
                </p>
                <p className="mt-1 text-4xl font-bold">
                  {displayed.total_issues === 0 ? (
                    <span className="text-emerald-600">0 problème</span>
                  ) : (
                    <span className="text-amber-600">{displayed.total_issues} problème(s)</span>
                  )}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Généré le {new Date(displayed.generated_at).toLocaleString("fr-FR")}
                </p>
              </div>
              {displayed.total_issues === 0 ? (
                <CheckCircle2 className="size-16 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-16 text-amber-500" />
              )}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <CheckCard
              title="Tables sans RLS"
              count={displayed.counts.rls_disabled}
              items={displayed.checks.rls_disabled_tables.map((t) => t.table)}
              description="Tables du schéma public sans Row Level Security activé."
            />
            <CheckCard
              title="Règles permissives (écriture)"
              count={displayed.counts.permissive}
              items={displayed.checks.permissive_write_policies.map(
                (p) => `${p.table} · ${p.policy} (${p.command})`,
              )}
              description="Politiques INSERT/UPDATE/DELETE avec USING(true) ou WITH CHECK(true)."
            />
            <CheckCard
              title="Colonnes sensibles exposées"
              count={displayed.counts.pii_exposed}
              items={displayed.checks.sensitive_columns_exposed_to_anon.map(
                (c) => `${c.table}.${c.column}`,
              )}
              description="Colonnes email/téléphone/mot de passe/token accessibles aux visiteurs anonymes."
            />
            <CheckCard
              title="Fonctions privilégiées publiques"
              count={displayed.counts.definer_anon}
              items={displayed.checks.security_definer_callable_by_anon.map((f) => f.function)}
              description="Fonctions SECURITY DEFINER exécutables sans authentification (hors RPC participant whitelist)."
            />
          </div>
        </>
      )}

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <History className="size-5 text-primary" />
          <h2 className="font-semibold">Historique des audits</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            20 derniers (manuels + automatiques après migration)
          </span>
        </div>
        {history.isLoading && (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        )}
        {history.data && history.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun rapport enregistré pour l'instant. Le prochain audit (manuel ou après migration)
            apparaîtra ici.
          </p>
        )}
        {history.data && history.data.length > 0 && (
          <ul className="divide-y divide-border">
            {history.data.map((run) => (
              <li key={run.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {new Date(run.generated_at).toLocaleString("fr-FR")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.trigger_source === "ddl"
                          ? "bg-blue-100 text-blue-700"
                          : run.trigger_source === "cron"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {run.trigger_source === "ddl" && <Zap className="size-3" />}
                      {run.trigger_source === "ddl"
                        ? "Après migration"
                        : run.trigger_source === "cron"
                          ? "Planifié"
                          : "Manuel"}
                    </span>
                  </div>
                  {run.ddl_commands && run.ddl_commands.length > 0 && (
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {run.ddl_commands.slice(0, 3).join(" · ")}
                      {run.ddl_commands.length > 3 ? ` (+${run.ddl_commands.length - 3})` : ""}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    run.total_issues === 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {run.total_issues} problème(s)
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CheckCard({
  title,
  count,
  items,
  description,
}: {
  title: string;
  count: number;
  items: string[];
  description: string;
}) {
  const ok = count === 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {count}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {items.map((it) => (
            <li key={it} className="rounded bg-muted px-2 py-1 font-mono text-xs">
              {it}
            </li>
          ))}
        </ul>
      )}
      {ok && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="size-4" /> Conforme
        </div>
      )}
    </Card>
  );
}
