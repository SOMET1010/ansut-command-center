# Architecture Produit V2 — Document de référence

**Statut** : proposition à valider. **Aucune ligne de code ne sera modifiée tant que ce document n'est pas explicitement validé.**
**Périmètre** : sortie Sprint 0 — réorganisation produit. Pré-requis avant toute Phase 4 (UX Premium) et toute nouvelle fonctionnalité.
**Méthode** : consolidation des travaux J1 à J6 (`docs/sprint-0/01..06`) en un document unique pour validation comité produit.

---

## 0. Pourquoi ce document

Les testeurs disent : *« la plateforme est bien, mais on se perd complètement »*.
Ce verbatim n'est **pas** un problème de sécurité (Phase S terminée — 0 ERROR linter, 5 risques résiduels acceptés) ni un problème de design graphique. C'est un problème d'**architecture de l'information** :

- 5 rôles définis en base, 2 seulement ont une home dédiée.
- 13 entrées de navigation simultanées maximum côté admin.
- 10 routes parallèles pour un même besoin métier côté participant.
- Aucun cockpit orienté « que dois-je faire maintenant ? ».

Tant que ce socle n'est pas redressé, un design premium amplifiera la confusion au lieu de la résoudre.

---

## 1. Principes directeurs (non négociables)

1. **Une home par rôle.** Cinq rôles ⇒ cinq points d'atterrissage différents après login. Fin du `/dashboard` unique.
2. **4 à 6 entrées de navigation maximum** par rôle. Au-delà, on regroupe ou on déplace dans un sous-onglet.
3. **Regrouper par intention métier, pas par table SQL.** « Réseau » remplace networking+matchmaking+RDV ; « Communication » remplace annonces+sondages.
4. **Cockpit orienté actions.** Première vue = « N actions en attente », pas « 1 247 inscriptions ».
5. **Aucune nouvelle table, aucune nouvelle policy RLS.** Tout réutilise les surfaces validées en Phase S.
6. **Redirections obligatoires.** Tout renommage de route est doublé d'une redirection 301 (liens email / QR badges déjà émis).

---

## 2. Rôles & périmètres (synthèse)

| Rôle | Première vue | Tâche principale | Statut UI actuel |
|---|---|---|---|
| **Participant** | `/e/:slug` (accueil événement enrichi) | Vivre l'événement | ✅ partiel (10 routes dispersées) |
| **Staff** | `/staff/checkin` | Accueil terrain, scan badges | ❌ tombe sur `/dashboard` admin |
| **Sponsor** | `/sponsor/stand` | Récupérer leads opt-in | ❌ aucune route |
| **Org Admin** | `/org/cockpit` | Piloter ses événements | ⚠ dashboard données, pas actions |
| **Super Admin** | `/admin/overview` | Gouvernance multi-org, sécurité | ⚠ vue identique à Org Admin |

Détail complet par domaine (voit / fait / interdit) : `docs/sprint-0/01-roles.md`.

---

## 3. Sitemap cible

### 3.1 Participant — `/e/:slug/*`

| Onglet | Route cible | Regroupe |
|---|---|---|
| **Accueil** | `/e/:slug` | enrichie : prochaine session, badge, alertes, notifs |
| **Mon agenda** | `/e/:slug/agenda` | `agenda` + `live` + `attendance` |
| **Réseau** | `/e/:slug/reseau` | **fusion** `networking` + `matchmaking` + `rdv` (3 onglets internes) |
| **Messages** | `/e/:slug/messages` | `messages` |
| **Annonces** | `/e/:slug/annonces` | `annonces` + `poll` (sous-onglet « À voter ») |
| **Mon profil** | `/e/:slug/profil` | profil + badge QR + documents (nouveau) |

Bottom-tab mobile : Accueil · Agenda · Réseau · Messages · Profil (5 entrées). Annonces accessible via badge de notification top bar.

### 3.2 Staff — `/staff/*`

Check-in (home) · Participants (lecture) · Annonces (lecture) · Support (nouveau, placeholder).

### 3.3 Sponsor — `/sponsor/*` *(décision produit requise)*

Mon stand · Mes leads · Messages · Statistiques. Peut être différé Phase 5 si arbitrage MVP.

### 3.4 Org Admin — `/org/*`

| Section | Cible | Regroupe |
|---|---|---|
| **Cockpit** | `/org/cockpit` | `dashboard` refondu en actions (cf. §5) |
| **Événements** | `/org/events` | `events`, `events.new`, `events.$id.{edit,sessions,registrations}` |
| **Participants** | `/org/participants` | `participants` |
| **Communication** | `/org/communication` | **fusion** `announcements` + `polls` |
| **Mon organisation** | `/org/settings` | nouveau (policy S4b-C déjà OK) |
| **Exports** | `/org/exports` | `exports` |

Retiré de la nav Org Admin : `checkin` (→ Staff), `security-audit`, `admin.setup` (→ Super Admin).

### 3.5 Super Admin — `/admin/*`

Plateforme · Organisations · Utilisateurs & rôles · Sécurité · Audit trail · Bootstrap.

---

## 4. Résolution post-login (`/me/role`)

```text
session OK → fetch user_roles
  ├─ super_admin ──► /admin/overview
  ├─ org_admin   ──► /org/cockpit
  ├─ staff       ──► /staff/checkin
  ├─ sponsor     ──► /sponsor/stand
  └─ participant ──► /e/{prochain_event_inscrit}  ou  /events
```

Fin du « tout le monde sur `/dashboard` ».

---

## 5. Cockpit orienté actions

**Principe** : *« Vous avez N actions en attente »* — pas *« vous avez 1 247 inscriptions »*.
Chaque carte = une action déclenchable en 1 clic. Compteurs basés sur requêtes existantes (RLS S4 déjà validée). Carte affichée uniquement si compteur > 0.

### Org Admin — exemple

```text
┌─────────────────────────────────────────────────────────┐
│ Bonjour {prénom} — Organisation : {org.name}            │
│ 3 actions en attente                                    │
├─────────────────────────────────────────────────────────┤
│ ⚠  12 inscriptions à valider — SUTEL 2026   [Valider]  │
│ ⚐  1 sondage prêt à publier — "Satisfaction" [Publier] │
│ ✎  2 annonces en brouillon                  [Éditer]   │
├─────────────────────────────────────────────────────────┤
│ Prochain événement : SUTEL 2026 — J-14 — 247/300       │
│ [Programme] [Communication] [Participants]              │
└─────────────────────────────────────────────────────────┘
```

Anti-patterns explicitement bannis : cartes « X total » sans action, graphiques en premier écran, > 5 cartes simultanées, compteurs sans seuil.

Déclinaisons par rôle et requêtes sources : `docs/sprint-0/04-cockpit-actions.md`.

---

## 6. Pages supprimées / fusionnées / créées

### Supprimées (en tant que routes autonomes)

- `matchmaking.$slug` → absorbée par `/e/:slug/reseau`
- `rdv.$slug` → absorbée par `/e/:slug/reseau`
- `attendance.$sessionId` → absorbée par `/e/:slug/agenda/live/:id`
- `_authenticated/dashboard` → remplacée par `/org/cockpit` (rôle Org Admin) et `/admin/overview` (rôle Super Admin)

### Fusionnées

| Cible | Sources |
|---|---|
| `/e/:slug/reseau` | `networking` + `matchmaking` + `rdv` |
| `/e/:slug/agenda` | `agenda` + `live` + `attendance` |
| `/e/:slug/annonces` | `annonces` + `poll` |
| `/org/communication` | `announcements` + `polls` |

### Créées

`/org/settings`, `/staff/support`, `/admin/overview`, `/admin/organizations`, `/admin/users`, `/admin/audit`, `/sponsor/{stand,leads,messages,stats}`.

### Préfixées (déplacements simples)

`_authenticated/checkin` → `/staff/checkin`
`_authenticated/events.*` → `/org/events/*`
`_authenticated/participants` → `/org/participants`
`_authenticated/exports` → `/org/exports`
`_authenticated/security-audit` → `/admin/security`
`_authenticated/admin.setup` → `/admin/bootstrap`

Mapping exhaustif : `docs/sprint-0/03-navigation-cible.md` §« Mapping routes actuelles → cibles ».

---

## 7. Règles de navigation

1. **Une seule barre de navigation visible à la fois.** Elle change selon le rôle, jamais selon la page.
2. **Le préfixe d'URL signale le rôle** (`/e/`, `/staff/`, `/sponsor/`, `/org/`, `/admin/`). Pas d'ambiguïté possible.
3. **Pas de menu « plus »** ou de tiroir caché côté Participant. Si une fonctionnalité n'a pas sa place dans les 5 onglets, elle est repensée ou supprimée.
4. **Breadcrumb obligatoire** sur toutes les pages admin de profondeur ≥ 2 (`/org/events/:id/sessions`).
5. **Retour visuel de scope** sur Super Admin : bandeau « Mode plateforme » permanent (sinon confusion Org Admin / Super Admin).
6. **Badge de notification unique** dans la top bar par rôle (additionne annonces non lues, messages non lus, invitations RDV, sondages actifs). Plus de notifications dispersées.
7. **Liens entrants legacy** : redirections 301 conservées 6 mois minimum (QR badges, liens email).

---

## 8. Bilan quantitatif attendu

| Métrique | Avant | Après V2 |
|---|:-:|:-:|
| Routes participant événement | 10 | 6 (dont 5 onglets) |
| Entrées nav simultanées max | 13 | 6 |
| Rôles avec home dédiée | 2 / 5 | 5 / 5 |
| Fusions de routes | — | 4 |
| Routes créées | — | 8 (Sponsor ×4 + Admin ×4) |
| Dashboards orientés actions | 0 | 2 (`/org/cockpit`, `/admin/overview`) |

---

## 9. Backlog d'exécution (Phase 4)

### P1 — Bloquant adoption

P1-1 Refonte `/me/role` (redirection par rôle) · P1-2 Cockpit Org Admin actions · P1-3 Home Participant enrichie · P1-4 Fusion Réseau · P1-5 Fusion Communication · P1-6 Préfixage rôles + nav rôle-spécifique.

### P2 — Combler les rôles incomplets

P2-1 `/org/settings` · P2-2 `/admin/organizations` · P2-3 `/admin/users` · P2-4 `/admin/audit` · P2-5 Cockpit Super Admin · P2-6 `/staff/support` · P2-7 Wizard préparation événement · P2-8 Centre notifications Participant.

### P3 — Confort & Sponsor

P3-1 Module Sponsor MVP (décision produit requise) · P3-2 Mes documents Participant · P3-3 Stats sponsor · P3-4 Empty states & onboarding · P3-5 Dark mode + polish responsive.

Effort estimé et gaps couverts : `docs/sprint-0/06-backlog.md`.

---

## 10. Métriques de validation produit

| Indicateur | Baseline (à mesurer J5) | Cible post-Phase 4 |
|---|---|---|
| Clics pour tâche T1 Org Admin (valider une inscription) | à mesurer | ≤ 3 |
| Temps « publier une annonce » | à mesurer | ≤ 45 s |
| Taux complétion « préparer un événement » | à mesurer | ≥ 80 % |
| Verbatim « on se perd » dans tests utilisateurs | présent | absent |
| Rôles avec home dédiée | 2 / 5 | 5 / 5 |

Protocole de mesure : `docs/sprint-0/05-decouvrabilite.md` (audit sur build figé, à exécuter avant toute refonte).

---

## 11. Risques & points ouverts

| ID | Risque | Mitigation |
|---|---|---|
| R-UX1 | Renommage casse liens email / QR badges | Redirections 301 (router) — obligatoire P1-6 |
| R-UX2 | Fusion Réseau désoriente utilisateurs habitués | Bandeau « Nouveauté » 30 jours |
| R-UX3 | Sponsor sans spec produit | Arbitrage MVP requis avant P3-1 |
| R-UX4 | Priorités fondées sur intuition, pas mesure | Exécuter J5 (audit découvrabilité) avant P1 |
| R-UX5 | M4-D (rôles scopés par org) non livrée | `/admin/users` v1 reste global super-admin only |

---

## 12. Décisions attendues du comité produit

1. **Validation du sitemap V2** (§3) — go / no-go intégral.
2. **Périmètre MVP Sponsor** (§3.3) — livré Phase 4 ou différé Phase 5 ?
3. **Validation des fusions** (§6) — accord sur Réseau, Communication, Agenda+Live, Annonces+Polls ?
4. **Calendrier J5** (audit découvrabilité) — pool de testeurs et date d'exécution.
5. **Politique de redirection** — durée de maintien des redirections 301 (proposition : 6 mois).

---

## 13. Séquence retenue

```text
Phase S (sécurité)         ✅ terminée — 5 risques résiduels acceptés
        │
        ▼
Sprint 0 — Architecture Produit V2  ◄── CE DOCUMENT (à valider)
        │
        ▼
Audit découvrabilité J5 sur build figé (baseline mesurée)
        │
        ▼
Phase 4 — Refonte UX & navigation (P1 → P2 → P3)
        │
        ▼
Validation utilisateurs (re-mesure des métriques §10)
        │
        ▼
Phase 4-bis — UX Premium (design système avancé, micro-interactions)
        │
        ▼
Nouvelles fonctionnalités (Sponsor MVP, IA, etc.)
```

**Aucune refonte graphique ne sera lancée tant que la navigation cible n'aura pas été validée par les utilisateurs sur la base de cette V2.**

---

## Annexes

- `01-roles.md` — matrice rôles × domaines × droits (croisée RLS S4)
- `02-parcours.md` — parcours actuels + 5 frictions transverses
- `03-navigation-cible.md` — sitemap cible détaillé + mapping de routes
- `04-cockpit-actions.md` — spec cockpit + requêtes sources
- `05-decouvrabilite.md` — protocole audit testeurs J5
- `06-backlog.md` — backlog Phase 4 (P1/P2/P3) avec effort estimé
