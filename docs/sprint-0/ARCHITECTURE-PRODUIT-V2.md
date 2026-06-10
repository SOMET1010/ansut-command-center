# Architecture Produit V2 — Document de référence

**Statut** : **validée sous réserve des 5 amendements de validation comité (cf. §A).** Aucune ligne de code modifiée.
**Périmètre** : sortie Sprint 0. Pré-requis avant toute Phase 4 (UX Premium) et toute nouvelle fonctionnalité.
**Prochaine étape obligatoire** : **exécution J5 (audit découvrabilité)** avant toute maquette Phase 4. Les résultats J5 alimentent la version finale de ce document.


---

## A. Amendements de validation (intégrés)

Validés par le comité produit. **Non négociables avant Phase 4.**

### Amendement 1 — Raisonner par missions, plus par fonctionnalités

Le découpage fonctionnel (Agenda / Networking / Matchmaking / RDV / Polls / Annonces / Messages) **doit devenir invisible**. La navigation est organisée par **mission utilisateur du moment**, pas par module technique.

| Rôle | Navigation par missions (canonique) |
|---|---|
| **Participant** | Mon événement · Mon agenda · Mon réseau · Mes rendez-vous · Mes informations |
| **Staff** | Accueil opérationnel · Check-in · Participants · Support terrain · Statistiques |
| **Org Admin** | Pilotage · Participants · Programme · Communication · Analytics |
| **Super Admin** | Cockpit global · Organisations · Utilisateurs & rôles · Sécurité · Audit |
| **Sponsor** *(MVP différable)* | Mon stand · Mes leads · Mes messages · Mes statistiques |

> **Règle** : aucun libellé de menu ne porte le nom d'une table SQL ou d'une fonctionnalité technique. Tout libellé répond à *« ce que je viens faire »*, pas à *« quel module j'ouvre »*.

### Amendement 2 — Cockpit obligatoire après authentification

**Prérequis Phase 4.** Aucun utilisateur ne doit atterrir sur une liste, un menu ou un tableau de données.

| Rôle | Cockpit obligatoire |
|---|---|
| Participant | Cockpit Participant |
| Staff | Cockpit Staff |
| Org Admin | Cockpit Organisation |
| Super Admin | Cockpit Global |

**Le cockpit répond à une seule question : *« Que dois-je faire maintenant ? »***

Pas de KPI sans action. Pas de graphique en premier écran. Pas de menu déguisé en cockpit.

### Amendement 3 — Réduction forte du nombre d'entrées de navigation

| Aujourd'hui | Cible |
|---|---|
| 10 à 15 entrées | **4 à 6 entrées maximum** |
| Navigation fonctionnelle (par module) | Navigation métier (par mission) |
| Plusieurs écrans voisins | Écrans fusionnés |

Fusions validées :

- **Networking + Matchmaking + RDV → Réseau** (+ « Mes rendez-vous » comme mission distincte si volume utilisateur le justifie)
- **Polls + Annonces → Communication**
- **Agenda + Live + Attendance → Mon agenda**

### Amendement 4 — J5 obligatoire avant toute Phase 4

**Le risque principal n'est plus la sécurité ni le code. C'est la compréhension du produit par les utilisateurs.**

Aucune maquette Premium, aucun composant V2 ne sera produit tant que J5 n'aura pas été exécuté et que ses résultats n'auront pas été intégrés à la version finale de ce document.

Pool minimum : **5 participants + 3 staffs + 2 org_admin**.
Protocole détaillé et scénarios chronométrés : §11 et `docs/sprint-0/05-decouvrabilite.md`.

### Amendement 5 — Benchmark applications de salon (Whova / Eventee / Brella / Swapcard)

**Référentiel de comparaison inconscient des utilisateurs.** Les participants SUTEL ne comparent pas ANSUT Event à un ERP ou un outil interne — ils le comparent aux apps qu'ils utilisent en salon et conférence : **Whova, Eventee, Brella, Swapcard**.

Ces apps ne montrent **jamais** : Agenda · Polls · Networking · Matchmaking · RDV · Annonces. Elles montrent **toujours** : Accueil · Programme · Réseau · Salon · Profil.

**Règle des 5 boutons.** Avant toute refonte graphique, répondre à : *« Si je suis un participant qui vient d'arriver à SUTEL, quels sont les 5 boutons maximum dont j'ai besoin ? »* Si la réponse comporte plus de 5 entrées, l'architecture n'est pas prête.

#### Sitemap SUTEL — version « salon » (canonique, remplace §3)

| Rôle | 5 entrées maximum (vocabulaire utilisateur final) |
|---|---|
| **Participant** | **Accueil · Programme · Réseau · Salon · Mon Profil** |
| **Staff** | **Accueil · Check-in · Participants · Support · Statistiques** |
| **Org Admin** | **Cockpit · Participants · Programme · Communication · Paramètres** |
| **Super Admin** | **Cockpit Global · Événements · Organisations · Utilisateurs · Administration** |

Différences clés vs sitemap missions précédent (§3) :

- *« Mon événement »* → **Accueil** (vocabulaire app salon, pas vocabulaire technique).
- *« Mon agenda »* → **Programme** (le participant cherche *le* programme du salon, pas *son* agenda).
- *« Mon réseau » + « Mes rendez-vous »* → **Réseau** (une seule entrée, RDV en sous-page).
- *« Mes informations »* → **Mon Profil** (cohérent avec Whova/Swapcard).
- **Nouveau : Salon** = plan + exposants + sponsors + infos pratiques (absent de §3, indispensable événement physique).
- Org Admin : *Analytics* fusionné dans *Cockpit* — 5 entrées strictes.

Cette structure **prime sur §3** pour la Phase 4 SUTEL. §3 reste référence pour la généralisation multi-événements post-SUTEL.

---


---

## 0. Pourquoi ce document

Verbatim testeurs : *« la plateforme est bien, mais on se perd complètement »*.

Ce verbatim n'est **pas** un problème de sécurité (Phase S terminée — 0 ERROR, 5 risques résiduels acceptés) ni de design graphique. C'est un problème d'**architecture de l'information** :

- 5 rôles définis en base, 2 seulement ont une home dédiée.
- 13 entrées de navigation simultanées côté admin.
- 10 routes parallèles pour un même besoin métier côté participant.
- Aucun cockpit orienté action.

Un design premium appliqué à une navigation confuse n'améliore rien.

---

## 1. Principes directeurs (non négociables)

1. **Navigation par missions, pas par modules** (Amendement 1).
2. **Cockpit obligatoire post-login pour chaque rôle** (Amendement 2).
3. **5 entrées de navigation maximum par rôle** (Amendement 5 — durci, prime sur Amendement 3 qui parlait de 4-6).
4. **Une home par rôle.** Fin du `/dashboard` unique.
5. **Vocabulaire « app de salon »** (Whova/Eventee/Brella/Swapcard), pas vocabulaire interne (Amendement 5).
6. **Cockpit = « Que dois-je faire maintenant ? »** — pas un dashboard de données.
7. **Aucune nouvelle table, aucune nouvelle policy RLS.** Surfaces Phase S réutilisées.
8. **Redirections 301 obligatoires** sur tout renommage (QR badges, liens email déjà émis).
9. **J5 mesuré avant Phase 4** (Amendement 4). Pas de refonte fondée sur l'intuition.
10. **Règle des 5 boutons** validée avant toute maquette (Amendement 5).


---

## 2. Rôles & missions

| Rôle | Cockpit | Missions de navigation |
|---|---|---|
| **Participant** | Cockpit Participant | Mon événement · Mon agenda · Mon réseau · Mes rendez-vous · Mes informations |
| **Staff** | Cockpit Staff | Accueil opérationnel · Check-in · Participants · Support terrain · Statistiques |
| **Sponsor** *(MVP)* | Cockpit Sponsor | Mon stand · Mes leads · Mes messages · Mes statistiques |
| **Org Admin** | Cockpit Organisation | Pilotage · Participants · Programme · Communication · Analytics |
| **Super Admin** | Cockpit Global | Cockpit · Organisations · Utilisateurs & rôles · Sécurité · Audit |

Détail droits / interdits : `docs/sprint-0/01-roles.md`.

---

## 3. Sitemap cible — vocabulaire missions

> **Important** : la colonne « Mission » est la seule visible côté utilisateur. La colonne « Route cible » est interne. La colonne « Regroupe » liste les modules absorbés et **n'apparaît jamais dans l'UI**.

### 3.1 Participant — `/e/:slug/*`

| Mission | Route cible | Regroupe (invisible) |
|---|---|---|
| **Mon événement** *(cockpit)* | `/e/:slug` | accueil enrichi : prochaine action, badge, alertes |
| **Mon agenda** | `/e/:slug/agenda` | agenda + live + attendance |
| **Mon réseau** | `/e/:slug/reseau` | networking + matchmaking |
| **Mes rendez-vous** | `/e/:slug/rdv` | rdv + invitations + messagerie 1:1 entrante |
| **Mes informations** | `/e/:slug/moi` | profil + badge QR + documents + préférences |

Communication (annonces + sondages) accessible via **badge notification permanent en top bar**, pas comme entrée de menu. Bottom-tab mobile : 5 missions ci-dessus.

### 3.2 Staff — `/staff/*`

| Mission | Route cible |
|---|---|
| **Accueil opérationnel** *(cockpit)* | `/staff` |
| **Check-in** | `/staff/checkin` |
| **Participants** | `/staff/participants` |
| **Support terrain** | `/staff/support` |
| **Statistiques** | `/staff/stats` |

### 3.3 Sponsor — `/sponsor/*` *(MVP — décision produit attendue)*

Mon stand · Mes leads · Mes messages · Mes statistiques. Différable Phase 5.

### 3.4 Org Admin — `/org/*`

| Mission | Route cible | Regroupe (invisible) |
|---|---|---|
| **Pilotage** *(cockpit)* | `/org` | dashboard refondu actions |
| **Participants** | `/org/participants` | participants + inscriptions + validations |
| **Programme** | `/org/programme` | events + sessions + speakers |
| **Communication** | `/org/communication` | **annonces + sondages** |
| **Analytics** | `/org/analytics` | exports + statistiques |
| *(secondaire)* **Mon organisation** | `/org/settings` | édition fiche org |

### 3.5 Super Admin — `/admin/*`

Cockpit global · Organisations · Utilisateurs & rôles · Sécurité · Audit. Bandeau permanent « Mode plateforme » pour différencier visuellement du scope Org Admin.

---

## 4. Résolution post-login (`/me/role`) — Amendement 2

```text
session OK → fetch user_roles → COCKPIT (jamais une liste, jamais un menu)
  ├─ super_admin ──► /admin              (Cockpit Global)
  ├─ org_admin   ──► /org                (Cockpit Organisation)
  ├─ staff       ──► /staff              (Cockpit Staff — pas /checkin direct)
  ├─ sponsor     ──► /sponsor            (Cockpit Sponsor)
  └─ participant ──► /e/{prochain_event} (Cockpit Participant)
```

Fin du `/dashboard` unique. Fin de l'atterrissage sur une liste.

---

## 5. Cockpit orienté actions — spec commune

**Principe** : *« Vous avez N actions en attente »* — pas *« vous avez 1 247 inscriptions »*. Carte affichée uniquement si compteur > 0.

### Cockpit Organisation — exemple

```text
┌─────────────────────────────────────────────────────────┐
│ Bonjour {prénom} — {org.name}                          │
│ 3 actions en attente                                    │
├─────────────────────────────────────────────────────────┤
│ ⚠  12 inscriptions à valider — SUTEL 2026   [Valider]  │
│ ⚐  1 sondage prêt à publier                  [Publier] │
│ ✎  2 annonces en brouillon                  [Éditer]   │
├─────────────────────────────────────────────────────────┤
│ Prochain événement : SUTEL 2026 — J-14 — 247/300       │
│ [Programme] [Communication] [Participants]              │
└─────────────────────────────────────────────────────────┘
```

### Cockpit Participant — exemple

```text
┌─────────────────────────────────────────────────────────┐
│ Bonjour {prénom} — SUTEL 2026, jour 1                  │
├─────────────────────────────────────────────────────────┤
│ ⏰  Votre prochaine session dans 22 min                  │
│    "Souveraineté numérique" — salle Atlas    [Y aller] │
│ 💬 2 nouveaux messages                       [Lire]    │
│ 🤝 1 invitation RDV en attente               [Répondre]│
│ 📣 1 annonce non lue                         [Voir]    │
├─────────────────────────────────────────────────────────┤
│ [Mon badge QR]  [Mon agenda]  [Mon réseau]              │
└─────────────────────────────────────────────────────────┘
```

Anti-patterns bannis : cartes « X total » sans action · graphiques en premier écran · > 5 cartes simultanées · compteurs sans seuil · menu déguisé en cockpit.

Déclinaisons par rôle et requêtes sources : `docs/sprint-0/04-cockpit-actions.md`.

---

## 6. Pages supprimées / fusionnées / créées

### Supprimées en tant que routes autonomes

`matchmaking.$slug` · `rdv.$slug` (fusion partielle, voir §3.1) · `attendance.$sessionId` · `_authenticated/dashboard` (remplacé par cockpits par rôle).

### Fusions (vocabulaire missions)

| Mission cible | Modules absorbés (invisibles UI) |
|---|---|
| Mon réseau | networking + matchmaking |
| Mes rendez-vous | rdv + invitations |
| Mon agenda | agenda + live + attendance |
| Communication (Org Admin) | annonces + sondages |
| Programme (Org Admin) | events + sessions + speakers |
| Analytics (Org Admin) | exports + statistiques |

### Créées

`/org/settings`, `/staff/support`, `/staff/stats`, `/admin` (cockpit global), `/admin/organizations`, `/admin/users`, `/admin/audit`, `/sponsor/{stand,leads,messages,stats}`.

### Préfixées (déplacements de routes)

`_authenticated/checkin` → `/staff/checkin` · `_authenticated/events.*` → `/org/programme/*` · `_authenticated/participants` → `/org/participants` · `_authenticated/exports` → `/org/analytics` · `_authenticated/security-audit` → `/admin/security` · `_authenticated/admin.setup` → `/admin/bootstrap`.

Mapping technique exhaustif : `docs/sprint-0/03-navigation-cible.md`.

---

## 7. Règles de navigation

1. **Vocabulaire missions uniquement** dans les libellés visibles (Amendement 1).
2. **Une seule barre de navigation visible** par rôle. Elle change avec le rôle, jamais avec la page.
3. **Préfixe d'URL signale le rôle** (`/e/`, `/staff/`, `/sponsor/`, `/org/`, `/admin/`).
4. **Pas de menu « plus »** ni de tiroir caché côté Participant.
5. **Breadcrumb obligatoire** sur les pages admin de profondeur ≥ 2.
6. **Bandeau « Mode plateforme »** permanent sur Super Admin.
7. **Badge de notification unique** dans la top bar par rôle (somme annonces + messages + RDV + sondages).
8. **Redirections 301** conservées 6 mois minimum.

---

## 8. Bilan quantitatif attendu

| Métrique | Avant | Après V2 |
|---|:-:|:-:|
| Entrées nav simultanées max | 13 | **5** (Amendement 3) |
| Rôles avec home dédiée | 2 / 5 | **5 / 5** |
| Rôles avec cockpit obligatoire | 0 / 5 | **5 / 5** (Amendement 2) |
| Routes participant événement | 10 | 5 (par missions) |
| Libellés de menu portant un nom technique | ~8 | **0** (Amendement 1) |
| Fusions de routes | — | 6 |
| Cockpits actions livrés | 0 | 5 (Phase 4) |

---

## 9. Backlog d'exécution Phase 4

**Démarrage subordonné à l'exécution J5 et à l'intégration de ses résultats dans ce document.**

### P1 — Bloquant adoption

P1-1 Refonte `/me/role` → cockpit par rôle (Amendement 2) · P1-2 Cockpit Organisation actions · P1-3 Cockpit Participant · P1-4 Fusions « Réseau » + « Communication » + « Programme » · P1-5 Préfixage rôles + nav rôle-spécifique par missions · P1-6 Renommage libellés (Amendement 1).

### P2 — Combler rôles incomplets

`/org/settings` · `/admin/organizations` · `/admin/users` · `/admin/audit` · Cockpit Super Admin · `/staff/support` · `/staff/stats` · Wizard préparation événement · Centre notifications Participant.

### P3 — Confort & Sponsor

Module Sponsor MVP *(décision produit requise)* · Mes documents Participant · Empty states & onboarding · Dark mode + polish responsive.

Effort estimé : `docs/sprint-0/06-backlog.md`.

---

## 10. Métriques de succès — référentiel V2

| Indicateur | Baseline (J5) | Cible post-Phase 4 |
|---|---|---|
| Clics cockpit → action métier | à mesurer | ≤ 3 |
| Temps « publier une annonce » | à mesurer | ≤ 45 s |
| Temps « envoyer un message à un participant » | à mesurer | ≤ 30 s |
| Temps « faire un check-in » | à mesurer | ≤ 15 s |
| Taux complétion « préparer un événement » | à mesurer | ≥ 80 % |
| Verbatim « on se perd » | présent | absent |
| Hésitations utilisateur par tâche | à mesurer | ≤ 1 |
| Rôles avec cockpit | 0 / 5 | 5 / 5 |

---

## 11. Protocole J5 — à exécuter avant Phase 4 (Amendement 4)

**Mode** : test utilisateur chronométré sur build figé. Aucune modification de l'app pendant la campagne.

### Pool *(amendement 4)*

- **5 participants** (profils non techniques, jamais utilisé l'app)
- **3 staffs**
- **2 org_admin**
- Sponsor & Super Admin : différés (parcours incomplets)

### Setup

- Session 30 min par testeur, partage d'écran enregistré.
- Comptes pré-créés avec rôle attribué.
- Observateur silencieux, aucune aide pendant la tâche.
- Mesure manuelle : chronomètre + comptage clics + log des hésitations.

### Scénarios chronométrés *(amendement 4)*

| # | Scénario | Rôle(s) | Métriques |
|---|---|---|---|
| S1 | S'inscrire à un événement | Participant | temps, clics, blocages |
| S2 | Retrouver son agenda et bookmarker une session | Participant | temps, clics, blocages |
| S3 | Trouver un participant donné dans l'annuaire | Participant | temps, clics, hésitations |
| S4 | Envoyer un message à ce participant | Participant | temps, clics, hésitations |
| S5 | Répondre à un sondage en cours | Participant | temps, clics |
| S6 | Faire un check-in d'un participant arrivé | Staff | temps, clics |
| S7 | Marquer un participant manuellement présent | Staff | temps, clics |
| S8 | Publier une annonce | Org Admin | temps, clics, blocages |
| S9 | Valider 3 inscriptions en attente | Org Admin | temps, clics |
| S10 | Préparer un nouvel événement de A à Z | Org Admin | temps, clics, taux abandon |

### Grille de mesure

| Métrique | Cible | Seuil rouge |
|---|---|---|
| Temps tâche simple (S1, S2, S5, S6) | ≤ 30 s | > 90 s |
| Clics tâche simple | ≤ 3 | > 6 |
| Taux complétion sans aide | ≥ 80 % | < 60 % |
| Hésitations (« je ne sais pas où chercher ») | 0 | ≥ 2 |
| Taux abandon S10 (préparer event) | < 20 % | > 40 % |

### Livrable J5 — `07-rapport-j5.md` (8 sections obligatoires)

1. Top 10 des blocages observés
2. Top 10 des écrans où les utilisateurs hésitent
3. Fonctions les plus difficiles à retrouver (réponses *« où iriez-vous demain ? »*)
4. Terminologies incomprises
5. Temps moyen par scénario (S1–S10)
6. Nombre moyen de clics par scénario (S1–S10)
7. Carte thermique des parcours (séquences d'écrans, retours arrière)
8. Recommandations classées : 🔴 Critique · 🟠 Majeure · 🟡 Mineure

### Critères Go Phase 4 (cumulatifs)

| # | Critère | Seuil |
|---|---|---|
| C1 | Blocages critiques non résolus | 0 |
| C2 | Scénarios réussis sans assistance | ≥ 80 % |
| C3 | Temps moyen parcours principaux (S1, S6, S8) | ≤ seuils grille |
| C4 | Consensus testeurs sur compréhension nav | ≥ 7 / 10 |

Si un seul critère manque → **V2.1 obligatoire** avant Phase 4.

### Planning recommandé — demi-journée

08h30 brief · 09h00 Participant (×5) · 10h30 Staff (×3) · 11h15 Org Admin (×2) · 12h00 consolidation · 13h00 fin.

Protocole détaillé, pool minimal (5 P + 3 S + 2 OA), événement réaliste (SUTEL) : `docs/sprint-0/05-decouvrabilite.md`.

**Le développement reste gelé jusqu'à publication du rapport J5 et arbitrage Go/No-Go.**


---

## 12. Risques & points ouverts

| ID | Risque | Mitigation |
|---|---|---|
| R-UX1 | Renommage casse liens email / QR badges | Redirections 301 — obligatoire P1-5 |
| R-UX2 | Fusions désorientent utilisateurs habitués | Bandeau « Nouveauté » 30 jours |
| R-UX3 | Sponsor sans spec produit | Arbitrage MVP requis avant P3 |
| R-UX4 | Priorités fondées sur intuition | **Levé par J5 — Amendement 4** |
| R-UX5 | M4-D (rôles scopés par org) non livrée | `/admin/users` v1 super-admin only |
| R-UX6 | Vocabulaire missions non testé | À valider explicitement pendant J5 (poser la question « où iriez-vous pour X ? ») |

---

## 13. Séquence retenue

```text
Phase S (sécurité)                         ✅ terminée
        │
        ▼
Sprint 0 — Architecture Produit V2          ✅ validée (sous réserve 4 amendements intégrés)
        │
        ▼
J5 — Audit découvrabilité chronométré       ◄── PROCHAINE ÉTAPE
   pool : 5 participants + 3 staffs + 2 org_admin
   10 scénarios chronométrés
        │
        ▼
Architecture Produit V2.1                   intégration résultats J5
   re-priorisation P1/P2/P3 sur mesures réelles
        │
        ▼
Phase 4 — Refonte navigation & cockpits     P1 → P2 → P3
   cockpits obligatoires par rôle
   vocabulaire missions
   4-6 entrées max par rôle
        │
        ▼
Re-mesure (J5 bis) — validation cibles §10
        │
        ▼
Phase 4-bis — UX Premium ANSUT Event
        │
        ▼
Nouvelles fonctionnalités (Sponsor MVP, IA, etc.)
```

**Aucune maquette Premium ne sera produite tant que J5 n'a pas été exécuté et intégré.**

---

## 14. Décisions du comité — état

| # | Décision | Statut |
|---|---|---|
| D1 | Sitemap V2 par missions (Amendement 1) | ✅ validée |
| D2 | Cockpit obligatoire post-login (Amendement 2) | ✅ validée |
| D3 | 4-6 entrées de navigation max (Amendement 3) — **durci par D8 à 5 max** | ✅ validée |
| D4 | J5 préalable obligatoire à Phase 4 (Amendement 4) | ✅ validée |
| D5 | **Périmètre MVP Sponsor** — **reporté Phase 5.** MVP limité à Participant / Staff / Org Admin / Super Admin. | ✅ validée |
| D6 | **Calendrier J5** — pool minimal **5 P + 3 S + 2 OA** (réels ou assimilés ANSUT), **1 demi-journée**, événement réaliste **SUTEL**. Critères Go Phase 4 : 0 critique · ≥ 80 % réussite · temps ≤ seuils · consensus nav ≥ 7/10. | ✅ validée |
| D7 | **Durée redirections** — 301 permanentes **6 mois**, bannière discrète **2 premiers mois**, suppression **à 6 mois**. | ✅ validée |
| D8 | **Sitemap SUTEL « salon » (Amendement 5)** — référentiel Whova/Eventee/Brella/Swapcard. **5 entrées strictes par rôle**. Participant : Accueil · Programme · Réseau · Salon · Mon Profil. Staff : Accueil · Check-in · Participants · Support · Statistiques. Org Admin : Cockpit · Participants · Programme · Communication · Paramètres. Super Admin : Cockpit Global · Événements · Organisations · Utilisateurs · Administration. **Règle des 5 boutons** à valider en J5 (S0 dédié : *« Citez les 5 boutons dont vous avez besoin »*). | ✅ validée |

**Toutes les décisions comité sont prises. Aucun blocage résiduel avant J5.**



---

## Annexes

- `01-roles.md` — matrice rôles × domaines × droits (croisée RLS S4)
- `02-parcours.md` — parcours actuels + 5 frictions transverses
- `03-navigation-cible.md` — sitemap technique + mapping de routes
- `04-cockpit-actions.md` — spec cockpit + requêtes sources
- `05-decouvrabilite.md` — protocole J5 détaillé (à exécuter)
- `06-backlog.md` — backlog Phase 4 P1/P2/P3
- `07-rapport-j5.md` — *(à produire après campagne J5)*
