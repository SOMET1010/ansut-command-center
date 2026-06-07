import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, AlertCircle, RefreshCw, Camera } from "lucide-react";
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
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scannez le QR code du badge pour valider l'arrivée.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="card-elevated rounded-lg border border-border bg-card p-4">

          <div className="flex items-center justify-between">
            <h2 className="font-semibold inline-flex items-center gap-2"><Camera className="h-4 w-4" /> Scanner</h2>
            {paused && (
              <Button size="sm" variant="outline" onClick={resume}>
                <RefreshCw className="mr-2 h-4 w-4" /> Scanner le suivant
              </Button>
            )}
          </div>
          <div className="mt-3 overflow-hidden rounded-lg bg-black aspect-square">
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
          </div>
        </div>

        <div className="card-elevated rounded-lg border border-border bg-card p-5">
          {error ? (
            <div className="rounded-md border-l-4 border-signal-critical bg-ansut-danger-light p-3 text-sm text-signal-critical">
              <AlertCircle className="mb-2 h-5 w-5" />
              {error}
            </div>
          ) : result ? (
            <div>
              <div className={`flex items-start gap-3 rounded-md border-l-4 p-3 ${
                result.already_checked_in
                  ? "border-signal-warning bg-ansut-orange-light"
                  : "border-signal-ok bg-signal-ok/10"
              }`}>
                <CheckCircle2 className={`mt-0.5 h-6 w-6 ${
                  result.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                }`} />

                <div>
                  <div className="text-sm font-medium">
                    {result.already_checked_in ? "Déjà enregistré" : "Entrée validée"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(result.checked_at).toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-2xl font-bold">{result.full_name}</h3>
              {(result.job_position || result.organization) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {[result.job_position, result.organization].filter(Boolean).join(" • ")}
                </p>
              )}
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Événement : </span>
                <span className="font-medium">{result.event_name}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Email : </span>{result.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">En attente d'un scan…</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold">Derniers check-ins</h2>
          <div className="card-elevated overflow-hidden rounded-lg border border-border bg-card">

            <ul className="divide-y divide-border">
              {history.map((h) => (
                <li key={h.registration_id + h.checked_at} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="font-medium">{h.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.checked_at).toLocaleTimeString("fr-FR")} — {h.event_name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
