# Backlog refonte UX — Phase 4 "Workflow & Information Architecture"

Backlog issu de J1-J4 (gaps **estimés**). À re-prioriser après exécution J5 (gaps **mesurés**).

Périmètre : démarre **après** clôture S5 + S7 + S9.

## P1 — Bloquant adoption (à livrer en premier)

| ID | Item | Effort | Gap couvert |
|---|---|---|---|
| P1-1 | Refonte `/me/role` : redirection par rôle vers home dédiée | S | F1, G-S1 |
| P1-2 | Cockpit Org Admin orienté actions (J4) | M | F4, G-O1 |
| P1-3 | Home Participant `/e/:slug` enrichie : prochaine session + badge 1-clic + notifs | M | F5, G-P1, G-P2 |
| P1-4 | Fusion `networking` + `matchmaking` + `rdv` sous `/e/:slug/reseau` (3 onglets) | M | G-P3 |
| P1-5 | Fusion `announcements` + `polls` sous `/org/communication` | S | G-O2 |
| P1-6 | Préfixage `/staff/*`, `/org/*`, `/admin/*` + nav rôle-spécifique | M | F2, G-S3, G-SA4 |

## P2 — Combler les rôles incomplets

| ID | Item | Effort | Gap couvert |
|---|---|---|---|
| P2-1 | Page `/org/settings` (édition fiche organisation) | S | G-O5 |
| P2-2 | Vue `/admin/organizations` (CRUD orgs Super Admin) | M | G-SA1 |
| P2-3 | Vue `/admin/users` (gestion `user_roles` via UI) | M | G-SA3 |
| P2-4 | Vue `/admin/audit` (lecture `audit_trail`) | S | G-SA2 |
| P2-5 | Cockpit Super Admin `/admin/overview` (déclinaison J4) | M | G-SA4 |
| P2-6 | Vue `/staff/support` (placeholder + ticketing minimal) | M | G-S2 |
| P2-7 | Wizard "Préparer un événement" guidé (event → sessions → comm) | L | G-O3 |
| P2-8 | Centre notifications unifié Participant | M | G-P5 |

## P3 — Confort & Sponsor

| ID | Item | Effort | Gap couvert |
|---|---|---|---|
| P3-1 | Module Sponsor MVP (`/sponsor/stand` + `/sponsor/leads`) — **décision produit requise** | L | G-Sp1, G-Sp2 |
| P3-2 | Vue "Mes documents" Participant | S | G-P4 |
| P3-3 | Statistiques sponsor | M | — |
| P3-4 | Empty states & onboarding contextuel par rôle | M | — |
| P3-5 | Dark mode complet, polish responsive | M | — |

## Pré-requis avant Phase 4

- ✅ S5 — REVOKE GRANTs anon **closed**
- ✅ S7 — RPC publiques durcies **closed**
- ✅ S9 — matrice RLS **closed**
- ⏳ Rapport J5 (audit découvrabilité) **exécuté** → reprioriser P1

## Métriques de succès Phase 4

| Métrique | Baseline (J5 à mesurer) | Cible post-Phase 4 |
|---|---|---|
| Clics tâche T1 Org Admin | TBD | ≤ 3 |
| Temps "publier une annonce" | TBD | ≤ 45s |
| Taux complétion "préparer event" | TBD | ≥ 80% |
| Verbatims "on se perd" | présent | absent |
| Rôles avec home dédiée | 2/5 | 5/5 |

## Risques

- **R-UX1** : Renommage de routes casse les liens email/calendrier déjà envoyés → prévoir redirections 301 côté router (`createFileRoute` legacy → cible).
- **R-UX2** : Fusion `networking`+`matchmaking`+`rdv` peut désorienter les utilisateurs habitués → période de bandeau "Nouveauté".
- **R-UX3** : Module Sponsor demande spec produit non livrée → P3-1 peut glisser Phase 5.
- **R-UX4** : Tests utilisateurs J5 jamais réalisés → priorités P1 fondées sur intuition, pas sur mesure.
