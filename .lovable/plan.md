# Plan — ANSUT EVENT (MVP SUTEL 3)

## Hypothèses à confirmer
1. **Charte graphique ANSUT** : je n'ai pas reçu de fichier. Si tu peux me confirmer les couleurs primaires/secondaires + logo (upload PNG/SVG), je les intègre dès la phase 1. Sinon je pars sur une base institutionnelle (bleu/blanc) à ajuster.
2. **APIs OTP Radar/Cockpit** : tu mentionnes des API internes pour WhatsApp / Telegram / Email. J'aurai besoin des **endpoints (URL)** et du nom à donner aux secrets. À défaut, je peux démarrer avec l'auth OTP **Email natif Lovable Cloud**, puis brancher Radar quand les endpoints sont fournis.
3. **Multi-tenant** : un seul tenant pour le MVP SUTEL 3, mais le schéma DB est conçu dès le départ avec une table `organizations` et `organization_id` sur toutes les ressources, RLS scopée.

## Stack
- **Frontend** : TanStack Start + React + Tailwind + shadcn/ui (déjà en place), PWA (manifest + service worker)
- **Backend** : Lovable Cloud (Supabase Postgres + Auth + Storage)
- **OTP** : Server functions `createServerFn` qui appellent les API Radar/Cockpit (à fournir)
- **QR code** : `qrcode` (génération) + `html5-qrcode` (scan check-in)
- **Realtime** : Supabase Realtime pour live polling
- **Charts** : Recharts pour le dashboard

## Architecture multi-tenant (dès le départ)

```text
organizations (tenant)
  └─ events
      ├─ event_registrations (participants accrédités)
      ├─ sessions (agenda)
      │   └─ polls (live polling)
      │       └─ poll_responses
      ├─ documents (bibliothèque)
      ├─ sponsors
      ├─ notifications
      └─ check_ins (scan QR)

users (auth.users)
  └─ user_roles (RBAC : super_admin, org_admin, staff, sponsor, participant)
```

RLS sur **toutes** les tables, scopée par `organization_id` + rôle.

## Phases de livraison

### Phase 1 — Fondations (livraison 1)
- Activer Lovable Cloud
- Schéma DB : `organizations`, `user_roles` (enum app_role), `events`, fonction `has_role()` security definer
- Auth Email + mot de passe (fallback) + structure pour OTP WhatsApp/Telegram quand endpoints fournis
- Layout shell : sidebar admin, header, navigation rôle-aware
- Routes : `/login`, `/_authenticated/dashboard`, `/_authenticated/events`
- Design system : tokens couleurs ANSUT dans `styles.css`

### Phase 2 — Gestion événements + inscriptions
- CRUD événements (admin) : nom, dates, lieu, capacité, visuel
- Page publique d'événement avec formulaire d'inscription
- Table `event_registrations` (statut: pending/confirmed/checked_in)
- Notification OTP/email à la confirmation
- Liste participants côté admin (filtres, export CSV)

### Phase 3 — Badges QR + check-in
- Génération badge PDF/PNG avec QR signé (HMAC pour anti-fraude)
- Page staff `/staff/checkin` : scan caméra QR, validation temps réel
- Historique check-ins par session
- Stats live (présents/inscrits)

### Phase 4 — Agenda + Live Polling
- Sessions liées à événement (titre, horaire, salle, intervenant)
- Vue agenda participant (timeline jour)
- Module Live Polling type Kahoot :
  - Admin crée question (QCM, vrai/faux, nuage de mots)
  - Lancement live → participants répondent depuis mobile
  - Affichage résultats temps réel (Supabase Realtime)
  - Mode projection écran

### Phase 5 — Contenus + Dashboard + PWA
- Bibliothèque documentaire (upload Storage, catégories, droits par rôle)
- Sponsors/exposants (logos, descriptions, niveau)
- Networking léger : annuaire participants opt-in + demande de RDV
- Dashboard analytics : inscriptions, taux check-in, participation polls, top sessions
- Notifications in-app + push (via OTP channels)
- PWA : manifest, installable, mode offline lecture agenda

## Sécurité (non négociable)
- RLS activée sur toutes les tables publiques
- Rôles dans table séparée `user_roles` + fonction `has_role()` (jamais sur profiles)
- QR codes signés HMAC server-side
- Validation Zod sur toutes les inputs server functions
- Secrets API Radar/Cockpit stockés via `add_secret` (jamais en clair)

## Hors-scope MVP (V2/V3)
GED avancée, IA matchmaking, analytics prédictifs, exploitation interministérielle, mémoire institutionnelle — préparés au niveau du schéma mais pas développés.

## Démarrage proposé
Je commence par **Phase 1** dès ton accord. Pour aller plus vite tu peux m'envoyer en parallèle :
- Logo + couleurs ANSUT
- Endpoints API Radar/Cockpit (URL + format payload OTP)
- 1 capture des maquettes Figma si possible

Réponds **"Go phase 1"** pour lancer.
