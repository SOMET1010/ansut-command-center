# Project Memory

## Core
Phase 4.1 Lot 1 = navigation only. No analytics tracking, no new tables, no new APIs, no external integrations (PostHog/GA/etc.). Mesures J5 = observation manuelle uniquement.
Participant nav = 5 entrées max : Accueil, Programme, Participants, Salon, Mon Profil.
Sponsor = reporté Phase 5. MVP = Participant, Staff, Org Admin, Super Admin.
Avant toute nouvelle feature, valider J5 (≥80% scénarios réussis sans assistance).
Lots 3 (fusion Réseau) et 4 (fusion Session) GELÉS — attente retour terrain. Ne pas réouvrir sans signal utilisateur.
Header `/e/$slug` déborde <400 px : nit connue, à traiter SEULEMENT lors du prochain chantier navigation global, jamais dans un lot fonctionnel.

## Memories
- [Badge participant](mem://features/badge) — MyBadgeCard, source unique `me_registration`, multi-device via `?token=`, Wake Lock, offline-first
- [Accueil participant /e/$slug](mem://features/home-participant) — Phase 4 simplification : badge / prochaine action / programme / annonces / accès rapides. Branche non inscrit inchangée.
