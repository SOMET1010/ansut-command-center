/**
 * Gestion unifiée du token participant (qr_token).
 *
 * Source unique : URL `?token=...` en priorité, puis localStorage `ansut:badge:{slug}`.
 * La clé legacy `ansut_participant_token` est supprimée au premier accès.
 *
 * Usage :
 *   import { getParticipantToken, clearParticipantToken } from "@/lib/token";
 *
 *   // Lecture (côté composant React)
 *   const token = getParticipantToken(slug);
 *
 *   // Écriture (après inscription)
 *   localStorage.setItem(`ansut:badge:${slug}`, token);
 *
 *   // Déconnexion
 *   clearParticipantToken(slug, token);
 */

const CANONICAL_PREFIX = "ansut:badge:";
const LEGACY_KEY = "ansut_participant_token";

/** Regex UUID v4 — valide les tokens QR ANSUT. */
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Récupère le token participant pour un événement donné.
 *
 * Ordre de priorité :
 * 1. URL `?token=...` — canonical, toujours préféré
 * 2. localStorage `ansut:badge:{slug}` — source canonique pour le navigateur
 *
 * Supprime la clé legacy `ansut_participant_token` au premier accès (migration).
 */
export function getParticipantToken(slug: string): string {
  if (typeof window === "undefined") return "";

  // 1. URL ?token=...
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken && TOKEN_RE.test(urlToken)) {
    // Migrer : stocker dans le canonique + supprimer legacy
    window.localStorage.setItem(`${CANONICAL_PREFIX}${slug}`, urlToken);
    window.localStorage.removeItem(LEGACY_KEY);
    return urlToken;
  }

  // 2. localStorage canonique
  const canonical = window.localStorage.getItem(`${CANONICAL_PREFIX}${slug}`);
  if (canonical && TOKEN_RE.test(canonical)) {
    // Nettoyer legacy au passage
    window.localStorage.removeItem(LEGACY_KEY);
    return canonical;
  }

  return "";
}

/**
 * Stocke le token dans le localStorage canonique.
 * Appelé après `register_for_event`.
 */
export function storeParticipantToken(slug: string, token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${CANONICAL_PREFIX}${slug}`, token);
  // Migration : supprimer la clé legacy si elle traîne
  window.localStorage.removeItem(LEGACY_KEY);
}

/**
 * Supprime le token participant du localStorage (déconnexion).
 * Appelé depuis le bouton "Me déconnecter" dans `me.$slug.tsx`.
 */
export function clearParticipantToken(slug: string, token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${CANONICAL_PREFIX}${slug}`);
  window.localStorage.removeItem(LEGACY_KEY);
  // Supprimer aussi le cache badge data
  window.localStorage.removeItem(`ansut:badge:data:${token}`);
}

/**
 * Valide qu'une chaîne est un token QR ANSUT (format UUID v4).
 */
export function isValidToken(token: string): boolean {
  return TOKEN_RE.test(token);
}