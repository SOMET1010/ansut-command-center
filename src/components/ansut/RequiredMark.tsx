/**
 * Astérisque rouge pour signaler un champ requis (M-14).
 * Inclut un texte sr-only pour les lecteurs d'écran.
 */
export function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" aria-hidden="true">
      *
      <span className="sr-only">(obligatoire)</span>
    </span>
  );
}
