import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  ScanLine,
  Clock,
  WifiOff,
  Wifi,
} from "lucide-react";
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

type PendingScan = {
  token: string;
  scannedAt: string;
  retries: number;
};

/* ─── Helpers localStorage pour la file d'attente hors-ligne ─── */
const QUEUE_KEY = "ansut_checkin_offline_queue";

function loadQueue(): PendingScan[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingScan[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(token: string) {
  const queue = loadQueue();
  // Éviter les doublons
  if (queue.some((q) => q.token === token)) return;
  queue.push({ token, scannedAt: new Date().toISOString(), retries: 0 });
  saveQueue(queue);
}

function removeFromQueue(token: string) {
  const queue = loadQueue().filter((q) => q.token !== token);
  saveQueue(queue);
}

/* ─── Composant principal ─── */
function CheckinPage() {
  const queryClient = useQueryClient();
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(loadQueue().length);
  const [syncing, setSyncing] = useState(false);
  const lastTokenRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Écouter les changements de connectivité
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Synchronisation automatique quand on revient en ligne
  const syncQueue = useCallback(async () => {
    const queue = loadQueue();
    if (queue.length === 0 || syncing) return;

    setSyncing(true);
    let successCount = 0;

    for (const item of queue) {
      try {
        const { data, error: rpcErr } = await supabase.rpc("check_in_registration", {
          p_qr_token: item.token,
        });
        if (rpcErr) {
          // Incrémenter les retries, abandonner après 5 tentatives
          item.retries += 1;
          if (item.retries >= 5) {
            removeFromQueue(item.token);
            toast.error(`Scan abandonné après 5 tentatives : ${item.token.slice(0, 8)}...`);
          }
          continue;
        }
        const row = (Array.isArray(data) ? data[0] : data) as CheckResult | undefined;
        if (row) {
          setHistory((h) =>
            [row, ...h.filter((x) => x.registration_id !== row.registration_id)].slice(0, 20),
          );
          successCount++;
        }
        removeFromQueue(item.token);
      } catch {
        // Erreur réseau — on arrête la sync
        break;
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} scan${successCount > 1 ? "s" : ""} synchronisé${successCount > 1 ? "s" : ""}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }

    setPendingCount(loadQueue().length);
    setSyncing(false);
  }, [syncing, queryClient]);

  // Lancer la sync quand on revient en ligne
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      void syncQueue();
    }
  }, [isOnline, pendingCount, syncQueue]);

  // Vérification périodique de la queue (toutes les 10s)
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        setPendingCount(loadQueue().length);
        if (loadQueue().length > 0) void syncQueue();
      }
    }, 10_000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncQueue]);

  async function process(token: string) {
    const now = Date.now();
    if (token === lastTokenRef.current && now - lastAtRef.current < 3000) return;
    lastTokenRef.current = token;
    lastAtRef.current = now;
    setPaused(true);
    setError(null);

    // Mode hors-ligne : stocker dans la file d'attente
    if (!navigator.onLine) {
      addToQueue(token);
      setPendingCount(loadQueue().length);
      setResult(null);
      setError(null);
      toast.info("Scan enregistré hors-ligne — sera synchronisé au retour du réseau");
      return;
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc("check_in_registration", {
        p_qr_token: token,
      });
      if (rpcErr) {
        // Si erreur réseau, basculer en mode hors-ligne
        if (
          rpcErr.message.includes("fetch") ||
          rpcErr.message.includes("network") ||
          rpcErr.message.includes("Failed")
        ) {
          addToQueue(token);
          setPendingCount(loadQueue().length);
          setError("Connexion perdue — scan enregistré hors-ligne");
          toast.warning("Connexion perdue — scan mis en file d'attente");
          return;
        }
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
      setHistory((h) =>
        [row, ...h.filter((x) => x.registration_id !== row.registration_id)].slice(0, 20),
      );

      // Invalidation du cache après un check-in réussi
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      if (row.already_checked_in) {
        toast.warning(`Déjà enregistré : ${row.full_name}`);
      } else {
        toast.success(`Bienvenue ${row.full_name}`);
      }
    } catch {
      addToQueue(token);
      setPendingCount(loadQueue().length);
      setError("Erreur réseau — scan enregistré hors-ligne");
      toast.warning("Erreur réseau — scan mis en file d'attente");
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
        <div className="flex items-center gap-3">
          {/* Indicateur de connectivité */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isOnline
                ? "bg-signal-ok/10 text-signal-ok"
                : "bg-signal-warning/10 text-signal-warning"
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "En ligne" : "Hors-ligne"}
          </div>
          {/* Compteur de scans */}
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-signal-ok" />
            {history.length} scan{history.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Bandeau file d'attente hors-ligne */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-signal-warning/30 bg-signal-warning/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <WifiOff className="h-4 w-4 text-signal-warning" />
            <p className="text-sm text-foreground">
              <strong>{pendingCount}</strong> scan{pendingCount > 1 ? "s" : ""} en attente de
              synchronisation
            </p>
          </div>
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => void syncQueue()}
              disabled={syncing}
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sync..." : "Synchroniser"}
            </Button>
          )}
        </div>
      )}

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
            <div
              className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${
                error.includes("hors-ligne")
                  ? "border-signal-warning bg-signal-warning/5"
                  : "border-signal-critical bg-ansut-danger-light"
              }`}
            >
              {error.includes("hors-ligne") ? (
                <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-signal-warning" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-signal-critical" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${error.includes("hors-ligne") ? "text-signal-warning" : "text-signal-critical"}`}
                >
                  {error.includes("hors-ligne") ? "Mode hors-ligne" : "Erreur de scan"}
                </p>
                <p
                  className={`mt-1 text-sm ${error.includes("hors-ligne") ? "text-signal-warning/80" : "text-signal-critical/80"}`}
                >
                  {error}
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="flex flex-1 flex-col">
              <div
                className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${
                  result.already_checked_in
                    ? "border-signal-warning bg-ansut-orange-light"
                    : "border-signal-ok bg-signal-ok/10"
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-6 w-6 shrink-0 ${
                    result.already_checked_in ? "text-signal-warning" : "text-signal-ok"
                  }`}
                />
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
                <li
                  key={h.registration_id + h.checked_at}
                  className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        h.already_checked_in
                          ? "bg-signal-warning/10 text-signal-warning"
                          : "bg-signal-ok/10 text-signal-ok"
                      }`}
                    >
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
                      {new Date(h.checked_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
