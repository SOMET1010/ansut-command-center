# J3 — Navigation & sitemap cible

**Statut** : proposition. **Aucune route n'est renommée pendant Sprint 0.** Le mapping ci-dessous est le plan d'exécution pour la Phase 4 "Workflow & IA".

## Principe directeur

> Une home **par rôle**, 4-6 entrées de nav maximum, regroupement par **intention métier** (pas par table SQL).

## Sitemap cible

### Participant — `/e/:slug/*`

| Onglet | Route cible | Regroupe (routes actuelles) |
|---|---|---|
| **Accueil** | `/e/:slug` | `e.$slug` (enrichi : prochaine session, badge, alertes) |
| **Mon agenda** | `/e/:slug/agenda` | `agenda.$slug`, `live.$sessionId`, `attendance.$sessionId` |
| **Réseau** | `/e/:slug/reseau` | `networking.$slug` + `matchmaking.$slug` (**fusion**) + `rdv.$slug` |
| **Messages** | `/e/:slug/messages` | `messages.$slug` |
| **Annonces** | `/e/:slug/annonces` | `annonces.$slug` + `poll.$pollId` (sous onglet "À voter") |
| **Mon profil** | `/e/:slug/profil` | profil + badge QR + documents (nouveau) |

Bottom-tab mobile à 5 entrées : Accueil · Agenda · Réseau · Messages · Profil.
Annonces accessible via badge notification dans top bar.

### Staff — `/staff/*` (nouveau préfixe)

| Onglet | Route cible | Source |
|---|---|---|
| **Check-in** | `/staff/checkin` | `_authenticated/checkin.tsx` (déplacé) |
| **Participants** | `/staff/participants` | `_authenticated/participants.tsx` (vue read-only) |
| **Annonces** | `/staff/annonces` | `_authenticated/announcements.tsx` (read-only) |
| **Support** | `/staff/support` | **nouveau** (placeholder spec en Phase 4) |

### Sponsor — `/sponsor/*` (nouveau)

| Onglet | Route cible | Statut |
|---|---|---|
| **Mon stand** | `/sponsor/stand` | **nouveau** — spec produit requise |
| **Mes leads** | `/sponsor/leads` | **nouveau** — opt-in only |
| **Messages** | `/sponsor/messages` | réutilise composant messagerie |
| **Statistiques** | `/sponsor/stats` | **nouveau** — vues stand, scans badge |

⚠ Décision produit requise : périmètre MVP Sponsor (peut être différé Phase 5 si arbitrage).

### Org Admin — `/org/*` (nouveau préfixe)

| Section | Route cible | Regroupe |
|---|---|---|
| **Cockpit** | `/org/cockpit` | `dashboard.tsx` refondu en cockpit actions (cf. J4) |
| **Événements** | `/org/events` | `events.tsx`, `events.new`, `events.$id.edit`, `events.$id.sessions`, `events.$id.registrations` |
| **Participants** | `/org/participants` | `participants.tsx` |
| **Communication** | `/org/communication` | `announcements.tsx` + `polls.tsx` (**fusion sous onglets**) |
| **Mon organisation** | `/org/settings` | **nouveau** (édition fiche org — policy S4b-C déjà OK) |
| **Exports** | `/org/exports` | `exports.tsx` |

Retire de la nav Org Admin : `checkin` (→ Staff), `security-audit`, `admin.setup` (→ Super Admin).

### Super Admin — `/admin/*` (nouveau préfixe)

| Section | Route cible | Statut |
|---|---|---|
| **Plateforme** | `/admin/overview` | **nouveau** — vue agrégée multi-org |
| **Organisations** | `/admin/organizations` | **nouveau** — CRUD |
| **Utilisateurs & rôles** | `/admin/users` | **nouveau** — gestion `user_roles` |
| **Sécurité** | `/admin/security` | `security-audit.tsx` |
| **Audit trail** | `/admin/audit` | **nouveau** — lecture table `audit_trail` |
| **Bootstrap** | `/admin/bootstrap` | `admin.setup.tsx` |

## Mapping routes actuelles → cibles

| Route actuelle | Action | Cible |
|---|---|---|
| `e.$slug.tsx` | Conserver | `/e/:slug` (enrichie) |
| `agenda.$slug.tsx` | Déplacer | `/e/:slug/agenda` |
| `annonces.$slug.tsx` | Déplacer | `/e/:slug/annonces` |
| `messages.$slug.tsx` | Déplacer | `/e/:slug/messages` |
| `networking.$slug.tsx` | **Fusionner** | `/e/:slug/reseau` |
| `matchmaking.$slug.tsx` | **Fusionner** | `/e/:slug/reseau` (onglet "Suggestions") |
| `rdv.$slug.tsx` | **Fusionner** | `/e/:slug/reseau` (onglet "Mes RDV") |
| `poll.$pollId.tsx` | Déplacer | `/e/:slug/annonces/poll/:id` |
| `live.$sessionId.tsx` | Déplacer | `/e/:slug/agenda/live/:id` |
| `attendance.$sessionId.tsx` | Déplacer | `/e/:slug/agenda/live/:id` (fusion) |
| `_authenticated/dashboard.tsx` | **Refondre** | `/org/cockpit` (J4) |
| `_authenticated/events.*` | Préfixer | `/org/events/*` |
| `_authenticated/participants.tsx` | Préfixer | `/org/participants` |
| `_authenticated/announcements.tsx` + `polls.tsx` | **Fusionner** | `/org/communication` |
| `_authenticated/checkin.tsx` | Déplacer | `/staff/checkin` |
| `_authenticated/exports.tsx` | Préfixer | `/org/exports` |
| `_authenticated/security-audit.tsx` | Préfixer | `/admin/security` |
| `_authenticated/admin.setup.tsx` | Préfixer | `/admin/bootstrap` |
| `me.role.tsx` | Refondre | redirige vers home **par rôle** (cf. ci-dessous) |

## Résolution post-login (`/me/role`)

```text
session OK
  │
  ▼
fetch user_roles
  │
  ├─ super_admin ──► /admin/overview
  ├─ org_admin   ──► /org/cockpit
  ├─ staff       ──► /staff/checkin
  ├─ sponsor     ──► /sponsor/stand
  └─ participant ──► /e/{prochain_event_inscrit}  ou  /events (liste publique)
```

## Bilan quantitatif

| Métrique | Avant | Après |
|---|---|---|
| Routes participant événement | 10 | 6 (dont 5 onglets) |
| Routes admin (toutes confondues) | 13 | 14 (mais segmentées par rôle) |
| Entrées nav simultanées max | 13 | 6 |
| Rôles avec home dédiée | 2/5 | 5/5 |
| Fusions | — | 3 (réseau, communication, agenda+live+attendance) |
| Créations | — | 8 (sponsor×4, admin×4) |
