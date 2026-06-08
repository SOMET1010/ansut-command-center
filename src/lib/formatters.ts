/**
 * Formateurs centralisés.
 *
 * M-26 — toutes les dates affichées côté UI passent par ces helpers, qui
 * forcent explicitement la timezone "Africa/Abidjan" (Côte d'Ivoire, GMT+0)
 * pour éviter les décalages selon le navigateur de l'utilisateur.
 *
 * M-27 — `displayOrDash` est la convention unique pour afficher une valeur
 * nullable / vide : on rend "—" (cadratin) dans les tables et fiches.
 *
 * M-29 — convention de tailles (à respecter dans les nouveaux écrans) :
 *   - inputs / selects / boutons standards : h-10
 *   - boutons d'action principaux (CTA terrain) : h-11
 *   - boutons compacts en barre d'outils : h-9
 *   - badges, mini-actions topbar : h-8
 *   - jamais h-12 (réservé aux hero / landing)
 */

export const EVENT_TIMEZONE = "Africa/Abidjan";
export const EVENT_LOCALE = "fr-FR";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: EVENT_TIMEZONE,
};

const DATE_TIME_FMT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: EVENT_TIMEZONE,
};

const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: EVENT_TIMEZONE,
};

function toDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date courte avec timezone explicite GMT (Abidjan). Ex: "21 sept. 2026 (GMT)" */
export function formatEventDate(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${d.toLocaleDateString(EVENT_LOCALE, DATE_FMT)} (GMT)`;
}

/** Date + heure avec timezone explicite. Ex: "21 sept. 2026, 09:00 (GMT)" */
export function formatEventDateTime(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${d.toLocaleString(EVENT_LOCALE, DATE_TIME_FMT)} (GMT)`;
}

/** Heure seule en timezone Abidjan. Ex: "09:00 GMT" */
export function formatEventTime(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${d.toLocaleTimeString(EVENT_LOCALE, TIME_FMT)} GMT`;
}

/**
 * Placeholder unique pour les valeurs nullable / vide / blanche.
 * Utiliser dans tables, fiches, et tout affichage utilisateur final.
 */
export function displayOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s.length === 0 ? "—" : s;
}
