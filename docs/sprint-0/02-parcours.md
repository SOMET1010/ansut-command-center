# J2 — Cartographie des parcours

Un parcours = de l'entrée (lien, login) à la tâche de valeur. Gaps = fonctionnalité existe mais dispersée / non découvrable / dupliquée.

## Participant

```text
Lien invitation email
        │
        ▼
  /signup ou /login ──► /me.role (résolution rôle)
        │
        ▼
  /e/:slug  (accueil événement)
        │
        ├──► /e/:slug/profil  ───► badge QR
        ├──► /agenda/:slug    ───► bookmarks sessions
        ├──► /live/:sessionId ───► check-in auto
        ├──► /poll/:pollId    ───► vote
        ├──► /networking/:slug ──► annuaire opt-in
        │         │
        │         ├──► /matchmaking/:slug ──► suggestions IA
        │         ├──► /messages/:slug     ──► chat 1:1
        │         └──► /rdv/:slug          ──► prise RDV
        └──► /annonces/:slug  ───► fil annonces
```

**Gaps Participant** :
- **G-P1** Pas de "home" agrégée — l'utilisateur doit naviguer entre 8 routes distinctes (`agenda`, `annonces`, `messages`, `networking`, `matchmaking`, `rdv`, `poll`, `live`) au lieu d'un cockpit unifié `/e/:slug`.
- **G-P2** Badge accessible uniquement via profil — devrait être 1 clic depuis l'accueil.
- **G-P3** Networking / matchmaking sont 2 routes distinctes pour le même besoin métier (trouver qui rencontrer) → candidats à fusion.
- **G-P4** Pas de "Mes documents" alors que c'est listé dans le besoin produit.
- **G-P5** Notifications dispersées (annonces vs messages vs RDV) — pas de centre de notifications unique.

## Staff

```text
/login ──► /me.role (staff) ──► /dashboard (vue admin réduite) ❌
                                        │
                                        ▼ (devrait être)
                                  /checkin (home staff)
                                        │
                                        ├──► scan QR participant
                                        ├──► /participants (lecture)
                                        ├──► /announcements (lecture)
                                        └──► support terrain ❌ (n'existe pas)
```

**Gaps Staff** :
- **G-S1** Atterrissage par défaut incorrect (`/dashboard` au lieu de `/checkin`).
- **G-S2** Pas de vue "Support terrain" (tickets, FAQ ops) malgré besoin métier.
- **G-S3** Navigation latérale identique à Org Admin → bruit cognitif (voit Events, Polls, Exports inutiles).

## Sponsor

```text
/login ──► /me.role (sponsor) ──► ??? ❌ (aucune route définie)
```

**Gaps Sponsor** :
- **G-Sp1** **Aucun parcours implémenté** — enum DB seulement.
- **G-Sp2** Pas de "Mes leads", pas de "Mon stand", pas de page publique sponsor.
- **G-Sp3** Décision produit requise : périmètre minimum viable Sponsor pour v1 ?

## Org Admin

```text
/login ──► /me.role (org_admin) ──► /dashboard (org_id = current_user_org)
                                          │
                                          ├──► /events ──► /events/new
                                          │        │
                                          │        ├──► /events/:id/edit
                                          │        ├──► /events/:id/registrations
                                          │        └──► /events/:id/sessions
                                          │
                                          ├──► /participants
                                          ├──► /announcements ──► publier
                                          ├──► /polls         ──► publier
                                          ├──► /exports       ──► CSV
                                          └──► /checkin       ❌ (devrait être Staff)
```

**Gaps Org Admin** :
- **G-O1** Dashboard orienté données (KPI bruts) au lieu d'actions ("3 inscriptions à valider").
- **G-O2** Pas de regroupement "Communication" (annonces + polls + messages broadcast dispersés).
- **G-O3** Pas de workflow "Préparer un événement" guidé (création → programme → comm → publication).
- **G-O4** Accès `/checkin` visible alors que c'est une vue Staff terrain — bruit.
- **G-O5** Pas de vue "Mon organisation" pour éditer la fiche org (route manquante alors que policy S4b-C existe).

## Super Admin

```text
/login ──► /me.role (super_admin) ──► /dashboard (vue globale)
                                            │
                                            ├──► /events       (toutes orgs)
                                            ├──► /participants (toutes orgs)
                                            ├──► /admin/setup
                                            ├──► /security-audit
                                            └──► (pas de vue Organisations) ❌
```

**Gaps Super Admin** :
- **G-SA1** Pas de vue `Organisations` (liste, création, désactivation) alors que table `organizations` existe.
- **G-SA2** Pas de vue `Audit trail` lisible (table existe, pas d'UI).
- **G-SA3** Pas de vue `Rôles` (gestion `user_roles` via UI) → tout passe par SQL.
- **G-SA4** Vue identique à Org Admin avec scope élargi → manque de signal visuel "vous êtes en mode plateforme".

## Synthèse — 5 frictions transverses majeures

| # | Friction | Impact |
|---|---|---|
| F1 | Pas de home rôle-spécifique après login | Tout le monde atterrit sur `/dashboard` ou `/e/:slug` sans contexte |
| F2 | Navigation identique pour Staff / Org Admin / Super Admin | Bruit cognitif majeur |
| F3 | Sponsor sans UI | Rôle promis, non livré |
| F4 | Dashboard orienté données vs orienté actions | "Je vois des chiffres, pas ce que je dois faire" |
| F5 | Fonctionnalités dispersées en 8+ routes parallèles côté Participant | "On se perd" — citation testeur |
