---
name: Badge participant — Lot 2 Phase 4
description: Rendu badge sur Accueil /e/$slug, persistance qr_token, statuts, multi-device, offline
type: feature
---
**Source unique** : RPC `me_registration(qr_token)` → `event_registrations`. Aucune autre source pour identité badge (alignée check-in/networking/RDV).

**Persistance qr_token** :
- `localStorage["ansut:badge:{slug}"]` = token (set après inscription, lu au mount).
- `localStorage["ansut:badge:data:{token}"]` = cache JSON de `me_registration` → render offline-first.

**Récupération multi-device** : URL `?token={qr_token}` sur `/e/$slug` réhydrate et persiste. Token contenu dans l'email de confirmation. Pas de magic-link Phase 4 — Phase 5 si nécessaire.

**Statuts affichés** (mapping `event_registrations.status`) :
- `confirmed` → "Confirmé" (vert)
- `checked_in` → "Check-in effectué" (bleu)
- `pending` → "En attente de validation" (ambre)
- `cancelled` → "Inscription annulée" (rose) + avertissement, QR reste affiché mais marqué invalide.

**Plein écran (modale)** : fond blanc, ring fin, Wake Lock API si dispo (empêche l'écran de s'éteindre). Pas de fullscreen API ni d'API brightness — non disponibles côté web.

**Offline** : QR généré client (`qrcode`), identité depuis cache localStorage. Premier chargement nécessite réseau ; visites suivantes affichent immédiatement, refetch en arrière-plan.

**Composant** : `src/components/MyBadgeCard.tsx` (réutilisable).
