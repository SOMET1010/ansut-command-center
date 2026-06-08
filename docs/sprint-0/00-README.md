# Sprint 0 — Product Workflow & Information Architecture

**Mode** : audit / spécification uniquement. Aucune modification de code, de route, de policy RLS ou de migration SQL pendant ce sprint.

**Exécution** : en parallèle de la piste sécurité (S5 → S7 → S9). Les deux chantiers sont indépendants. À la clôture de S9, la Phase 4 "Workflow & IA" enchaîne directement avec une vision validée.

## Livrables

| # | Fichier | Contenu |
|---|---|---|
| J1 | [`01-roles.md`](./01-roles.md) | Cartographie des 5 rôles : ce qu'ils voient, font, ne doivent jamais voir |
| J2 | [`02-parcours.md`](./02-parcours.md) | Parcours utilisateur par rôle (diagrammes ASCII) + gaps identifiés |
| J3 | [`03-navigation-cible.md`](./03-navigation-cible.md) | Sitemap & navigation cible, mapping vers routes existantes |
| J4 | [`04-cockpit-actions.md`](./04-cockpit-actions.md) | Spec dashboard orienté actions (remplace vue données) |
| J5 | [`05-decouvrabilite.md`](./05-decouvrabilite.md) | Protocole d'audit testeurs + grille de mesure |
| — | [`06-backlog.md`](./06-backlog.md) | Backlog refonte UX classé P1/P2/P3 |

## Hors-périmètre Sprint 0

- Aucune migration SQL
- Aucun renommage de route
- Aucune refonte visuelle (Phase 4 UX Premium reste **après**)
- Aucune nouvelle fonctionnalité
- Aucune modification RLS (gel après S5/S7/S9)

## Périmètre cartographié

**Routes publiques** : `index`, `login`, `signup`, `forgot-password`, `reset-password`, `forbidden`, `mentions-legales`, `politique-confidentialite`, `me.role`.

**Routes événement participant** : `e.$slug`, `agenda.$slug`, `annonces.$slug`, `messages.$slug`, `networking.$slug`, `matchmaking.$slug`, `poll.$pollId`, `rdv.$slug`, `live.$sessionId`, `attendance.$sessionId`.

**Routes authentifiées admin** (`_authenticated/*`) : `dashboard`, `events`, `events.new`, `events.$id.edit`, `events.$id.registrations`, `events.$id.sessions`, `participants`, `announcements`, `polls`, `checkin`, `exports`, `security-audit`, `admin.setup`.

**Total** : ~32 routes, 5 rôles, 21 tables métier.
