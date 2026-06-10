---
name: Accueil participant simplifié (/e/$slug)
description: Phase 4 — accueil inscrit organisé autour de l'usage réel (badge, prochaine action, programme, annonces, accès rapides). Branche non inscrit inchangée.
type: feature
---

## Deux modes sur `/e/$slug` (gating sur `qrToken`)

- **Inscrit** (`qrToken` connu via submit / localStorage / `?token=`) :
  1. `MyBadgeCard` (Lot 2)
  2. `EventHomeDashboard` :
     - Ma prochaine action (statique) : `status === 'checked_in'` → "Consultez le programme du jour" (lien `/agenda/$slug`) ; sinon → "Présentez votre badge à l'accueil" (par défaut, y compris si statut indisponible)
     - Programme du jour : `event_sessions` du jour Abidjan, `ends_at >= now`, ordre `starts_at`, limit 3
     - Annonces importantes : `event_announcements`, `is_pinned desc, published_at desc`, limit 2
     - Accès rapides : 4 tuiles (Programme · Participants · Salon · Mon Profil)
  3. `<details>` "À propos de l'événement" (titre, date, lieu, description repliés)

- **Non inscrit** : parcours d'origine intact (cover, titre, date/lieu, description, WiFi QR si dispo, carte formulaire).

## Décisions verrouillées

- Pas de logique métier complexe (pas de calcul "prochaine session in <2h"). Validé après J5 si besoin.
- Panneau "done" post-submit supprimé : `qrToken` set → bascule immédiate vers le dashboard, badge déjà téléchargeable depuis `MyBadgeCard`.
- Cover image et description longue retirées du parcours inscrit.
- WiFi QR retiré du parcours inscrit (à déplacer vers Salon au prochain passage sur `/annonces/$slug`).
- Aucune nouvelle table, aucun nouveau RPC, aucune nouvelle route.

## Dette connue (hors périmètre)

- Header `/e/$slug` (Announcements · Program · Admin panel) déborde <400 px. Priorité faible, à traiter lors du prochain chantier navigation global. **Ne pas mélanger** avec un lot fonctionnel.

## Lots gelés

- Lot 3 (fusion Réseau : networking/matchmaking/messages/rdv) — attente retour terrain.
- Lot 4 (fusion Session : live/attendance) — attente retour terrain.

## Signaux à observer en priorité (J5+)

1. Les participants trouvent-ils spontanément leur badge ?
2. Comprennent-ils immédiatement où consulter le programme ?
3. Utilisent-ils la rubrique "Participants" ou cherchent-ils "Réseau" ?
