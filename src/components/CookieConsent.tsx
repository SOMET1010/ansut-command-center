import { useEffect, useState } from "react";

/**
 * Bannière de consentement cookies conforme RGPD.
 * - Aucun cookie non essentiel n'est activé sans consentement explicite.
 * - Choix granulaires (analytics, fonctionnels) avec acceptation / refus séparés.
 * - Consentement révocable à tout moment via le bouton « Préférences cookies » du footer.
 * - Stocké dans localStorage (clé `ansut.cookie-consent.v1`) — pas un cookie, donc
 *   ne nécessite pas lui-même de consentement.
 */

const STORAGE_KEY = "ansut.cookie-consent.v1";

type Consent = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  decidedAt: string;
};

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: c }));
}

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("cookie-consent-open"));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
    else {
      setAnalytics(existing.analytics);
      setFunctional(existing.functional);
    }

    function open() {
      const c = readConsent();
      if (c) {
        setAnalytics(c.analytics);
        setFunctional(c.functional);
      }
      setShowDetails(true);
      setVisible(true);
    }
    window.addEventListener("cookie-consent-open", open);
    return () => window.removeEventListener("cookie-consent-open", open);
  }, []);

  if (!visible) return null;

  function save(c: Omit<Consent, "necessary" | "decidedAt">) {
    writeConsent({
      necessary: true,
      analytics: c.analytics,
      functional: c.functional,
      decidedAt: new Date().toISOString(),
    });
    setVisible(false);
    setShowDetails(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 shadow-2xl backdrop-blur-md"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p id="cookie-consent-title" className="text-sm font-semibold text-foreground">
              Respect de votre vie privée
            </p>
            <p id="cookie-consent-desc" className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Nous utilisons des cookies strictement nécessaires au fonctionnement de la
              plateforme. Avec votre consentement, nous activons également des cookies
              optionnels pour mesurer l'audience et améliorer votre expérience. Vous
              pouvez accepter, refuser ou personnaliser vos choix à tout moment.{" "}
              <a
                href="/politique-confidentialite#cookies"
                className="text-primary underline hover:no-underline"
              >
                En savoir plus
              </a>
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2">
                <Row label="Essentiels" desc="Toujours actifs — fonctionnement de base." mandatory />
                <Row
                  label="Mesure d'audience"
                  desc="Statistiques anonymisées d'utilisation."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <Row
                  label="Fonctionnels"
                  desc="Mémorisation de vos préférences (thème, filtres)."
                  checked={functional}
                  onChange={setFunctional}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            {!showDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                Personnaliser
              </button>
            )}
            <button
              type="button"
              onClick={() => save({ analytics: false, functional: false })}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Tout refuser
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={() => save({ analytics, functional })}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enregistrer mes choix
              </button>
            ) : (
              <button
                type="button"
                onClick={() => save({ analytics: true, functional: true })}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Tout accepter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  mandatory,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  mandatory?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
      </div>
      {mandatory ? (
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Actif
        </span>
      ) : (
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
      )}
    </label>
  );
}
