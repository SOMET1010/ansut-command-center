# J5 — Grille d'observation utilisateur

> Document à imprimer (une page par testeur). Observation manuelle, sans analytics.
> Événement de test : **SUTEL 2026** (seed `supabase/seeds/sutel-demo.sql`).

---

## Identification

| | |
|---|---|
| Date | __________________ |
| Observateur | __________________ |
| Testeur (prénom + rôle joué) | __________________ |
| Rôle simulé | ☐ Participant ☐ Staff ☐ Org Admin |
| Première fois sur l'app | ☐ Oui ☐ Non |
| Appareil | ☐ Mobile ☐ Tablette ☐ Desktop |
| Heure de début | _____ : _____ |

**Consigne lue au testeur :**
> « Je vais vous demander de réaliser quelques tâches. Vous arrivez à SUTEL 2026 dans 15 minutes. Pensez à voix haute. Je ne vous aiderai pas pendant la tâche. Si vous bloquez, dites-le simplement et nous passerons à la suivante. »

---

## A. Pré-test papier — règle des 5 boutons (Amendement 5)

**Avant d'ouvrir l'application**, demander au testeur :

> « Vous arrivez à SUTEL. Citez les 5 boutons dont vous auriez besoin sur l'écran d'accueil de l'app. »

| # | Bouton cité spontanément | Présent dans la nav (Accueil · Programme · Participants · Salon · Mon Profil) ? |
|---|---|---|
| 1 | ____________________ | ☐ Oui ☐ Non |
| 2 | ____________________ | ☐ Oui ☐ Non |
| 3 | ____________________ | ☐ Oui ☐ Non |
| 4 | ____________________ | ☐ Oui ☐ Non |
| 5 | ____________________ | ☐ Oui ☐ Non |

**Mots utilisés pour "Participants" :** ___________________________________
**Mots utilisés pour "Salon" :** ___________________________________

---

## B. Scénario critique « arrivée à SUTEL dans 15 minutes »

Énoncé lu au testeur :
> « Vous arrivez à SUTEL dans 15 minutes. Trouvez : (1) votre prochaine conférence, (2) une personne à rencontrer, (3) le plan du salon, (4) un message reçu, (5) votre badge. »

| # | Sous-tâche | Trouvé sans aide | Trouvé avec aide | Introuvable / abandon | Temps (s) | Nb clics | Onglet où l'utilisateur est allé en premier |
|---|---|:---:|:---:|:---:|---:|---:|---|
| 1 | Prochaine conférence | ☐ | ☐ | ☐ | _____ | _____ | __________________ |
| 2 | Personne à rencontrer | ☐ | ☐ | ☐ | _____ | _____ | __________________ |
| 3 | Plan du salon | ☐ | ☐ | ☐ | _____ | _____ | __________________ |
| 4 | Message reçu | ☐ | ☐ | ☐ | _____ | _____ | __________________ |
| 5 | Badge | ☐ | ☐ | ☐ | _____ | _____ | __________________ |

**Temps total scénario critique : _____ min _____ s**

> **Critère d'échec navigation** : si 2 sous-tâches sur 5 sont introuvables, la navigation Lot 1 n'est pas validée.

---

## C. Tableau de découverte par fonction

Pour chaque fonction, demander : *« Trouvez la fonction X. »* puis noter.

| Fonction | Trouvée sans aide | Trouvée avec aide | Introuvable | Onglet attendu (verbatim testeur) |
|---|:---:|:---:|:---:|---|
| Programme | ☐ | ☐ | ☐ | __________________ |
| Participants (annuaire) | ☐ | ☐ | ☐ | __________________ |
| Salon (annonces & sondages) | ☐ | ☐ | ☐ | __________________ |
| Messages | ☐ | ☐ | ☐ | __________________ |
| Rendez-vous | ☐ | ☐ | ☐ | __________________ |
| Annonces | ☐ | ☐ | ☐ | __________________ |
| Sondages | ☐ | ☐ | ☐ | __________________ |
| Profil / badge / QR | ☐ | ☐ | ☐ | __________________ |
| Bookmark d'une session | ☐ | ☐ | ☐ | __________________ |
| Recommandation de personnes (matchmaking) | ☐ | ☐ | ☐ | __________________ |

---

## D. Point de vigilance — menu « Participants »

Le menu **Participants** fusionne Networking + Matchmaking + Messages + Rendez-vous. C'est le changement le plus risqué de la réorganisation.

| Question | Réponse |
|---|---|
| Le testeur a-t-il compris que ce menu contient les messages ? | ☐ Oui ☐ Non |
| Le testeur a-t-il compris qu'il contient les rendez-vous ? | ☐ Oui ☐ Non |
| Le testeur a-t-il compris qu'il contient les suggestions de rencontre ? | ☐ Oui ☐ Non |
| A-t-il cherché ces fonctions ailleurs (Salon, Profil, Accueil) ? | ☐ Oui ☐ Non — où : __________ |
| Mot qu'il aurait préféré voir à la place de « Participants » | __________________ |

---

## E. Verbatim / hésitations / blocages

Noter mots exacts, soupirs, retours arrière, durée des hésitations > 5 s.

| Écran / contexte | Observation | Durée hésitation |
|---|---|---|
| | | |
| | | |
| | | |
| | | |

---

## F. Synthèse à chaud (à remplir juste après la session)

| | |
|---|---|
| Heure de fin | _____ : _____ |
| Nombre de tâches complétées sans aide (sur 5 + 10 = 15) | _____ / 15 |
| Sentiment général du testeur (1 = perdu, 5 = à l'aise) | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 |
| Le testeur recommanderait-il l'app à un collègue ? | ☐ Oui ☐ Non ☐ Sous condition : ______ |
| Top 1 friction (1 phrase) | __________________________________________ |
| Top 1 surprise positive (1 phrase) | __________________________________________ |

---

## G. Sortie du périmètre — captures Phase 5

Si le testeur a explicitement réclamé une fonctionnalité absente, la noter ici (input Phase 5, **ne pas développer maintenant**).

| Demande spontanée | Où il l'attendait |
|---|---|
| ex. liste des exposants | ex. « dans Salon » |
| | |
| | |

---

## Consolidation (à remplir après les 10 testeurs)

À reporter dans `docs/sprint-0/07-rapport-j5.md` selon les 8 sections obligatoires définies dans `05-decouvrabilite.md`.

**Seuil de validation Lot 1 (rappel) :** ≥ 80 % des sous-tâches du scénario critique réussies sans aide. Sinon → mise à jour `ARCHITECTURE-PRODUIT-V2.md` en V2.1 avant Phase 4.
