# J4 — Cockpit orienté actions

Remplace `_authenticated/dashboard.tsx` (orienté données) par un **dashboard orienté tâches en attente**, décliné par rôle.

## Principe

> "Vous avez **N actions** en attente" — pas "vous avez 1247 inscriptions".

Chaque carte = une action déclenchable en 1 clic. Compteurs basés sur requêtes existantes, **aucune nouvelle table**.

## Maquette — Org Admin (`/org/cockpit`)

```text
┌─────────────────────────────────────────────────────────────┐
│  Bonjour {prénom} — Organisation : {org.name}              │
│  3 actions en attente                                       │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚠  12 inscriptions à valider                          │  │
│  │    Événement "SUTEL 2026"                  [ Valider ]│  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚐  1 sondage prêt à publier                           │  │
│  │    "Satisfaction J1"                       [ Publier ]│  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✎  2 annonces en brouillon                            │  │
│  │    Dernière modif : il y a 3h              [ Éditer  ]│  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Prochain événement                                         │
│  ▸ SUTEL 2026 — dans 14 jours — 247/300 inscrits           │
│    [ Programme ] [ Communication ] [ Participants ]         │
├─────────────────────────────────────────────────────────────┤
│  Activité récente (lecture seule, 5 dernières)              │
└─────────────────────────────────────────────────────────────┘
```

## Sources des compteurs (requêtes existantes)

| Carte | Requête | Action |
|---|---|---|
| Inscriptions à valider | `count(event_registrations) where status='pending' and event.organization_id = current_user_org()` | → `/org/participants?filter=pending` |
| Sondages à publier | `count(live_polls) where status='draft' and event.organization_id = current_user_org()` | → `/org/communication?tab=polls&filter=draft` |
| Annonces brouillon | `count(event_announcements) where status='draft' and event.organization_id = current_user_org()` | → `/org/communication?tab=announcements&filter=draft` |
| Sessions sans speaker | `count(event_sessions) where speaker_count=0` | → `/org/events/:id/sessions` |
| Événement J-7 sans com | `events where start_date < now+7d and announcement_count=0` | → wizard "Préparer la communication" |

Toutes ces requêtes utilisent les policies S4-B / S4-C / S4b-* déjà validées — aucune surface RLS nouvelle.

## Déclinaison par rôle

### Super Admin — `/admin/overview`
- **Plateforme** : N orgs actives, M événements en cours, K alertes sécurité non lues
- **Actions** : organisations en attente de validation, rôles à arbitrer (M4-D futur), findings sécurité critiques
- **Liens** : Organisations · Audit · Sécurité

### Staff — `/staff/checkin` (déjà task-oriented par nature)
- **Tâches du jour** : N participants attendus, M arrivés, prochaine session dans X min
- **Actions** : Scanner badge · Recherche manuelle · Marquer absent

### Sponsor — `/sponsor/stand` (placeholder Phase 4+)
- **Tâches** : N nouveaux leads · Messages non lus · Contenu à publier

### Participant — `/e/:slug` (déjà couvert J3, voir Accueil enrichi)
- **Tâches** : Prochaine session dans X min · N annonces non lues · N invitations RDV · Sondage en cours

## Anti-patterns à éviter

- ❌ Cartes "X total" sans action associée (= dashboard de données)
- ❌ Graphiques en premier écran (= analytics, pas opérationnel)
- ❌ Plus de 5 cartes "actions" simultanées (= bruit, perte de priorité)
- ❌ Compteurs sans seuil (afficher la carte uniquement si N > 0)

## Spec technique (pour Phase 4)

- Composant `<ActionCard icon, title, subtitle, ctaLabel, route, count, threshold>`
- Hook `useCockpitActions(role)` qui fan-out les requêtes en parallèle avec TanStack Query
- Cache 60s, invalidation manuelle sur retour de la page d'action
- Empty state si 0 action : "Tout est à jour ✓" + suggestions ("Préparer le prochain événement")
