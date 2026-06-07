## Seed SUTEL 2026 — Plan d'exécution

Objectif : insérer en base les **1 organisation + 4 événements + 10 inscriptions** réelles SUTEL 2026, puis vérifier le rendu UI. Aucune modification de schéma ni de composant React — tout passe par des opérations data sur les tables existantes.

### Ajustements vs spec utilisateur (contraintes schéma actuel)

Le schéma déjà en place impose 3 petites adaptations par rapport au SQL fourni :

1. `organizations.id` est de type **uuid** — l'identifiant texte `org_ansut_sutel_2026` est invalide. Je génère un uuid stable côté SQL (`gen_random_uuid()`) et le réutilise via une CTE pour les 4 événements. Le `slug` (NOT NULL) sera `ansut`.
2. `event_registrations` a une colonne **`position`** (pas `job_title`). Je mappe le poste sur `position`.
3. `events.created_by` reste `NULL` (seed admin, pas d'auth.uid() disponible côté outil).

Tout le reste (capacité 200, statut `published`, dates UTC, descriptions complètes avec thème SUTEL 3 en tête du Jour 1) est conservé à l'identique.

### Étape 1 — Insertion organisation + 4 événements

Une seule transaction SQL via l'outil `supabase--insert` :

```text
WITH org AS (
  INSERT INTO organizations (name, slug) VALUES ('ANSUT — …', 'ansut')
  RETURNING id
)
INSERT INTO events (organization_id, name, slug, description, location,
                    starts_at, ends_at, capacity, status)
SELECT org.id, ... FROM org
UNION ALL ... (4 lignes)
RETURNING id, slug;
```

Événements seedés :
- `sutel-2026-accueil` — 21/09/2026 09h→20h
- `sutel-2026-jour1` — 22/09/2026 (description préfixée du thème officiel + co-organisateurs + Sénégal pays à l'honneur)
- `sutel-2026-jour2` — 23/09/2026
- `sutel-2026-jour3` — 24/09/2026

### Étape 2 — Insertion 10 inscriptions de test

Via `supabase--insert`, un seul `INSERT … SELECT` qui répartit les 10 participants sur les 4 événements (≈ 2-3 par événement, Jour 1 le plus chargé). J'utilise les 10 profils fournis (Amadou Diallo, Fatou Koné, Ibrahim Touré, etc.) en mappant `job_title → position`. Status = `confirmed`, `qr_token` généré par défaut.

Note : la RPC `register_for_event` est `SECURITY DEFINER` mais déclenche `validate_registration` (capacité OK, status published OK). Je l'utilise pas — `INSERT` direct est plus simple et déterministe pour 10 lignes contrôlées, et la contrainte capacité (10/200 = 5%) est largement satisfaite.

### Étape 3 — Vérifications post-seed

Trois requêtes `supabase--read_query` :

1. `SELECT slug, name, status, capacity FROM events ORDER BY starts_at` → confirme 4 lignes publiées.
2. `SELECT e.slug, count(r.id) FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id GROUP BY e.slug` → confirme les compteurs par événement.
3. `SELECT count(*) FROM event_registrations` → doit retourner 10.

Puis vérification visuelle dans le preview :
- `/events` (cockpit) — 4 cartes avec compteurs.
- `/e/sutel-2026-jour1` — page publique avec titre, description, dates, formulaire d'inscription.
- `/dashboard` — KPI dynamiques (4 événements, 10 inscrits, J-X vers 21/09/2026).
- AlertBanner absent (10/200 = 5%, seuil 70%).

### Notes techniques

- Pas de migration nécessaire (aucun changement de schéma).
- Pas de modification de code React (les pages lisent déjà depuis Supabase).
- Phones conservés au format international fourni (toutes les longueurs ≤ 32, OK avec la contrainte RLS).
- Emails passent la regex RLS (`^...@...\..+$`).
- Idempotence : si l'on relance, le slug `ansut` violera l'unicité — relance = nettoyage manuel attendu, je n'ajoute pas de `ON CONFLICT` sauf demande.

### Risques / questions ouvertes

- **Slug org** : j'ai choisi `ansut` (court, propre). Si vous préférez `ansut-sutel-2026`, dites-le avant que j'exécute.
- **created_by NULL** sur les événements : acceptable pour un seed ; les politiques RLS d'écriture admin restent inchangées.
- **Pas de seed user_roles** : aucun compte de test n'est créé. Si vous voulez aussi un compte admin de démo, c'est une étape supplémentaire à valider.

Dites-moi si on part comme ça ou si vous voulez ajuster le slug org / ajouter un compte de démo, et je bascule en build pour exécuter.