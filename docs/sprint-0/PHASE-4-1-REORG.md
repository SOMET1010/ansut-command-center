# Phase 4.1 — Réorganisation produit ANSUT Event

**Statut** : spécification figée — livrables de cadrage uniquement.
**Périmètre** : navigation **uniquement**. Aucun changement DB, API, RLS, règle métier ou fonctionnalité.
**Pré-requis** : Phase S ✅ · Architecture V2 ✅ (D8 Amendement 5).
**Bloque** : exécution = après J5 (gel développement maintenu jusqu'au Go/No-Go).

---

## 1. Contraintes (non négociables)

| # | Règle |
|---|---|
| C1 | Aucun changement de schéma Supabase |
| C2 | Aucun changement d'APIs / serveur fns / RPC |
| C3 | Aucun changement des permissions / RLS / GRANT |
| C4 | Aucun ajout de fonctionnalité |
| C5 | Aucune suppression de fonctionnalité — seulement regroupement visuel |
| C6 | Compatibilité des URLs existantes via redirections **301** (6 mois — cf. D7) |
| C7 | 5 entrées de navigation **strictes** par rôle (cf. D8) |

---

## 2. Sitemap cible

### 2.1 Participant — `/e/$slug/*`

| # | Entrée | Route cible | Sous-pages (onglets internes) |
|---|---|---|---|
| 1 | **Accueil** | `/e/$slug` | cockpit actions : prochaine session · invitations RDV · messages non lus · annonces |
| 2 | **Programme** | `/e/$slug/programme` | Agenda · Sessions · Favoris |
| 3 | **Participants** | `/e/$slug/participants` | Annuaire · Suggestions (matchmaking) · Messages · Mes rendez-vous |
| 4 | **Salon** | `/e/$slug/salon` | Exposants · Sponsors · Plan · Wi-Fi · Infos pratiques |
| 5 | **Mon Profil** | `/e/$slug/profil` | Profil · Badge QR · Paramètres |

> Communication (annonces + sondages) = badge notification permanent en top bar, pas une 6e entrée.

### 2.2 Staff — `/staff/*`

| # | Entrée | Route cible |
|---|---|---|
| 1 | **Accueil** | `/staff` |
| 2 | **Check-in** | `/staff/checkin` |
| 3 | **Participants** | `/staff/participants` |
| 4 | **Opérations** | `/staff/operations` (support terrain + stats fusionnés) |
| 5 | **Profil** | `/staff/profil` |

### 2.3 Org Admin — `/org/*`

| # | Entrée | Route cible | Onglets |
|---|---|---|---|
| 1 | **Cockpit** | `/org` | actions · KPI · prochains événements |
| 2 | **Participants** | `/org/participants` | Liste · Inscriptions · Validations · Exports |
| 3 | **Programme** | `/org/programme` | Événements · Sessions · Intervenants |
| 4 | **Communication** | `/org/communication` | Annonces · Sondages |
| 5 | **Paramètres** | `/org/parametres` | Organisation · Membres · Préférences |

### 2.4 Super Admin — `/admin/*`

| # | Entrée | Route cible |
|---|---|---|
| 1 | **Cockpit Global** | `/admin` |
| 2 | **Événements** | `/admin/evenements` |
| 3 | **Organisations** | `/admin/organisations` |
| 4 | **Utilisateurs** | `/admin/utilisateurs` |
| 5 | **Administration** | `/admin/administration` (sécurité · audit · bootstrap fusionnés) |

---

## 3. Mapping ancien menu → nouveau menu

### 3.1 Participant

| Ancien (route fichier) | Ancien libellé | → | Nouvelle entrée | Onglet |
|---|---|---|---|---|
| `e.$slug.tsx` | Mon événement | → | **Accueil** | — |
| `agenda.$slug.tsx` | Agenda | → | **Programme** | Agenda |
| `attendance.$sessionId.tsx` | Présence session | → | **Programme** | Agenda (action) |
| `live.$sessionId.tsx` | Live | → | **Programme** | Sessions (action live) |
| `networking.$slug.tsx` | Networking | → | **Participants** | Annuaire |
| `matchmaking.$slug.tsx` | Matchmaking | → | **Participants** | Suggestions |
| `messages.$slug.tsx` | Messages | → | **Participants** | Messages |
| `rdv.$slug.tsx` | Rendez-vous | → | **Participants** | Mes rendez-vous |
| `annonces.$slug.tsx` | Annonces | → | top bar notifications |
| `poll.$pollId.tsx` | Sondage | → | top bar notifications |
| *(à créer)* | — | → | **Salon** | Exposants · Sponsors · Plan · Wi-Fi · Infos |
| *(à créer)* | — | → | **Mon Profil** | Profil · Badge · Paramètres |

### 3.2 Staff

| Ancien | → | Nouvelle entrée |
|---|---|---|
| `_authenticated/checkin.tsx` | → | **Check-in** |
| `_authenticated/participants.tsx` (vue staff) | → | **Participants** |
| *(à créer — support + stats)* | → | **Opérations** |
| `_authenticated/dashboard.tsx` (vue staff) | → | **Accueil** |

### 3.3 Org Admin

| Ancien | → | Nouvelle entrée | Onglet |
|---|---|---|---|
| `_authenticated/dashboard.tsx` | → | **Cockpit** | — |
| `_authenticated/participants.tsx` | → | **Participants** | Liste |
| `_authenticated/events.$id.registrations.tsx` | → | **Participants** | Inscriptions |
| `_authenticated/exports.tsx` | → | **Participants** | Exports |
| `_authenticated/events.tsx` | → | **Programme** | Événements |
| `_authenticated/events.new.tsx` | → | **Programme** | Événements (action) |
| `_authenticated/events.$id.edit.tsx` | → | **Programme** | Événements (édition) |
| `_authenticated/events.$id.sessions.tsx` | → | **Programme** | Sessions |
| `_authenticated/announcements.tsx` | → | **Communication** | Annonces |
| `_authenticated/polls.tsx` | → | **Communication** | Sondages |
| *(à créer)* | → | **Paramètres** | Organisation · Membres |

### 3.4 Super Admin

| Ancien | → | Nouvelle entrée |
|---|---|---|
| `_authenticated/dashboard.tsx` (super) | → | **Cockpit Global** |
| `_authenticated/events.tsx` (vue globale) | → | **Événements** |
| *(à créer)* | → | **Organisations** |
| *(à créer)* | → | **Utilisateurs** |
| `_authenticated/security-audit.tsx` + `_authenticated/admin.setup.tsx` | → | **Administration** |

---

## 4. Maquettes filaires (ASCII — validation comité avant maquettes graphiques)

### 4.1 Participant — Accueil (mobile)

```text
┌──────────────────────────────────┐
│ SUTEL 2026 — Jour 1     🔔 3    │
├──────────────────────────────────┤
│ ⏰ Prochaine session — 22 min    │
│    Souveraineté numérique        │
│    Salle Atlas        [Y aller]  │
├──────────────────────────────────┤
│ 🤝 1 invitation RDV   [Répondre] │
│ 💬 2 nouveaux messages [Lire]    │
│ 📣 1 annonce non lue   [Voir]    │
├──────────────────────────────────┤
│ [Mon badge QR]                   │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ 🏠      📅      👥      🏛      👤│
│Accueil Programme Particip. Salon │
└──────────────────────────────────┘
```

### 4.2 Participant — Programme

```text
┌──────────────────────────────────┐
│ ← Programme              🔔     │
├──────────────────────────────────┤
│ [ Agenda ][ Sessions ][ Favoris ]│
├──────────────────────────────────┤
│ AUJOURD'HUI                      │
│ 09:00 ▸ Ouverture officielle     │
│ 10:30 ▸ Souveraineté ⭐         │
│ 14:00 ▸ Atelier IA               │
│                                  │
│ DEMAIN                           │
│ 09:30 ▸ Cybersécurité            │
└──────────────────────────────────┘
```

### 4.3 Participant — Participants

```text
┌──────────────────────────────────┐
│ ← Participants           🔔     │
├──────────────────────────────────┤
│ [ Annuaire ][ Suggestions ]      │
│ [ Messages ][ Mes RDV ]          │
├──────────────────────────────────┤
│ 🔎 Rechercher un participant     │
├──────────────────────────────────┤
│ 👤 Aïssatou Diallo — Orange CI   │
│ 👤 Kouamé Yao — Min. Économie    │
│ 👤 ...                           │
└──────────────────────────────────┘
```

### 4.4 Participant — Salon

```text
┌──────────────────────────────────┐
│ ← Salon                  🔔     │
├──────────────────────────────────┤
│ [Exposants][Sponsors][Plan]      │
│ [Wi-Fi][Infos pratiques]         │
├──────────────────────────────────┤
│ 🏛 30 exposants                  │
│  ▸ Stand A12 — Orange Business   │
│  ▸ Stand B05 — MTN Côte d'Ivoire │
└──────────────────────────────────┘
```

### 4.5 Org Admin — Cockpit (desktop)

```text
┌───────────────────────────────────────────────────────────┐
│ Cockpit — {Org}                              🔔 5  👤    │
├──────────┬────────────────────────────────────────────────┤
│ Cockpit  │ Bonjour {prénom} — 3 actions en attente       │
│ Particip │ ┌──────────────────────────────────────────┐  │
│ Programme│ │ ⚠ 12 inscriptions à valider  [Valider]   │  │
│ Comm.    │ │ ⚐ 1 sondage prêt à publier   [Publier]   │  │
│ Param.   │ │ ✎ 2 annonces en brouillon    [Éditer]    │  │
│          │ └──────────────────────────────────────────┘  │
│          │ Prochain événement : SUTEL — J-14 — 247/300  │
└──────────┴────────────────────────────────────────────────┘
```

---

## 5. Routes impactées — synthèse

### 5.1 Routes à créer

```
src/routes/_e.$slug.tsx                      (layout participant + nav 5 entrées)
src/routes/_e.$slug.index.tsx                 (Accueil cockpit)
src/routes/_e.$slug.programme.tsx             (onglets Agenda/Sessions/Favoris)
src/routes/_e.$slug.participants.tsx          (onglets Annuaire/Suggestions/Messages/RDV)
src/routes/_e.$slug.salon.tsx                 (onglets Exposants/Sponsors/Plan/Wi-Fi/Infos)
src/routes/_e.$slug.profil.tsx                (onglets Profil/Badge/Paramètres)

src/routes/_authenticated/staff.tsx           (layout staff)
src/routes/_authenticated/staff.index.tsx
src/routes/_authenticated/staff.checkin.tsx
src/routes/_authenticated/staff.participants.tsx
src/routes/_authenticated/staff.operations.tsx
src/routes/_authenticated/staff.profil.tsx

src/routes/_authenticated/org.tsx             (layout org)
src/routes/_authenticated/org.index.tsx
src/routes/_authenticated/org.participants.tsx
src/routes/_authenticated/org.programme.tsx
src/routes/_authenticated/org.communication.tsx
src/routes/_authenticated/org.parametres.tsx

src/routes/_authenticated/admin.tsx           (layout super)
src/routes/_authenticated/admin.index.tsx
src/routes/_authenticated/admin.evenements.tsx
src/routes/_authenticated/admin.organisations.tsx
src/routes/_authenticated/admin.utilisateurs.tsx
src/routes/_authenticated/admin.administration.tsx
```

### 5.2 Routes à conserver (redirigées 301)

| Route actuelle | Redirection 301 |
|---|---|
| `/agenda/$slug` | `/e/$slug/programme?tab=agenda` |
| `/networking/$slug` | `/e/$slug/participants?tab=annuaire` |
| `/matchmaking/$slug` | `/e/$slug/participants?tab=suggestions` |
| `/messages/$slug` | `/e/$slug/participants?tab=messages` |
| `/rdv/$slug` | `/e/$slug/participants?tab=rdv` |
| `/annonces/$slug` | `/e/$slug?notif=annonces` |
| `/live/$sessionId` | `/e/$slug/programme?session=$sessionId&live=1` |
| `/attendance/$sessionId` | `/e/$slug/programme?session=$sessionId&attendance=1` |
| `/poll/$pollId` | `/e/$slug?poll=$pollId` |
| `/_authenticated/checkin` | `/staff/checkin` |
| `/_authenticated/announcements` | `/org/communication?tab=annonces` |
| `/_authenticated/polls` | `/org/communication?tab=sondages` |
| `/_authenticated/events` | `/org/programme?tab=evenements` |
| `/_authenticated/events/$id/edit` | `/org/programme?tab=evenements&edit=$id` |
| `/_authenticated/events/$id/sessions` | `/org/programme?tab=sessions&event=$id` |
| `/_authenticated/events/$id/registrations` | `/org/participants?tab=inscriptions&event=$id` |
| `/_authenticated/participants` | `/org/participants?tab=liste` |
| `/_authenticated/exports` | `/org/participants?tab=exports` |
| `/_authenticated/security-audit` | `/admin/administration?tab=securite` |
| `/_authenticated/admin/setup` | `/admin/administration?tab=bootstrap` |
| `/_authenticated/dashboard` | `/me/role` (dispatcher déjà existant) |

### 5.3 Post-login (`/me/role` — déjà en place)

```text
super_admin → /admin
org_admin   → /org
staff       → /staff
participant → /e/{prochain_event}
```

Aucune modification du dispatcher : seules les cibles changent.

---

## 6. Plan de migration navigation

### Étape 0 — Pré-requis
Rapport J5 publié + critères Go validés (C1–C4 cf. `05-decouvrabilite.md`).

### Étape 1 — Squelette layouts (jour 1–2)
Créer les 4 layouts (`_e.$slug.tsx`, `staff.tsx`, `org.tsx`, `admin.tsx`) avec nav 5 entrées strictes et `<Outlet />`. Pas encore de fusion : chaque entrée pointe vers les routes existantes en iframe / re-export pour valider la nav.

### Étape 2 — Fusions Participant (jour 3–5)
Déplacer le contenu de `networking`, `matchmaking`, `messages`, `rdv` dans `_e.$slug.participants.tsx` sous forme d'onglets (composants Tabs shadcn). Aucune logique métier déplacée — seulement les imports de composants.

### Étape 3 — Fusions Org Admin (jour 6–7)
Idem pour `announcements` + `polls` → `org.communication.tsx`. `events*` → `org.programme.tsx`. `exports` + `participants` + `registrations` → `org.participants.tsx`.

### Étape 4 — Nouvelles entrées vides (jour 8)
Créer `_e.$slug.salon.tsx`, `_e.$slug.profil.tsx`, `staff.operations.tsx`, `staff.profil.tsx`, `org.parametres.tsx`, `admin.*` avec empty states explicites *« À venir »*. **Aucune nouvelle fonctionnalité** — uniquement structure de page + onglets vides.

### Étape 5 — Redirections 301 (jour 9)
Pour chaque ancienne route §5.2 : remplacer le composant par un `redirect()` côté loader vers la nouvelle URL avec préservation des query params. Bannière *« Cette rubrique a été déplacée »* visible 60 jours (D7).

### Étape 6 — Renommage libellés (jour 10)
Tous les libellés visibles passent au vocabulaire D8 (Accueil / Programme / Participants / Salon / Mon Profil…). Aucun libellé technique restant dans l'UI.

### Étape 7 — Recette (jour 11)
- Tous les liens email / QR badges existants résolvent via redirection ✅
- Aucune route 404 sur les anciennes URLs
- Chaque rôle voit exactement 5 entrées
- Tests E2E `cockpit-navigation.spec.ts` étendus aux 4 rôles

### Étape 8 — J5 bis (jour 12)
Re-test des 10 scénarios sur la nouvelle nav. Si critères Go atteints → Phase 4-bis UX Premium. Sinon → V2.2.

---

## 7. Hors-périmètre explicite (à ne pas faire en Phase 4.1)

- ❌ Refonte graphique (couleurs, typo, animations) → Phase 4-bis
- ❌ Nouvelle table / colonne / RPC
- ❌ Nouvelles permissions
- ❌ Module Sponsor (reporté Phase 5 — D5)
- ❌ Wizard préparation événement (Phase 4.2 si J5 le demande)
- ❌ Centre notifications enrichi (Phase 4-bis)
- ❌ Dark mode, polish responsive avancé (Phase 4-bis)

---

## 8. Critères de validation Phase 4.1

| # | Critère | Vérification |
|---|---|---|
| V1 | 5 entrées strictes par rôle | inspection UI |
| V2 | Aucune migration SQL ajoutée | `git diff supabase/migrations` vide |
| V3 | Aucune nouvelle RPC / serverFn métier | `git diff src/lib/*.functions.ts` vide pour la logique |
| V4 | Toutes les anciennes URLs répondent 301 | tests E2E redirections |
| V5 | Libellés UI conformes vocabulaire D8 | grep + revue |
| V6 | J5 bis : critères Go atteints | rapport `08-rapport-j5-bis.md` |

**Phase 4-bis (UX Premium) bloquée tant que V1–V6 ne sont pas tous verts.**
