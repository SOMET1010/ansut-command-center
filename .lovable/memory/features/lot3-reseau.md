---
name: Lot 3 — Réseau & rencontres
description: Périmètre verrouillé de /networking/$slug — onglets, libellés et interdiction d'ajouter messagerie/RDV backend en Phase 4
type: constraint
---
Route: `/networking/$slug`
Titre de page: **Réseau & rencontres**
Bottom-nav: garder le libellé **Participants** (pas "Réseau").

Onglets:
- **Découvrir** — 100% fonctionnel (RPC `list_event_networking`, recherche + filtres catégories).
- **Messages** — carte "Disponible prochainement". Texte: "Cette fonctionnalité sera activée pour les prochains événements. Vous pourrez échanger directement avec les participants rencontrés."
- **Rendez-vous** — carte "Disponible prochainement". Texte: "Cette fonctionnalité sera activée pour les prochains événements. Vous pourrez proposer et gérer des rendez-vous individuels."

**Interdit en Phase 4** (cycle de simplification, pas d'extension):
- pas de table `messages`
- pas de table `meeting_requests`
- pas de nouvelle RLS
- pas de nouvelle RPC
- pas de logique de messagerie ou RDV côté back

**Why:** L'objectif Phase 4 = rendre l'application évidente à comprendre, pas ajouter des capacités. Activation des fonctions avancées seulement après J5 ≥80% sur 5–10 utilisateurs réels (programme, participants, badge, infos pratiques trouvés sans assistance).
