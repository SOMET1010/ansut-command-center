import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, AlertCircle, RefreshCw, Camera, User, Building2, Mail, CalendarCheck } from "lucide-react";
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
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Check-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scannez le QR code du badge pour valider l'arrivée d'un participant.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-signal-ok/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal-ok" />
          <span className="text-xs font-semibold text-signal-ok">{history.length} scan{history.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Grille Scanner + Résultat */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Scanner */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Camera className="h-4 w-4 text-primary" /> Scanner
            </h2>
            {paused && (
              <Button size="sm" variant="ansut-orange" className="rounded-lg" onClick={resume}>
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
                <div className="h-48 w-48 rounded-2xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
              </div>
            )}
          </div>
          {!paused && (
            <div className="bg-muted/50 px-5 py-3 text-center text-xs text-muted-foreground">
              Placez le QR code du badge dans le cadre pour scanner.
            </div>
          )}
        </div>

        {/* Résultat */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Résultat du scan</h2>
          </div>
          <div className="p-5">
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive">Erreur de scan</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-4 rounded-lg" onClick={resume}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Réessayer
                </Button>
              </div>
            ) : result ? (
              <div>
                {/* Bandeau de statut */}
                <div className={`flex items-center gap-3 rounded-xl p-4 ${
                  result.already_checked_in
                    ? "border border-signal-warning/20 bg-signal-warning/5"
                    : "border border-signal-ok/20 bg-signal-ok/5"
                }`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    result.already_checked_in ? "bg-signal-warning/15" : "bg-signal-ok/15"
                  }`}>
                    <CheckCircle2 className={`h-6 w-6 ${
                      result.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                    }`} />
                  </div>
                  <div>
                    <p className={`text-base font-bold ${
                      result.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                    }`}>
                      {result.already_checked_in ? "Déjà enregistré" : "Entrée validée"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.checked_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Informations participant */}
                <div className="mt-5 space-y-4">
                  <h3 className="text-xl font-bold text-foreground">{result.full_name}</h3>
                  <div className="grid gap-3">
                    {result.job_position && (
                      <InfoRow icon={User} label="Fonction" value={result.job_position} />
                    )}
                    {result.organization && (
                      <InfoRow icon={Building2} label="Organisation" value={result.organization} />
                    )}
                    <InfoRow icon={Mail} label="Email" value={result.email} />
                    <InfoRow icon={CalendarCheck} label="Événement" value={result.event_name} />
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="ansut-orange"
                  className="mt-6 w-full rounded-xl font-bold"
                  onClick={resume}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Scanner le participant suivant
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Camera className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  En attente d'un scan...
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Le résultat du check-in apparaîtra ici.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique des scans */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">
            Derniers check-ins ({history.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <ul className="divide-y divide-border">
              {history.map((h) => (
                <li
                  key={h.registration_id + h.checked_at}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      h.already_checked_in
                        ? "bg-signal-warning/10 text-signal-warning"
                        : "bg-signal-ok/10 text-signal-ok"
                    }`}>
                      {h.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.full_name}</p>
                      <p className="text-xs text-muted-foreground">{h.event_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">
                      {new Date(h.checked_at).toLocaleTimeString("fr-FR")}
                    </p>
                    <p className={`text-[10px] font-semibold ${
                      h.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                    }`}>
                      {h.already_checked_in ? "Déjà scanné" : "Validé"}
                    </p>
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
