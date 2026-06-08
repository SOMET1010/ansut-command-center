# J5 — Audit de découvrabilité

Protocole prêt à exécuter dès que le pool de testeurs est confirmé. À faire sur **build figé** (avant toute refonte Phase 4) pour mesurer le baseline.

## Pool cible

- 5 testeurs minimum : 2 Org Admin, 2 Participant, 1 Staff
- Sponsor & Super Admin : différés (parcours incomplets actuellement)
- Profils non techniques, n'ayant **jamais** utilisé l'app

## Protocole

### Setup
- Session 30 min par testeur, partage d'écran
- Build figé sur preview, comptes pré-créés avec rôle attribué
- Observateur silencieux, pas d'aide
- Outils : chronomètre, comptage clics manuel, enregistrement écran

### Tâches (par rôle)

#### Org Admin
| # | Tâche | Chemin optimal | Métriques |
|---|---|---|---|
| T1 | Publier une annonce sur l'événement X | Dashboard → Annonces → Nouvelle → Publier | clics, temps, erreurs |
| T2 | Créer un sondage "Satisfaction J1" | Dashboard → Polls → Nouveau | clics, temps, erreurs |
| T3 | Exporter la liste des participants en CSV | Dashboard → Exports → Sélection → Télécharger | clics, temps, erreurs |
| T4 | Préparer un nouvel événement de A à Z | Dashboard → Events → Nouveau → Sessions → Comm | clics, temps, abandons |
| T5 | Valider 3 inscriptions en attente | Dashboard → Participants → filtre pending | clics, temps |

#### Participant
| # | Tâche | Chemin optimal | Métriques |
|---|---|---|---|
| T1 | Trouver son badge QR | `/e/:slug` → Profil → Badge | clics, temps |
| T2 | Ajouter une session à son agenda | `/e/:slug` → Agenda → Bookmark | clics, temps |
| T3 | Envoyer un message à un autre participant | Networking → Annuaire → Contact → Message | clics, temps |
| T4 | Voter à un sondage en cours | Annonces → Poll | clics, temps |
| T5 | Prendre RDV avec un sponsor | Networking → RDV → Sélection créneau | clics, temps |

#### Staff
| # | Tâche | Chemin optimal | Métriques |
|---|---|---|---|
| T1 | Scanner le badge d'un participant arrivé | Checkin → Scan | clics, temps |
| T2 | Marquer manuellement un participant présent | Checkin → Recherche → Valider | clics, temps |
| T3 | Lire les annonces du jour | Annonces | clics, temps |

## Grille de mesure

| Métrique | Cible | Seuil rouge |
|---|---|---|
| Clics pour tâche simple (T1 chaque rôle) | ≤ 3 | > 6 |
| Temps tâche simple | ≤ 30s | > 90s |
| Taux de complétion sans aide | ≥ 80% | < 60% |
| Taux d'abandon sur T4 Org Admin (préparer event) | < 20% | > 40% |
| Tâches où testeur dit "je ne sais pas où chercher" | 0 | ≥ 2 |

## Livrable rapport (template)

```markdown
## Audit découvrabilité — {date}

### Pool
- N testeurs, profils, durée totale

### Résultats par tâche
| Rôle | Tâche | Clics moy | Temps moy | Complétion | Verbatims |
|---|---|---|---|---|---|

### Top 5 frictions
1. {friction} — {N testeurs touchés} — gravité {1-3}
2. ...

### Recommandations Phase 4 (priorisées)
- P1 : ...
- P2 : ...

### Verbatims marquants
> "..."
```

## Action immédiate

Le rapport J5 alimente directement [`06-backlog.md`](./06-backlog.md) en priorisant les frictions mesurées vs estimées.

**Tant que le protocole n'est pas exécuté, le backlog reste basé sur les gaps J2 (estimés, non mesurés).**
