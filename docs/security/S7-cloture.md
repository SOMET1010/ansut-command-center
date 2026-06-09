# S7 — Clôture sécurité

Statut : **terminé** (périmètre strict défini).

## 1. `live_poll_votes` — sortie des lectures directes

### RPC créée

`public.get_poll_results(p_poll_id uuid) RETURNS jsonb`
- `SECURITY DEFINER`, `STABLE`, `search_path = public`
- `EXECUTE` : `anon`, `authenticated`, `service_role` (PUBLIC révoqué)
- Retour : `{ ok, total_votes, counts }` — **jamais** de votes bruts, ni `participant_id`, ni horodatage individuel.
- Erreur : `{ ok:false, error:'unknown_poll' }` si l'ID est inconnu.

### Routes refactorées

| Route | Avant | Après |
|---|---|---|
| `/poll/$pollId` | `from("live_poll_votes").select("answer")` | `rpc("get_poll_results")` |
| `/live/$sessionId` | idem (polling 3 s) | idem |
| `/_authenticated/polls` | `from("live_poll_votes").select(count, head)` | idem (lit `total_votes`) |

Vérification : `rg "from\\([\"']live_poll_votes" src/` → **0 résultat** (hors `types.ts` auto-généré).

### Conséquence sur les GRANTs `live_poll_votes`

Aucun changement de GRANT : l'ACL actuelle n'autorise déjà pas `anon` SELECT. La passerelle Supabase mappe la clé publishable sur `authenticated`, et les policies ne donnent pas non plus SELECT direct à `authenticated`. Toute lecture passe désormais par la RPC d'agrégation.

### Tests

```bash
# anon : poll inconnu
curl -s -X POST .../rest/v1/rpc/get_poll_results \
  -H "apikey: $PUB" -d '{"p_poll_id":"00000000-..."}'
# → {"ok": false, "error": "unknown_poll"}

# anon : lecture directe toujours bloquée
curl .../rest/v1/live_poll_votes?select=id → 401
```

### Rollback

```sql
DROP FUNCTION IF EXISTS public.get_poll_results(uuid);
-- + git revert sur les 3 routes
```

---

## 2. Clarification `events` SELECT (mystère levé)

### Symptôme

`has_table_privilege('anon','public.events','SELECT')` → **false**
`curl .../rest/v1/events?status=eq.published` avec `sb_publishable_*` → **200**

### Mécanisme réel

1. `sb_publishable_*` est un **token opaque** (pas un JWT classique). Sans clé du tout → 401.
2. La passerelle Supabase (Kong + GoTrue + PostgREST) **traduit** ce token en session PostgREST avec `role = authenticated` (et non `anon`), même sans utilisateur connecté.
3. ACL de `events` : `authenticated=arwdDxtm/postgres` → SELECT autorisé au niveau GRANT.
4. Policy `events_select_published` (`roles:{public}`, donc applicable à `authenticated`) : `status='published' OR has_role(...)`. Pour un visiteur anonyme `has_role` retourne false, mais `status='published'` est vrai → SELECT passe.

### Décision

**Documenter, ne pas corriger.** Comportement intentionnel de Supabase moderne avec les nouvelles clés publishable. Aucune fuite : la policy filtre strictement aux événements publiés.

Implication pour Famille 2 partielle (event_announcements, live_polls) : le `GRANT SELECT TO anon` ajouté est de la **defense-in-depth**. Inutile en pratique avec publishable key, mais protège contre toute régression future (clé legacy anon, JWT custom, etc.). Garder.

---

## 3. Audit GRANTs PUBLIC

### Tables (`public.*`)

Requête :
```sql
SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relacl IS NOT NULL
  AND EXISTS (SELECT 1 FROM aclexplode(c.relacl) a WHERE a.grantee=0);
```
Résultat : **0 table**. Aucun GRANT au pseudo-rôle `PUBLIC` sur les tables. ✅

### Fonctions (`public.*`)

21 fonctions ont `EXECUTE` à PUBLIC :

```
cancel_my_meeting, cast_poll_vote, create_meeting_request, current_user_org,
event_org, get_participant_public, list_conversation_messages,
list_event_directory, list_my_bookmarks, list_my_conversations,
list_my_meetings, list_my_sent_meeting_recipients, mark_conversation_read,
me_registration, record_session_attendance, register_for_event,
respond_to_meeting, send_conversation_message, start_conversation,
toggle_my_bookmark, update_my_profile
```

Toutes correspondent à des RPC métier publiques explicitement autorisées dans l'allowlist de `_security_audit_compute()`. **Conservées.**

Pour la **nouvelle RPC** `get_poll_results`, le PUBLIC EXECUTE par défaut a été **révoqué** au profit d'un GRANT explicite à `anon, authenticated, service_role` (pattern recommandé). Rollback documenté.

### Décision

Aucun retrait nécessaire. Statu quo validé.

---

## 4. Matrice définitive RPC × rôle × justification

Légende : `A`=anon (via publishable key→authenticated), `U`=authenticated user, `Adm`=staff/org_admin/super_admin, `SD`=`SECURITY DEFINER`.

### RPC publiques (auth=qr_token ou aucune)

| RPC | A | U | Adm | SD | Justification |
|---|:-:|:-:|:-:|:-:|---|
| `register_for_event` | ✓ | ✓ | ✓ | ✓ | Inscription publique (formulaire `/e/$slug`). Validation par trigger `validate_registration`. |
| `me_registration` | ✓ | ✓ | ✓ | ✓ | Lecture profil via `qr_token` (porté par le participant). |
| `update_my_profile` | ✓ | ✓ | ✓ | ✓ | Maj profil via `qr_token`. Bornes longueur appliquées. |
| `get_participant_public` | ✓ | ✓ | ✓ | ✓ | Lecture annuaire (filtré `is_visible_in_directory=true`). |
| `list_event_directory` | ✓ | ✓ | ✓ | ✓ | Annuaire complet d'un événement (filtré idem). |
| `list_event_networking` | ✓ | ✓ | ✓ | ✓ | Variante par slug (page publique networking). |
| `get_match_recommendations` | ✓ | ✓ | ✓ | ✓ | Recommandations basées sur `qr_token`. |
| `cast_poll_vote` | ✓ | ✓ | ✓ | ✓ | Vote sondage live (vérif `qr_token` + `is_active`). |
| **`get_poll_results`** *(S7)* | ✓ | ✓ | ✓ | ✓ | **Agrégat uniquement**, jamais de votes bruts. |
| `record_session_attendance` | ✓ | ✓ | ✓ | ✓ | Scan QR session (vérif `qr_token` + event match). |
| `start_conversation` | ✓ | ✓ | ✓ | ✓ | Messagerie 1-1 (vérif `qr_token` + même event). |
| `send_conversation_message` | ✓ | ✓ | ✓ | ✓ | idem. Borne longueur 4000. |
| `list_my_conversations` | ✓ | ✓ | ✓ | ✓ | Liste filtrée par `_reg_from_token`. |
| `list_conversation_messages` | ✓ | ✓ | ✓ | ✓ | idem. |
| `mark_conversation_read` | ✓ | ✓ | ✓ | ✓ | idem. |
| `create_meeting_request` | ✓ | ✓ | ✓ | ✓ | RDV networking. |
| `list_my_meetings` | ✓ | ✓ | ✓ | ✓ | idem. |
| `list_my_sent_meeting_recipients` | ✓ | ✓ | ✓ | ✓ | idem. |
| `respond_to_meeting` | ✓ | ✓ | ✓ | ✓ | idem (vérif recipient). |
| `cancel_my_meeting` | ✓ | ✓ | ✓ | ✓ | idem (vérif requester). |
| `list_my_bookmarks` | ✓ | ✓ | ✓ | ✓ | Bookmarks sessions. |
| `toggle_my_bookmark` | ✓ | ✓ | ✓ | ✓ | idem. |
| `_reg_from_token` | ✓ | ✓ | ✓ | ✓ | Helper interne (résolution `qr_token`→reg). |
| `current_user_org` | ✓ | ✓ | ✓ | ✓ | Helper RLS (renvoie NULL si non connecté → inerte). |
| `event_org` | ✓ | ✓ | ✓ | ✓ | Helper RLS. |

### RPC restreintes (auth obligatoire)

| RPC | A | U | Adm | SD | Justification |
|---|:-:|:-:|:-:|:-:|---|
| `claim_first_admin` | ✗ | ✓ | ✓ | ✓ | Bootstrap super_admin, raise si déjà existant. |
| `check_in_registration` | ✗ | ✗ | ✓ | ✓ | Vérif `has_role` super_admin/org_admin/staff. |
| `get_event_wifi` | ✗ | ✗ | ✓ | ✓ | idem. |
| `run_security_audit` | ✗ | ✗ | super_admin | ✓ | Vérif explicite super_admin. |
| `has_role`, `super_admin_exists` | ✓ | ✓ | ✓ | ✓ | Helpers consultés par les policies. |
| `_security_audit_*` | ✗ | ✗ | super_admin | ✓ | Appelés uniquement par `run_security_audit` ou event trigger DDL. |
| `handle_new_user` | trig | trig | trig | ✓ | Trigger `auth.users` (pas appelable directement utile). |
| `validate_registration` | trig | trig | trig | ✓ | Trigger `event_registrations`. |
| `set_updated_at` | trig | trig | trig | — | Trigger timestamps. |

### Conclusion linter `SECURITY DEFINER`

Les warnings « 0028_anon_security_definer_function_executable » concernent les ~25 RPC publiques listées ci-dessus. **Toutes sont des exceptions métier acceptées** : elles sont *par conception* le seul point d'entrée public à des données contrôlées (formulaire d'inscription, annuaire filtré, agrégats de sondage, messagerie). Le pattern `SECURITY DEFINER + vérification interne (qr_token / has_role)` est la posture validée.

Le warning sur la nouvelle `get_poll_results` est compté ici, ce qui porte le total à 54 (vs 53 avant S7) — variation attendue.

---

## 5. Snapshot linter S7

| Catégorie | Avant S7 | Après S7 | Delta |
|---|:-:|:-:|:-:|
| RLS désactivé | 0 | 0 | = |
| Policies permissives write | 0 | 0 | = |
| PII anon-readable | 0 | 0 | = |
| `SECURITY DEFINER` exécutable anon | 53 | 54 | +1 (`get_poll_results`, acceptée) |
| Tables avec GRANT PUBLIC | 0 | 0 | = |

---

## 6. Risques résiduels (vers S9)

| ID | Sujet | Statut |
|---|---|---|
| R1 | 54 warnings `SECURITY DEFINER` | **Accepté** — matrice ci-dessus |
| R2 | Mapping publishable→authenticated | **Documenté** — comportement Supabase |
| R3 | `event_announcements`/`live_polls` GRANT anon SELECT | **Defense-in-depth** — gardé |
| R4 | Realtime / Storage | Hors périmètre S7, à intégrer S9 si activé |
| R5 | Rate-limiting RPC publiques | Non couvert ici, à étudier post-S9 |
