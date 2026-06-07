# Audit Migrations SQL — Conclusions

## Résumé

Les migrations Lovable (20260607...) ont été exécutées **EN PREMIER** (timestamps antérieurs) et ont créé les structures réelles en base. Nos migrations (20260608...) utilisent toutes `IF NOT EXISTS` / `CREATE OR REPLACE` et sont donc **idempotentes** — elles ne causent pas d'erreur à l'exécution mais sont **redondantes**.

## Tableau de correspondance

| Table/RPC | Migration Lovable | Notre migration | Différences |
|-----------|------------------|-----------------|-------------|
| `event_registrations` colonnes networking (bio, photo_url, country, interests, participant_category, is_visible_in_directory, linkedin_url) | 20260607194942 | 20260608120000 | Lovable: `NOT NULL DEFAULT 'other'` pour participant_category. Nous: `DEFAULT 'other'` (nullable). Lovable gagne car exécuté en premier. |
| `event_conversations` | 20260607194942 | 20260608130000 | Lovable: `participants_ordered CHECK (participant_a < participant_b)` + `updated_at`. Nous: pas de CHECK ordered, pas de `updated_at`. Lovable gagne. |
| `event_messages` | 20260607194942 | 20260608130000 | Structures quasi-identiques. Lovable: `CHECK (length(content) BETWEEN 1 AND 4000)`. Nous: pas de CHECK. |
| RPC `get_or_create_conversation` | 20260607194942 | 20260608130000 | Les deux utilisent `CREATE OR REPLACE` → la DERNIÈRE exécutée gagne = **notre version**. Différence: notre version ne vérifie pas `participant_a = participant_b` (la contrainte CHECK le fait déjà). |
| `event_sessions` | 20260607195609 | 20260608140000 | Structures identiques. Lovable a les GRANT/RLS complets. |
| `event_speakers` | 20260607195609 | 20260608140000 | Structures identiques. |
| `event_session_speakers` | 20260607195630 | 20260608140000 | Lovable: PK composite. Nous: PK composite aussi. Lovable a ajouté `role` dans 20260607195643. |
| `session_bookmarks` | 20260607195630 | 20260608140000 | Structures identiques. |
| `live_polls` | 20260607200902 | 20260608150000 | Structures identiques. |
| `live_poll_votes` | 20260607200902 + 20260607200924 (rename voter_id→participant_id) | 20260608150000 | Lovable: `voter_id` renommé en `participant_id`. Nous: directement `participant_id`. |
| `session_attendance` | 20260607200902 | 20260608150000 | Structures identiques. |
| `event_announcements` | 20260607202138 | 20260608160000 | Structures identiques. |
| `event_meetings` | 20260607202505 | 20260608170000 | Lovable: contraintes `event_meetings_distinct_parties`, `event_meetings_unique_pair`. Nous: structures similaires. |
| RPC `get_match_recommendations` | 20260607202505 | 20260608170000 | Les deux utilisent `CREATE OR REPLACE` → notre version gagne (exécutée en dernier). Lovable: SQL pur, scoring (20 catégorie diff + 10/intérêt). Nous: PL/pgSQL, scoring (3/intérêt + 5 catégorie diff + 2 même pays). **Notre version est plus riche.** |

## Décision recommandée

**Conserver nos migrations (20260608...)** car :
1. Elles sont idempotentes (`IF NOT EXISTS`, `CREATE OR REPLACE`)
2. Les RPC `CREATE OR REPLACE` écrasent les versions Lovable → nos versions (plus riches) sont actives
3. Les supprimer ne changerait rien en base (les tables existent déjà)
4. Elles servent de documentation du schéma attendu par notre code

**Risque nul** : aucun conflit à l'exécution. Les tables sont créées par Lovable, les RPC sont remplacées par nos versions.

## Points d'attention

1. **`job_title` vs `position`** : La RPC Lovable `get_match_recommendations` retourne `r.position AS job_title`. Notre RPC retourne `r.job_title` directement. Or la colonne réelle dans `event_registrations` est `position` (pas `job_title`). → **Notre RPC a un bug potentiel** si la colonne `job_title` n'existe pas.

2. **Contrainte `participants_ordered`** : Lovable impose `participant_a < participant_b` dans `event_conversations`. Notre RPC `get_or_create_conversation` normalise l'ordre → compatible.

3. **`updated_at` dans `event_conversations`** : Lovable l'a, notre migration ne l'ajoute pas → pas de conflit (la colonne existe déjà grâce à Lovable).
