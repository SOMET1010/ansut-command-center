# J5 — Audit de découvrabilité

Protocole prêt à exécuter dès que le pool minimal est constitué. À faire sur **build figé** (gel développement actif jusqu'aux résultats J5). Objectif : **identifier les points de friction**, pas la représentativité statistique.

## Pool minimal — validé comité produit

Pas de blocage sur la constitution parfaite. Le J5 peut être lancé dès que sont réunis :

- **5 participants** réels ou assimilés
- **3 agents ANSUT** pouvant jouer le rôle Staff
- **2 utilisateurs métier** capables de jouer Org Admin

Sponsor & Super Admin : différés (parcours incomplets).

> **Recommandation** : utiliser un événement déjà connu de l'équipe (**SUTEL 2026** ou événement de test complet) pour que les scénarios soient réalistes — pas de données factices.

## Planning recommandé — demi-journée unique (semaine prochaine)

| Heure | Activité | Durée |
|---|---|---|
| 08h30 | Brief testeurs (objectifs, consigne « pas d'aide », consentement enregistrement) | 30 min |
| 09h00 | **Session Participant** (5 personnes, scénarios S1–S5) | 1h30 |
| 10h30 | **Session Staff** (3 personnes, scénarios S6–S7) | 45 min |
| 11h15 | **Session Org Admin** (2 personnes, scénarios S8–S10) | 45 min |
| 12h00 | Consolidation à chaud (observateurs) | 1h |
| 13h00 | Fin | — |

Mode parallèle accepté si plusieurs observateurs disponibles, sinon séquentiel comme ci-dessus.

## Setup

- Comptes pré-créés avec rôle attribué, événement réaliste (SUTEL ou équivalent)
- Build figé sur preview pendant toute la campagne — **aucune modification de l'app**
- Observateur silencieux, partage d'écran enregistré, **pas d'aide pendant la tâche**
- Outils : chronomètre, comptage clics manuel, log des hésitations

## Scénarios chronométrés

Mesurer pour chaque scénario : **temps · clics · taux de réussite · abandon · écran de blocage · compréhension vocabulaire**.

Question additionnelle obligatoire en fin de chaque scénario : *« Si vous deviez retrouver cette fonction demain, où iriez-vous spontanément ? »*

| # | Scénario | Rôle |
|---|---|---|
| **S0** | **Règle des 5 boutons** (Amendement 5) — *« Vous arrivez à SUTEL. Citez les 5 boutons dont vous avez besoin sur l'écran d'accueil. »* — papier avant ouverture de l'app. Comparer aux 5 entrées D8. | Participant |
| S1 | S'inscrire à un événement | Participant |
| S2 | Retrouver son agenda et bookmarker une session | Participant |
| S3 | Trouver un participant donné dans l'annuaire | Participant |
| S4 | Envoyer un message à ce participant | Participant |
| S5 | Répondre à un sondage en cours | Participant |
| S6 | Faire un check-in d'un participant arrivé | Staff |
| S7 | Marquer un participant manuellement présent | Staff |
| S8 | Publier une annonce | Org Admin |
| S9 | Valider 3 inscriptions en attente | Org Admin |
| S10 | Préparer un nouvel événement de A à Z | Org Admin |


## Grille de mesure

| Métrique | Cible | Seuil rouge |
|---|---|---|
| Clics tâche simple | ≤ 3 | > 6 |
| Temps tâche simple | ≤ 30 s | > 90 s |
| Taux de complétion sans aide | ≥ 80 % | < 60 % |
| Taux d'abandon S10 (préparer event) | < 20 % | > 40 % |
| Tâches « je ne sais pas où chercher » | 0 | ≥ 2 |

## Livrables obligatoires — `07-rapport-j5.md`

Le rapport doit **obligatoirement** contenir les 8 sections suivantes :

1. **Top 10 des blocages observés** (écran, tâche, nb de testeurs touchés)
2. **Top 10 des écrans où les utilisateurs hésitent** (durée d'hésitation > 5 s, regards perdus)
3. **Fonctions les plus difficiles à retrouver** (réponses à *« où iriez-vous demain ? »* divergentes)
4. **Terminologies incomprises** (libellés de menu, boutons, statuts mal interprétés)
5. **Temps moyen par scénario** (S1 à S10)
6. **Nombre moyen de clics par scénario** (S1 à S10)
7. **Carte thermique des parcours** (séquence d'écrans visités par testeur, points chauds = retours arrière)
8. **Recommandations classées** :
   - 🔴 **Critique** — bloque la complétion d'un parcours principal
   - 🟠 **Majeure** — dégrade fortement le temps ou les clics, mais le testeur finit
   - 🟡 **Mineure** — friction de confort, à traiter en finition

## Critères de passage en Phase 4

Le passage en Phase 4 est conditionné à **4 critères cumulatifs** :

| # | Critère | Seuil |
|---|---|---|
| C1 | Aucun blocage **critique** non résolu | 0 critique ouvert |
| C2 | Taux de scénarios réussis sans assistance | ≥ 80 % |
| C3 | Temps moyen acceptable sur les parcours principaux (S1, S6, S8) | ≤ seuils §Grille |
| C4 | Consensus des testeurs sur la compréhension de la navigation | majoritaire (≥ 7/10) |

**Si un seul de ces critères n'est pas atteint** → mise à jour obligatoire de `ARCHITECTURE-PRODUIT-V2.md` en **V2.1** avant tout démarrage Phase 4. Pas de refonte graphique tant que V2.1 n'est pas re-validée.

## Statut développement

**Le développement reste gelé jusqu'à obtention du rapport J5 et arbitrage Go/No-Go Phase 4.**

La date du J5 est désormais le seul jalon bloquant avant la réorganisation produit.
