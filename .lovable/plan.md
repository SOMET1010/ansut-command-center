# Sprint 0 — Product Workflow & Information Architecture

## Contexte

Diagnostic validé : le problème remonté par les testeurs ("on se perd") n'est ni un bug, ni une faille sécurité, ni une régression perf. C'est un **déficit de modèle mental** : 20+ briques fonctionnelles ont été empilées sans qu'aucun parcours rôle-par-rôle ne soit consolidé.

Décision : finir d'abord le verrou sécurité (S5 GRANTs, S7, S9), puis **geler les nouvelles fonctionnalités** et lancer un Sprint 0 Produit avant toute Phase 4 UX Premium.

## Pré-requis (avant Sprint 0)

Sécurité doit être close pour pouvoir réorganiser la navigation sans rouvrir de surface :
- **S5** — REVOKE GRANTs anon sur les 10+ tables identifiées
- **S7** — durcissement RPC publiques restantes
- **S9** — clôture matrice RLS

Aucune migration UX ne démarre avant validation S5/S7/S9.

## Livrables Sprint 0

### J1 — Cartographie des rôles (read-only audit)

Pour chaque rôle existant en base (`app_role`) :
- **Participant** — vue par défaut, ce qu'il voit, ce qu'il fait, ce qu'il ne doit jamais voir
- **Staff** — opérationnel terrain (check-in, support)
- **Org Admin** — gestion d'une organisation (scope `current_user_org()`)
- **Super Admin** — vue globale plateforme
- **Sponsor** — (à confirmer : rôle existe-t-il déjà ou à créer ?)

Format livrable : un tableau Markdown `role × écran × action autorisée × action interdite`, croisé avec les policies RLS validées en S4/S4-bis pour garantir cohérence UX ↔ sécurité.

### J2 — Cartographie des parcours

Un diagramme ASCII par rôle, du premier contact à la tâche finale. Exemple Participant :

```text
Lien magique → Inscription → Profil → Badge → Agenda
                                       ↓
                       Vote ← Networking ← Messages ← RDV
                                       ↓
                                   Documents
```

Pour chaque étape : écran actuel, gap identifié (fonctionnalité existe mais non découvrable / dispersée / dupliquée).

### J3 — Réorganisation de la navigation (proposition, non appliquée)

Nouvelle IA cible par rôle, mappée sur les routes existantes. Exemple :

| Rôle | Onglets cibles | Routes actuelles à regrouper |
|---|---|---|
| Participant | Accueil · Mon agenda · Réseau · Messages · Mon profil | `/e/:slug/accueil`, `/e/:slug/agenda`, … |
| Staff | Check-in · Participants · Annonces · Support | … |
| Org Admin | Dashboard · Événements · Participants · Programme · Communication · Exports | … |
| Super Admin | Organisations · Administration · Sécurité · Audit | … |

Livrable : tableau de mapping + liste des écrans à fusionner / déplacer / déprécier. **Aucune route renommée sans validation**.

### J4 — Cockpit orienté tâches (maquette papier)

Spec d'un nouveau dashboard "actions" remplaçant la vue "données" :

```text
┌─ 3 actions en attente ──────────────┐
│ • 12 inscriptions à valider [Voir]  │
│ • 1 sondage à publier      [Publier]│
│ • 2 annonces brouillon     [Éditer] │
└──────────────────────────────────────┘
```

Source des compteurs : requêtes existantes (pas de nouvelle table). Spec décrit : sélecteur SQL par carte, action button, route cible.

### J5 — Audit de découvrabilité

Protocole de test à faire passer à 3-5 testeurs sur build figé :
1. Comment publier une annonce ?
2. Comment créer un sondage ?
3. Comment exporter les participants ?
4. Comment préparer un événement ?

Métriques : clics, temps, abandons, chemin emprunté vs chemin optimal. Livrable : rapport + top 5 frictions à corriger en priorité.

## Ce que Sprint 0 NE fait PAS

- Aucune migration SQL
- Aucun renommage de route en production
- Aucune refonte visuelle (Phase 4 UX Premium reste après)
- Aucune nouvelle fonctionnalité
- Aucune modification de policies RLS (gelées après S5)

## Sortie attendue

À la fin du Sprint 0 :
- Décision GO/NO-GO sur la nouvelle IA
- Backlog priorisé "réorganisation" (vs "nouvelles features")
- Spec cockpit actions prête à implémenter
- Rapport découvrabilité chiffré

Phase 4 UX Premium démarre **après** validation de ces livrables, sur base IA stabilisée.

## Question à arbitrer avant de lancer

1. **Rôle Sponsor** — existe en base ou à créer dans le cadre du Sprint 0 ?
2. **Format livrables** — Markdown dans le repo (`/docs/sprint-0/`) ou document externe ?
3. **Testeurs J5** — pool disponible côté ANSUT ou à recruter ?
4. **Ordre** — confirmez-vous : finir S5 → S7 → S9, **puis** Sprint 0, **puis** Phase 4 ?
