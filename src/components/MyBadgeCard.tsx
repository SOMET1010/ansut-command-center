import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IdCard, Maximize2, Download, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { downloadBadge } from "@/lib/badges";

/**
 * Phase 4 — Lot 2 : « Mon badge » en tête d'Accueil.
 * Source unique : RPC `me_registration(qr_token)` qui lit `event_registrations`
 * (la même source utilisée par check-in, networking et rdv).
 * Le QR encode le `qr_token` brut, format attendu par le scanner d'accueil.
 */

type MeRegistration = {
  id: string;
  full_name: string;
  organization: string | null;
  participant_category: string | null;
  status: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  exhibitor: "Exposant",
  sponsor: "Sponsor",
  speaker: "Intervenant",
  vip: "VIP",
  press: "Presse",
  staff: "Staff",
  visitor: "Visiteur",
  other: "Participant",
};

function categoryLabel(c: string | null | undefined) {
  if (!c) return "Participant";
  return CATEGORY_LABELS[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
}

const STATUS_META: Record<
  string,
  { label: string; tone: "ok" | "info" | "warn" | "danger" }
> = {
  confirmed: { label: "Confirmé", tone: "ok" },
  checked_in: { label: "Check-in effectué", tone: "info" },
  pending: { label: "En attente de validation", tone: "warn" },
  cancelled: { label: "Inscription annulée", tone: "danger" },
};

function statusMeta(s: string | null | undefined) {
  if (!s) return { label: "Statut inconnu", tone: "warn" as const };
  return STATUS_META[s] ?? { label: s, tone: "warn" as const };
}

const TONE_CLASSES: Record<"ok" | "info" | "warn" | "danger", string> = {
  ok: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  info: "bg-sky-100 text-sky-800 ring-sky-200",
  warn: "bg-amber-100 text-amber-800 ring-amber-200",
  danger: "bg-rose-100 text-rose-800 ring-rose-200",
};

// Cache offline-first : la dernière identité connue est rejouée instantanément
// (les Wi-Fi/4G de salon sont souvent saturés). On rafraîchit ensuite si le réseau répond.
const CACHE_PREFIX = "ansut:badge:data:";

function readCache(qrToken: string): MeRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}${qrToken}`);
    return raw ? (JSON.parse(raw) as MeRegistration) : null;
  } catch {
    return null;
  }
}

function writeCache(qrToken: string, data: MeRegistration) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${CACHE_PREFIX}${qrToken}`, JSON.stringify(data));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function MyBadgeCard({ qrToken }: { qrToken: string }) {
  const [me, setMe] = useState<MeRegistration | null>(() => readCache(qrToken));
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrLargeDataUrl, setQrLargeDataUrl] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.rpc("me_registration", { p_qr_token: qrToken });
      if (cancelled) return;
      if (!error && data && (!Array.isArray(data) || data.length > 0)) {
        const row = (Array.isArray(data) ? data[0] : data) as MeRegistration;
        setMe(row);
        writeCache(qrToken, row);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  useEffect(() => {
    const opts = {
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M" as const,
    };
    QRCode.toDataURL(qrToken, { ...opts, width: 220 }).then(setQrDataUrl).catch(console.error);
    QRCode.toDataURL(qrToken, { ...opts, width: 560 }).then(setQrLargeDataUrl).catch(console.error);
  }, [qrToken]);

  // Wake Lock : empêche l'écran de s'éteindre quand le QR est affiché en plein écran.
  // C'est ce qui rapproche le plus le web d'un « mode badge » natif.
  useEffect(() => {
    if (!open || typeof navigator === "undefined") return;
    type WakeLockSentinel = { release: () => Promise<void> };
    type WakeLockAPI = { request: (type: "screen") => Promise<WakeLockSentinel> };
    const wl = (navigator as unknown as { wakeLock?: WakeLockAPI }).wakeLock;
    if (!wl) return;
    let sentinel: WakeLockSentinel | null = null;
    wl.request("screen").then((s) => {
      sentinel = s;
    }).catch(() => {
      /* user gesture missing or unsupported — silent fallback */
    });
    return () => {
      sentinel?.release().catch(() => undefined);
    };
  }, [open]);

  if (!me) return null;

  const status = statusMeta(me.status);
  const isCancelled = me.status === "cancelled";

  return (
    <section
      aria-label="Mon badge"
      className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="shrink-0 self-center rounded-xl bg-white p-3 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Mon QR Code" className="h-32 w-32" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center text-xs text-muted-foreground">
              QR…
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <IdCard className="h-3.5 w-3.5" />
            Mon badge
          </div>
          <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground">
            {me.full_name}
          </h2>
          {me.organization && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{me.organization}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {categoryLabel(me.participant_category)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${TONE_CLASSES[status.tone]}`}
            >
              {status.label}
            </span>
          </div>
          {isCancelled && (
            <p className="mt-2 text-[11px] font-medium text-rose-700">
              Ce badge n'est plus valide. Contactez l'organisation ANSUT.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setOpen(true)}
              className="gap-1.5"
            >
              <Maximize2 className="h-4 w-4" /> Agrandir
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadBadge(qrToken);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Erreur badge");
                } finally {
                  setDownloading(false);
                }
              }}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Génération…" : "Télécharger le PDF"}
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Présentez ce QR Code à l'entrée pour le check-in.
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 sm:max-w-lg">
          <div className="relative flex flex-col items-center bg-white p-6 sm:p-8 text-center text-slate-900">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer et revenir"
              className="absolute right-4 top-4 rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <DialogTitle className="sr-only">Mon badge — {me.full_name}</DialogTitle>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Mon badge
            </div>
            <h3 className="mt-2 text-2xl font-bold">{me.full_name}</h3>
            {me.organization && (
              <p className="mt-0.5 text-sm text-slate-500">{me.organization}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {categoryLabel(me.participant_category)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${TONE_CLASSES[status.tone]}`}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              {qrLargeDataUrl ? (
                <img
                  src={qrLargeDataUrl}
                  alt="Mon QR Code agrandi"
                  className="h-72 w-72 sm:h-80 sm:w-80"
                />
              ) : null}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Augmentez la luminosité de votre écran pour faciliter le scan.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
