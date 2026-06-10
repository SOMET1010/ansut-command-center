# J5 — Audit de découvrabilité

Protocole prêt à exécuter dès que le pool de testeurs est confirmé. À faire sur **build figé** (avant toute refonte Phase 4) pour mesurer le baseline.

## Pool cible — amendé comité produit

- **5 participants + 3 staffs + 2 org_admin** (10 testeurs)
- Sponsor & Super Admin : différés (parcours incomplets actuellement)
- Profils non techniques, n'ayant **jamais** utilisé l'app


## Protocole

### Setup
- Session 30 min par testeur, partage d'écran
- Build figé sur preview, comptes pré-créés avec rôle attribué
- Observateur silencieux, pas d'aide
- Outils : chronomètre, comptage clics manuel, enregistrement écran

### Scénarios chronométrés — amendés comité produit

Mesurer pour chaque scénario : **temps d'exécution · nombre de clics · taux de réussite · abandon · écran de blocage · compréhension vocabulaire**. Question additionnelle obligatoire en fin de chaque scénario : *« Si vous deviez retrouver cette fonction demain, où iriez-vous spontanément ? »* (révèle immédiatement les erreurs d'architecture / vocabulaire missions).

| # | Scénario | Rôle |
|---|---|---|
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
