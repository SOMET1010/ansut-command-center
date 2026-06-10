# Memory: index.md

# Project Memory

## Core
Phase 4.1 Lot 1 = navigation only. No analytics tracking, no new tables, no new APIs, no external integrations (PostHog/GA/etc.). Mesures J5 = observation manuelle uniquement.
Participant nav = 5 entrées max : Accueil, Programme, Participants, Salon, Mon Profil.
Sponsor = reporté Phase 5. MVP = Participant, Staff, Org Admin, Super Admin.
Avant toute nouvelle feature, valider J5 (≥80% scénarios réussis sans assistance).
Badge participant : source unique = RPC `me_registration` ; persistance `localStorage["ansut:badge:{slug}"]` ; récupération multi-device via `?token=` URL.

## Memories
- [Badge participant](mem://features/badge) — Rendu Accueil, persistance qr_token, statuts, multi-device, offline
