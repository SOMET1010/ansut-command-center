/**
 * Mention officielle République de Côte d'Ivoire · MTNIT
 * Affichée sur toutes les pages via le root layout (header + footer).
 */
import { openCookiePreferences } from "./CookieConsent";

export const OFFICIAL_MENTION =
  "République de Côte d'Ivoire · Ministère de la Transition Numérique et de l'Innovation Technologique";

export function OfficialBanner() {
  return (
    <div className="w-full border-b border-[#2256A3]/10 bg-[#F5EFE6] text-[#2256A3]/70">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-3 px-4 text-[10px] font-medium uppercase tracking-[0.18em] sm:px-6">
        <span className="truncate text-center">
          <span className="hidden sm:inline">{OFFICIAL_MENTION}</span>
          <span className="sm:hidden">RCI · MTNIT</span>
        </span>
      </div>
    </div>
  );
}

export function OfficialFooter() {
  return (
    <footer className="w-full border-t border-[#2256A3]/10 bg-[#2256A3] text-white/75">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-[11px] sm:flex-row sm:text-left sm:px-6">
        <span className="font-medium">{OFFICIAL_MENTION}</span>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 opacity-80 sm:justify-end">
          <a
            href="/mentions-legales"
            className="underline-offset-2 hover:text-white hover:underline"
          >
            Mentions légales
          </a>
          <span className="opacity-40">·</span>
          <a
            href="/politique-confidentialite"
            className="underline-offset-2 hover:text-white hover:underline"
          >
            Politique de confidentialité
          </a>
          <span className="opacity-40">·</span>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="underline-offset-2 hover:text-white hover:underline"
          >
            Préférences cookies
          </button>
          <span className="opacity-40">·</span>
          <span className="opacity-70">© {new Date().getFullYear()} ANSUT</span>
        </div>
      </div>
    </footer>
  );
}
