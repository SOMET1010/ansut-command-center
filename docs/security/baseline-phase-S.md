# Phase S — Baseline sécurité (Lot S0)

Snapshot pris le **2026-06-08 21:49 UTC**.

Sources :
- `supabase--linter` → 59 warnings (catégorie SECURITY uniquement).
- `public._security_audit_compute()` → 11 issues internes.
- Export JSON brut : `docs/security/baseline-audit.json`.

---

## 1. Snapshot Supabase Linter (59 warnings)

| Code | Libellé | Occurrences |
|---|---|---|
| `0028_anon_security_definer_function_executable` | RPC `SECURITY DEFINER` exécutable par `anon` | **28** |
| `0029_authenticated_security_definer_function_executable` | RPC `SECURITY DEFINER` exécutable par `authenticated` | **31** |

**Lecture** : ce linter signale TOUTES les fonctions `SECURITY DEFINER` accessibles via l'API. La majorité sont **intentionnelles** dans cette architecture (parcours QR token anonyme : `register_for_event`, `cast_poll_vote`, `me_registration`, etc.). Le tri fin (légitime / à durcir / à révoquer) est l'objet du Lot S3.

Aucun warning sur : RLS désactivée, policy permissive, vue `security_definer`, `search_path` mutable, extensions, OTP, HIBP. Ces points sont déjà conformes au niveau linter ; S2 confirmera.

---

## 2. Audit interne (`_security_audit_compute`)

| Check | Compte | Détail |
|---|---|---|
| `rls_disabled_tables` | **0** | ✅ Toutes les tables `public.*` ont RLS activée |
| `permissive_write_policies` | **0** | ✅ Aucune policy INSERT/UPDATE/DELETE `qual=true` |
| `sensitive_columns_exposed_to_anon` | **4** | ⚠️ `profiles.email`, `profiles.phone`, `super_admin_bootstrap_emails.email`, `newsletter_subscribers.email` |
| `security_definer_callable_by_anon` (hors whitelist) | **7** | ⚠️ `check_in_registration`, `get_event_wifi`, `current_user_org`, `event_org`, `list_my_sent_meeting_recipients`, `get_or_create_conversation`, `_security_audit_on_ddl` |
| **Total issues** | **11** | |

---

## 3. Risques classés

### 🔴 CRITIQUE (action immédiate)

| # | Risque | Source | Impact si exploité |
|---|---|---|---|
| C1 | `newsletter_subscribers.email` exposé en SELECT à `anon` | GRANT public | Énumération mailing list complète |
| C2 | `profiles.email` + `profiles.phone` exposés à `anon` | GRANT public | Énumération PII de tous les utilisateurs back-office |
| C3 | `super_admin_bootstrap_emails.email` exposé à `anon` | GRANT public | Découverte des comptes pouvant devenir super_admin (cible d'attaque) |

➡ **Nouveau risque détecté** vs analyse pré-plan. Ces 3 points n'étaient pas connus avant S0 et **modifient l'ordre d'attaque recommandé** (voir §5).

### 🟠 ÉLEVÉ

| # | Risque | Source | Impact |
|---|---|---|---|
| H1 | `/networking/$slug` lit `event_registrations` en anon → 401, fonctionnalité cassée | Refactor RPC requis | Networking inopérant pour visiteurs anonymes (déjà identifié) |
| H2 | RPC `get_event_wifi` exécutable par `anon` (refusée à l'intérieur, mais bruit linter et surface d'attaque inutile) | EXECUTE grant | Faible (la fonction RAISE si rôle insuffisant), mais à révoquer |
| H3 | RPC `check_in_registration` exécutable par `anon` (RAISE interne, mais EXECUTE à révoquer) | EXECUTE grant | Idem H2 |
| H4 | `get_or_create_conversation` doublonne `start_conversation` et écrit sans contrôle qr_token | RPC obsolète | À révoquer/supprimer (S3) |

### 🟡 MOYEN

| # | Risque | Source | Impact |
|---|---|---|---|
| M1 | 59 warnings linter à trier (S2/S3) | Linter | Bruit, mais aucune fuite directe identifiée |
| M2 | Config Auth (HIBP, OTP) non vérifiée | Auth config | À confirmer en S8 |
| M3 | Helpers `current_user_org` / `event_org` exposés à `anon` (retournent uuid d'org) | EXECUTE grant | Très faible : pas de PII, mais à révoquer côté `anon` |
| M4 | Exports admin sans entrée `audit_trail` | Code applicatif | Conformité RGPD (S7) |

### 🟢 BAS

| # | Risque | Source | Impact |
|---|---|---|---|
| L1 | `_security_audit_on_ddl` listée callable anon (c'est un event trigger, pas une RPC ; faux positif de la whitelist) | Faux positif audit interne | Ajuster la whitelist du compute |
| L2 | `list_my_sent_meeting_recipients` non whitelistée (utilitaire qr_token légitime) | Faux positif | Ajouter à la whitelist |
| L3 | Préparation buckets Storage (Phase 4) | N/A | Préventif S6 |

---

## 4. Grille de sévérité de référence (utilisée pour la suite)

| Niveau | Définition | SLA correction |
|---|---|---|
| 🔴 Critique | Fuite PII confirmée, écriture publique non auth, élévation privilège | Lot suivant immédiat |
| 🟠 Élevé | Surface d'attaque exploitable, fonctionnalité cassée par config sécurité | Phase S obligatoire |
| 🟡 Moyen | Hygiène, conformité, durcissement | Phase S |
| 🟢 Bas | Faux positifs, préparation Phase 4, documentation | Phase S best effort |

---

## 5. Recommandation d'ordre d'attaque révisée

L'ordre validé reste valable, mais **les 3 risques CRITIQUE C1/C2/C3 doivent être traités au plus tôt**. Ils tombent naturellement dans le lot **S5 (GRANT)**, qui dans l'ordre validé arrive après S2/S3/S4.

**Deux options** :

### Option A — Respecter strictement l'ordre validé
S1 → S8 → S2 → S3 → S4 → **S5 (corrige C1/C2/C3)** → S7 → S6 → S9.
- ✔ Méthodique, dépendances respectées.
- ✖ C1/C2/C3 restent ouverts pendant 4 lots intermédiaires.

### Option B — Insérer un mini-lot « S1-bis » de révocation GRANT critique
Après S1, exécuter **uniquement** la révocation des SELECT anon sur :
- `newsletter_subscribers.email` (et autres colonnes inutiles)
- `profiles.*` (table entière n'a aucune raison d'être lue en anon)
- `super_admin_bootstrap_emails.*`
puis poursuivre S8 → S2 → ... → S5 (qui consolidera le reste).
- ✔ Ferme immédiatement les 3 fuites PII.
- ✔ Migrations rollback minimales (3 `GRANT SELECT` de réversion préparés).
- ✖ Touche aux GRANT plus tôt que prévu dans le plan.

**Recommandation Lovable : Option B**, car C1/C2/C3 sont des fuites PII réelles exploitables sans authentification. Vous gardez la main : choisissez A ou B avant de lancer S1.

---

## 6. Snapshot artefacts

- `docs/security/baseline-phase-S.md` (ce document)
- `docs/security/baseline-audit.json` (sortie brute `_security_audit_compute`)
- Référence linter : `tool-results://supabase--linter/20260608-214921-239184`
- Référence audit DB : table `public.security_audit_runs` (entrée `trigger_source='ddl'` la plus récente)

---

**Lot S0 — TERMINÉ.** En attente :
1. validation du livrable S0,
2. arbitrage Option A vs Option B,
3. autorisation explicite de démarrer S1.
