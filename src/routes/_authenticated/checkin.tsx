import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, AlertCircle, RefreshCw, Camera, ScanLine, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/checkin")({
  head: () => ({ meta: [{ title: "Check-in — ANSUT EVENT" }] }),
  component: CheckinPage,
});

type CheckResult = {
  registration_id: string;
  full_name: string;
  email: string;
  organization: string | null;
  job_position: string | null;
  event_name: string;
  reg_status: string;
  checked_at: string;
  already_checked_in: boolean;
};

function CheckinPage() {
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const lastTokenRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);

  async function process(token: string) {
    const now = Date.now();
    if (token === lastTokenRef.current && now - lastAtRef.current < 3000) return;
    lastTokenRef.current = token;
    lastAtRef.current = now;
    setPaused(true);
    setError(null);

    const { data, error: rpcErr } = await supabase.rpc("check_in_registration", {
      p_qr_token: token,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      toast.error(rpcErr.message);
      setResult(null);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as CheckResult | undefined;
    if (!row) {
      setError("Aucune donnée renvoyée");
      return;
    }
    setResult(row);
    setHistory((h) => [row, ...h.filter((x) => x.registration_id !== row.registration_id)].slice(0, 20));
    if (row.already_checked_in) {
      toast.warning(`Déjà enregistré : ${row.full_name}`);
    } else {
      toast.success(`Bienvenue ${row.full_name}`);
    }
  }

  function resume() {
    setResult(null);
    setError(null);
    setPaused(false);
  }

  return (
    <div className="section-gap">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Check-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scannez le QR code du badge pour valider l'arrivée.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-signal-ok" />
          {history.length} scan{history.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* Scanner */}
        <div className="card-elevated overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
              <Camera className="h-4 w-4 text-primary" /> Scanner
            </h2>
            {paused && (
              <Button size="sm" variant="outline" onClick={resume} className="rounded-lg">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Suivant
              </Button>
            )}
          </div>
          <div className="relative aspect-square bg-black">
            <Scanner
              paused={paused}
              onScan={(codes) => {
                const v = codes?.[0]?.rawValue;
                if (v) process(v.trim());
              }}
              onError={(e) => console.warn("scanner error", e)}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
            {/* Overlay viseur */}
            {!paused && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48 sm:h-56 sm:w-56">
                  <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-[3px] border-t-[3px] border-secondary" />
                  <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-[3px] border-t-[3px] border-secondary" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-[3px] border-l-[3px] border-secondary" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-[3px] border-r-[3px] border-secondary" />
                  <ScanLine className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse text-secondary/80" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résultat */}
        <div className="card-elevated flex flex-col rounded-2xl border border-border bg-card p-5">
          {error ? (
            <div className="flex items-start gap-3 rounded-xl border-l-4 border-signal-critical bg-ansut-danger-light p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-signal-critical" />
              <div>
                <p className="text-sm font-semibold text-signal-critical">Erreur de scan</p>
                <p className="mt-1 text-sm text-signal-critical/80">{error}</p>
              </div>
            </div>
          ) : result ? (
            <div className="flex flex-1 flex-col">
              <div className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${
                result.already_checked_in
                  ? "border-signal-warning bg-ansut-orange-light"
                  : "border-signal-ok bg-signal-ok/10"
              }`}>
                <CheckCircle2 className={`mt-0.5 h-6 w-6 shrink-0 ${
                  result.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                }`} />
                <div>
                  <p className="text-sm font-semibold">
                    {result.already_checked_in ? "Déjà enregistré" : "Entrée validée"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(result.checked_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-2xl font-bold text-foreground">{result.full_name}</h3>
                {(result.job_position || result.organization) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[result.job_position, result.organization].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Événement</span>
                    <span className="font-medium">{result.event_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{result.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-semibold text-primary">{result.reg_status}</span>
                  </div>
                </div>
              </div>

              <Button onClick={resume} className="mt-5 w-full rounded-xl" variant="ansut-orange">
                <RefreshCw className="mr-2 h-4 w-4" /> Scanner le suivant
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ScanLine className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                En attente d'un scan...
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Pointez la caméra vers un QR code de badge
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Clock className="h-4 w-4 text-primary" />
            Derniers check-ins ({history.length})
          </h2>
          <div className="card-elevated overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {history.map((h) => (
                <li key={h.registration_id + h.checked_at} className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      h.already_checked_in
                        ? "bg-signal-warning/10 text-signal-warning"
                        : "bg-signal-ok/10 text-signal-ok"
                    }`}>
                      {h.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">{h.full_name}</span>
                      {h.organization && (
                        <span className="ml-2 text-xs text-muted-foreground">{h.organization}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {new Date(h.checked_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground/70">{h.event_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
