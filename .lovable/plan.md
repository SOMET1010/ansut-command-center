# Phase S — Sécurité & Gouvernance

Phase exclusivement backend / configuration. Aucune modification UX, aucune modification de flux métier, aucune refonte visuelle. Chaque lot est livré avec : findings, correctifs SQL/code, tests de non-régression, et rapport de clôture.

---

## Lot S0 — Cadre & outillage (préalable)

- Lancer `supabase--linter` + `_security_audit_compute()` (déjà en place) et figer un **rapport baseline** (snapshot initial).
- Activer la table `security_audit_runs` comme référence avant/après chaque lot.
- Définir la grille de sévérité : **Critique** (fuite données / écriture publique), **Élevé** (PII exposée, RPC anon), **Moyen** (config), **Bas** (hygiène).

Livrable : `docs/security/baseline-phase-S.md` + export JSON du rapport initial.

---

## Lot S1 — Correctif `/networking/$slug` (401 anon)

**Cause connue** : `event_registrations` n'autorise pas `anon` en SELECT (et ne doit pas — contient email, phone, qr_token). Le composant networking lit directement la table.

**Correctif** :
1. Créer une RPC `SECURITY DEFINER` : `public.list_event_networking(p_slug text, p_category text default null)` retournant **uniquement** les colonnes publiques : `id, full_name, organization, position, country, bio, photo_url, interests, participant_category, linkedin_url`.
2. Filtres internes : `events.status='published'` + `is_visible_in_directory=true` + `status='confirmed'`.
3. `GRANT EXECUTE ... TO anon, authenticated`.
4. Refactor `src/routes/networking.$slug.tsx` pour appeler la RPC via `supabase.rpc(...)` au lieu d'un `.from('event_registrations').select(...)`.
5. Vérifier qu'aucune autre route publique (`agenda`, `matchmaking`, `e.$slug`, `annonces`, `rdv`, `messages`) ne lit directement `event_registrations` en anon — sinon même traitement.

**Tests** : page networking charge en anon, aucune colonne sensible exposée, comportement identique pour utilisateur connecté.

---

## Lot S2 — Revue des warnings Supabase Linter

- Exécuter `supabase--linter`, classer les ~59 warnings préexistants.
- Pour chaque finding : action **fix / ignore documenté / accepter risque**.
- Cibles prioritaires :
  - `function_search_path_mutable` → ajouter `SET search_path = public` sur toute fonction qui n'en a pas.
  - `security_definer_view` → convertir en `security_invoker=on` si possible.
  - `auth_otp_long_expiry`, `auth_leaked_password_protection` → activer HIBP + raccourcir OTP via `supabase--configure_auth`.
  - `extension_in_public` → déplacer extensions hors `public` si applicable.

Livrable : tableau finding → décision → migration appliquée.

---

## Lot S3 — Audit RPC (fonctions exposées)

Inventaire de toutes les `SECURITY DEFINER` callables par `anon` / `authenticated` (la liste blanche de `_security_audit_compute` donne déjà 24 fonctions autorisées).

Pour chaque RPC :
- vérifier que `auth.uid()` ou un `qr_token` est requis avant toute écriture ;
- vérifier les bornes (`length`, `IN (...)`) déjà présentes ;
- vérifier qu'aucune RPC ne renvoie de colonnes sensibles (`email`, `phone`, `qr_token`, `wifi_password`) à `anon` ;
- ajouter rate-limit applicatif côté front pour `register_for_event`, `cast_poll_vote`, `create_meeting_request`, `send_conversation_message` (anti-spam basique, debounce + désactivation bouton).

Livrable : `docs/security/rpc-matrix.md` (RPC × rôle × données retournées).

---

## Lot S4 — Audit RLS table par table

Pour les 21 tables `public.*` :
- table a-t-elle RLS activée ? (le rapport audit le confirme)
- chaque commande (SELECT/INSERT/UPDATE/DELETE) a-t-elle une policy explicite ?
- aucune policy permissive `USING (true)` / `WITH CHECK (true)` sur INSERT/UPDATE/DELETE sauf justification ;
- les tables sensibles (`event_registrations`, `event_messages`, `event_meetings`, `live_poll_votes`, `notification_outbox`, `audit_trail`, `user_roles`, `profiles`) sont vérifiées en priorité ;
- `user_roles` : confirmer qu'aucun utilisateur ne peut s'auto-attribuer un rôle (hors `claim_first_admin` qui est gardée).

Livrable : `docs/security/rls-matrix.md` + migrations correctives groupées.

---

## Lot S5 — Audit GRANT (anon / authenticated / service_role)

- Pour chaque table publique, lister les GRANT effectifs (`information_schema.role_table_grants`).
- Règle : `anon` ne reçoit `SELECT` **que** sur les tables réellement publiques (events publiés, sessions, annonces, speakers). Jamais sur `event_registrations`, `event_messages`, `event_meetings`, `live_poll_votes`, `notification_outbox`, `audit_trail`, `user_roles`, `profiles`.
- `authenticated` : `SELECT/INSERT/UPDATE/DELETE` filtrés par RLS.
- `service_role` : `ALL` partout.

Livrable : migration consolidée des GRANT corrigés.

---

## Lot S6 — Audit Storage buckets

État actuel : **aucun bucket**.

- Confirmer qu'aucun upload n'est attendu en Phase 3 (photos profil, logos events, exports PDF).
- Si la Phase 4 introduit des uploads, préparer un **template de bucket sécurisé** : privé par défaut, policies par `auth.uid()`, signed URLs, limite MIME + taille.

Livrable : `docs/security/storage-policy-template.md` (prêt à appliquer en Phase 4, pas appliqué maintenant).

---

## Lot S7 — Exports & données sensibles

- Revue de `exports.tsx` et de la fonction d'export participants : confirmer que seuls `super_admin`, `org_admin`, `staff` peuvent exporter, et seulement sur leurs propres événements.
- Vérifier qu'aucun export public ne contient `email`, `phone`, `qr_token`.
- Ajouter une entrée `audit_trail` `action='EXPORTED'` à chaque export (traçabilité RGPD).
- Vérifier que `wifi_password` / `wifi_ssid` ne fuitent que via `get_event_wifi` (déjà gardé).

Livrable : checklist RGPD signée + trigger d'audit export.

---

## Lot S8 — Auth & configuration projet

- Activer **Leaked Password Protection** (HIBP).
- Vérifier OTP expiry ≤ 1h.
- Vérifier que **signups anonymes** sont désactivés.
- Vérifier providers actifs (Google + email/password uniquement, pas plus).
- Vérifier redirect URLs autorisées (preview + published + custom domain si présent).

Livrable : capture de la config auth finale + migration `configure_auth`.

---

## Lot S9 — Rapport de clôture Phase S

- Re-run `supabase--linter` + `_security_audit_compute()` → comparer au baseline S0.
- Tous les findings doivent être : **corrigés**, **acceptés avec justification écrite**, ou **planifiés Phase 4**.
- Document final : `docs/security/phase-S-closure.md` avec :
  - liste des migrations appliquées,
  - delta findings avant/après,
  - matrice RLS / GRANT / RPC,
  - registre des décisions « accepter le risque ».

---

## Contraintes transverses Phase S

- **Aucune** modification UX, aucune refonte visuelle, aucun changement de copie.
- **Aucune** modification des règles métier (capacité, statuts, workflow inscription).
- **Aucune** modification des flux d'authentification utilisateurs (pas de logout forcé, pas de changement de session).
- Toute migration est **réversible** ou documentée comme non-réversible avec justification.
- Chaque lot se termine par un test de non-régression sur les parcours clés : inscription événement, check-in QR, messagerie, sondages, networking, exports.

---

## Ordre d'exécution proposé

1. S0 (baseline) → S1 (quick win networking 401) → S8 (config auth, gains immédiats).
2. S2 (warnings linter) → S3 (RPC) → S4 (RLS) → S5 (GRANT).
3. S6 (préparation Phase 4) → S7 (exports/RGPD).
4. S9 (clôture + handover Phase 4).

Estimation : 4 à 6 itérations de validation utilisateur, chaque lot livré indépendamment pour validation incrémentale.

---

**En attente de votre validation sur ce plan avant toute intervention backend.**
Si vous souhaitez ajuster le périmètre (ajouter pentest externe, exclure un lot, prioriser différemment), indiquez-le et je révise le plan.