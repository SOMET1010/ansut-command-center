# Plan — Phase 2 : CRUD événements + inscriptions publiques

## Problème de démarrage (à résoudre en premier)
Aucun utilisateur n'a actuellement le rôle `org_admin` → personne ne peut créer d'événement à cause des RLS. Solution :
- **Seed** : créer l'organisation **ANSUT** (slug `ansut`) en base
- **Bootstrap admin** : fonction `claim_first_admin()` security-definer — le premier utilisateur connecté qui l'appelle devient `super_admin` automatiquement (puis verrouillée). Bouton visible uniquement si aucun super_admin n'existe encore.

## Base de données (1 migration)

Nouvelle table :
```text
event_registrations
  id, event_id (FK), user_id (nullable, pour inscriptions anonymes),
  full_name, email, phone, organization, position,
  status ('pending' | 'confirmed' | 'cancelled' | 'checked_in'),
  qr_token (UUID unique, généré côté serveur en Phase 3),
  created_at, updated_at
  UNIQUE (event_id, email)
```

RLS :
- **INSERT** public (`anon` + `authenticated`) — n'importe qui peut s'inscrire à un événement `published`
- **SELECT** : admins/staff de l'organisation, ou le participant lui-même (par `user_id` si connecté)
- **UPDATE/DELETE** : admins/staff uniquement
- Validation trigger : refuse l'insert si l'événement n'est pas `published` ou si capacité atteinte

Fonctions :
- `claim_first_admin()` → assigne `super_admin` à `auth.uid()` si aucun n'existe
- `set_updated_at` déjà en place

Seed : insert `organizations (name='ANSUT', slug='ansut', primary_color='#1d3a8a')`

## Frontend

### Admin (sous `/_authenticated/`)
- **`/events`** (refonte) : liste avec actions (Voir, Éditer, Publier/Dépublier, Supprimer), bouton "Nouvel événement", filtres statut
- **`/events/new`** : formulaire création (name, slug auto, description, location, starts_at, ends_at, capacity, cover_url, status)
- **`/events/$id/edit`** : édition du même formulaire
- **`/events/$id/registrations`** : liste participants + export CSV + recherche + filtre statut
- **`/admin/setup`** (visible si aucun super_admin) : bouton "Devenir administrateur" → appelle `claim_first_admin()`

### Public
- **`/e/$slug`** : page publique d'événement
  - Hero (cover, nom, dates, lieu)
  - Description
  - Formulaire d'inscription (nom, email, téléphone, organisation, poste)
  - Message de confirmation après envoi
  - SEO : title/description/og spécifiques à l'événement (via loader)

### Composants partagés
- `EventForm` (réutilisé new/edit) avec validation Zod
- `RegistrationForm` (page publique)
- `CSVExport` util pour la liste participants

## Notifications (placeholder)
Pour ne pas bloquer Phase 2 sur les APIs Radar/Cockpit :
- Message de confirmation in-app affiché après inscription
- Stub `sendRegistrationNotification(registration)` côté server function — log uniquement. Branchement réel API OTP en **Phase 2.5** dès que tu fournis les endpoints.

## Sidebar
Ajout : lien "Setup admin" conditionnel (si aucun super_admin)

## Hors-scope de cette phase
- Génération QR + badges PDF (Phase 3)
- Envoi réel WhatsApp/Telegram/Email (attente endpoints Radar/Cockpit)
- Multi-organisation côté UI (UI fixée à ANSUT pour MVP SUTEL 3 ; le schéma reste multi-tenant)

## Livrables
- 1 migration DB (table `event_registrations` + fonctions + seed ANSUT)
- 6 nouveaux fichiers route
- 2 composants formulaires + 1 util CSV
- Sidebar mise à jour

Réponds **"Go"** pour lancer.
