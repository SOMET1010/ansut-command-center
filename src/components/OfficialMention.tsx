/**
 * Mention officielle République de Côte d'Ivoire · MTNIT
 * Affichée sur toutes les pages via le root layout (header + footer).
 */

export const OFFICIAL_MENTION =
  "République de Côte d'Ivoire · Ministère de la Transition Numérique et de l'Innovation Technologique";

export function OfficialBanner() {
  return (
    <div className="w-full border-b border-white/10 bg-[#08172E] text-white/80">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-3 px-4 text-[10px] font-medium uppercase tracking-[0.18em] sm:px-6">
        <span className="truncate">
          <span className="hidden sm:inline">{OFFICIAL_MENTION}</span>
          <span className="sm:hidden">RCI · MTNIT</span>
        </span>
        <span className="hidden opacity-60 md:inline">Édition officielle 2026</span>
      </div>
    </div>
  );
}

export function OfficialFooter() {
  return (
    <footer className="w-full border-t border-border bg-[#08172E] text-white/75">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-[11px] sm:flex-row sm:text-left sm:px-6">
        <span className="font-medium">{OFFICIAL_MENTION}</span>
        <div className="flex items-center gap-3 opacity-80">
          <a
            href="/mentions-legales"
            className="underline-offset-2 hover:text-white hover:underline"
          >
            Mentions légales
          </a>
          <span className="opacity-40">·</span>
          <span className="opacity-70">
            © {new Date().getFullYear()} ANSUT — Tous droits réservés
          </span>
        </div>
      </div>
    </footer>
  );
}
