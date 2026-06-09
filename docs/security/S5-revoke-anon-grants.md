# S5 — REVOKE GRANTs anon (audit + migration proposée)

**Statut** : audit + migration **proposée, non appliquée**.
**Pré-requis posé par S4-bis** : aucune migration sans arbitrage explicite.
**Objectif** : defense-in-depth. Aujourd'hui seule RLS protège 13 tables — un oubli de policy = exposition totale via PostgREST.

## 1. État constaté (snapshot DB)

Source : `pg_class.relacl` ∩ rôle `anon`, schéma `public`.

### 1.1 GRANTs `anon` excessifs (à révoquer)

| Table | anon a aujourd'hui | Justification métier connue | Action S5 |
|---|---|---|---|
| `audit_trail` | DELETE, INSERT, SELECT, UPDATE | Aucune. Lecture super_admin uniquement. | **REVOKE ALL FROM anon** |
| `event_announcements` | DELETE, INSERT, SELECT, UPDATE | Lecture publique passe par event publié → RPC ou session participant. | **REVOKE ALL FROM anon** |
| `event_sessions` | DELETE, INSERT, SELECT, UPDATE | SELECT public légitime (policy `sessions_select_public_published` M4b-A). | **REVOKE ALL, puis GRANT SELECT** |
| `event_speakers` | DELETE, INSERT, SELECT, UPDATE | SELECT public légitime (policy M4b-A). | **REVOKE ALL, puis GRANT SELECT** |
| `event_session_speakers` | DELETE, INSERT, SELECT, UPDATE | SELECT public légitime (policy M4b-A). | **REVOKE ALL, puis GRANT SELECT** |
| `events` | DELETE, INSERT, UPDATE *(pas de SELECT)* | Aucune écriture publique. | **REVOKE ALL FROM anon** |
| `live_polls` | DELETE, INSERT, SELECT, UPDATE | Vote = utilisateur authentifié. | **REVOKE ALL FROM anon** |
| `live_poll_votes` | MAINTAIN, REFERENCES, TRIGGER, TRUNCATE | Aucune. | **REVOKE ALL FROM anon** |
| `notification_outbox` | DELETE, INSERT, SELECT, UPDATE | Interne service_role uniquement. | **REVOKE ALL FROM anon** |
| `organizations` | DELETE, INSERT, SELECT, UPDATE | Lecture publique fiche org → via RPC à clarifier (cf. §3). | **REVOKE ALL FROM anon** |
| `security_audit_runs` | DELETE, INSERT, SELECT, UPDATE | super_admin uniquement. | **REVOKE ALL FROM anon** |
| `session_attendance` | MAINTAIN, REFERENCES, TRIGGER, TRUNCATE | Aucune. | **REVOKE ALL FROM anon** |
| `user_roles` | DELETE, INSERT, SELECT, UPDATE | **CRITIQUE** — escalation possible si RLS faillit. | **REVOKE ALL FROM anon** |

### 1.2 GRANTs `anon` légitimes (à conserver tels quels)

| Table | anon a aujourd'hui | Justification | Action S5 |
|---|---|---|---|
| `newsletter_subscribers` | INSERT seulement | Inscription publique newsletter. | **conserver** |

### 1.3 Tables sans GRANT `anon` (rien à faire)

`event_conversations`, `event_meetings`, `event_messages`, `event_registrations`, `profiles`, `session_bookmarks`, `super_admin_bootstrap_emails`.

## 2. Matrice cible après S5

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `audit_trail` | — | (à figer S5 selon RLS : SELECT pour super_admin via policy) | ALL |
| `event_announcements` | — | SELECT/INSERT/UPDATE/DELETE (RLS filtre) | ALL |
| `event_sessions` | **SELECT** | SELECT/INSERT/UPDATE/DELETE | ALL |
| `event_speakers` | **SELECT** | SELECT/INSERT/UPDATE/DELETE | ALL |
| `event_session_speakers` | **SELECT** | SELECT/INSERT/UPDATE/DELETE | ALL |
| `events` | — | SELECT/INSERT/UPDATE/DELETE | ALL |
| `live_polls` | — | SELECT/INSERT/UPDATE/DELETE | ALL |
| `live_poll_votes` | — | SELECT/INSERT/UPDATE/DELETE | ALL |
| `notification_outbox` | — | — | ALL |
| `organizations` | — | SELECT/INSERT/UPDATE/DELETE | ALL |
| `security_audit_runs` | — | SELECT (super_admin via RLS) | ALL |
| `session_attendance` | — | SELECT/INSERT/UPDATE/DELETE | ALL |
| `user_roles` | — | SELECT (RLS scope soi-même) | ALL |
| `newsletter_subscribers` | **INSERT** | inchangé | ALL |

## 3. Points d'arbitrage AVANT exécution

### Q1 — Listing public d'événements (`events`)
`anon` n'a **pas** de SELECT sur `events` actuellement. La home publique fonctionne donc déjà soit via :
- (a) une RPC `SECURITY DEFINER` (à confirmer dans `src/lib/landing.functions.ts`),
- (b) un appel server-side avec session technique.

**Décision attendue** : confirmer le mode actuel. Si on découvre un appel anon direct sur `events`, S5 cassera la home → il faudra créer la RPC d'abord.

### Q2 — Fiche publique organisation
Même question pour `organizations`. Si la fiche org publique existe, elle doit passer par RPC après S5.

### Q3 — Lot d'exécution
Deux options :
- **S5-A (proposée)** : tout en une migration, rollback simple, fenêtre courte.
- **S5-B (prudente)** : un GRANT par famille de tables (sessions → comm → admin → user_roles), 4 migrations successives avec vérif manuelle entre chaque.

Recommandation : **S5-B**, vu que `user_roles` est critique et qu'une erreur de policy ferait tomber l'app.

### Q4 — Tables hors scope S5
- `live_poll_votes` et `session_attendance` n'ont que `MAINTAIN/REFERENCES/TRIGGER/TRUNCATE` (résidus). Peut être traité en S5 ou repoussé en nettoyage cosmétique.

## 4. Migration proposée — S5-B (par famille, recommandée)

### Famille 1 — Sessions / Speakers (rétablir GRANT SELECT propre)
```sql
REVOKE ALL ON public.event_sessions FROM anon;
REVOKE ALL ON public.event_speakers FROM anon;
REVOKE ALL ON public.event_session_speakers FROM anon;
GRANT SELECT ON public.event_sessions TO anon;
GRANT SELECT ON public.event_speakers TO anon;
GRANT SELECT ON public.event_session_speakers TO anon;
```
**Rollback** :
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_session_speakers TO anon;
```

### Famille 2 — Communication (annonces / polls)
```sql
REVOKE ALL ON public.event_announcements FROM anon;
REVOKE ALL ON public.live_polls FROM anon;
REVOKE ALL ON public.live_poll_votes FROM anon;
```
**Pré-requis** : confirmer que la lecture des annonces publiées par utilisateur non authentifié passe par RPC (sinon, lecture annonces publiques cassée).

### Famille 3 — Events / Organizations
```sql
REVOKE ALL ON public.events FROM anon;
REVOKE ALL ON public.organizations FROM anon;
```
**Pré-requis** : Q1 + Q2 ci-dessus.

### Famille 4 — Sensibles / techniques (criticité maximale)
```sql
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.audit_trail FROM anon;
REVOKE ALL ON public.security_audit_runs FROM anon;
REVOKE ALL ON public.notification_outbox FROM anon;
REVOKE ALL ON public.session_attendance FROM anon;
```
**Risque résiduel** : nul (aucune lecture publique légitime ici).

## 5. Vérifications post-exécution (à scripter)

Après chaque famille :
1. `SELECT ... FROM information_schema.role_table_grants WHERE grantee='anon'` → diff vs cible.
2. Test E2E `public-navigation.spec.ts` (existe déjà).
3. Test E2E `event-actions.spec.ts` (inscription + check-in).
4. Smoke manuel : `/`, `/e/:slug`, `/events` listing public, signup newsletter.
5. Lecture super_admin de `audit_trail` + `security_audit_runs` (doit toujours fonctionner via RLS).

## 6. Risques résiduels après S5

- **GRANTs PUBLIC** : non audités ici (à vérifier).
- **Fonctions `SECURITY DEFINER` exposées à anon** : périmètre **S7** (RPC publiques durcies).
- **Realtime / Storage** : politiques séparées, non couvertes.
- **Cross-org en lecture** : couvert par S4-bis (M4b-B/C/E), pas par S5.

## 7. Recommandation

1. Arbitrer Q1, Q2, Q3 ci-dessus.
2. Si OK : exécuter famille 1 d'abord (la plus sûre, restaure GRANT SELECT explicite cohérent avec les policies M4b-A) → vérifier.
3. Puis 4 (sensibles), puis 2, puis 3.
4. Ne pas toucher `newsletter_subscribers`.
5. Repousser audit GRANTs PUBLIC + RPC `SECURITY DEFINER` en S7.
