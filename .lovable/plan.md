## Périmètre

Brancher la passerelle **ANSUT Hub** (skill `ansut-hub-notify`) pour envoyer **SMS + Email + WhatsApp + Telegram** sur trois événements métier. OTP de connexion **reporté** à un chantier ultérieur (table + edge fn déjà cadrées dans le skill `ansut-hub-otp`).

Secrets `ANSUT_HUB_URL / USERNAME / PASSWORD` déjà provisionnés ✓

## Architecture

```text
┌──────────────────────┐      ┌──────────────────┐       ┌──────────────┐
│ Trigger DB / Cron    │─────▶│ ansut-notify     │──────▶│ ANSUT Hub    │
│ (insert / update)    │      │ (edge function)  │       │ gouv.ci      │
└──────────────────────┘      └────────┬─────────┘       └──────────────┘
                                       │
                                       ▼
                               audit_trail (log)
```

Tous les envois passent par **une seule** edge function `ansut-notify` (single audit trail, single fallback). Aucun appel direct au Hub depuis ailleurs.

## Étape 1 — Infrastructure commune

1. **Table `audit_trail`** (si absente) + `notification_preferences` par participant (channels opt-in/opt-out).
2. **Edge function `ansut-notify`** (référence verbatim du skill, 356 lignes) — auth-gated (`admin` / `org_admin`), 4 canaux, fallback WhatsApp #131058 → texte, audit log silencieux.
3. **Helper TypeScript** `src/lib/notifications.ts` pour appeler `ansut-notify` depuis le code app (server fn) — déjà ébauché dans `src/lib/notifications.functions.ts`.

## Étape 2 — Inscription confirmée

Déclencheur : trigger SQL `AFTER INSERT ON event_registrations`.

- Edge function dédiée `notify-registration` invoquée via `pg_net` ou trigger HTTP.
- Construit le message : nom événement, date, lieu, **lien badge QR** (route publique `/badge/<qr_token>.png` — fonction `generate-badge` à créer si absente, ou utiliser `src/lib/badges.ts` existant).
- Envoie en **parallèle** SMS (ANSUT sender) + Email (HTML avec QR inline) + WhatsApp si template approuvé.

## Étape 3 — Check-in effectué

Déclencheur : modification de `check_in_registration` (RPC existante) — ajouter en fin de fonction un `INSERT` dans `notification_outbox` consommé par `process-notification-queue`.

- Message court : « Bienvenue {nom}, votre check-in à {event} est confirmé. »
- Canaux : SMS uniquement (rapide, in-event).

## Étape 4 — Rappel J-1

Déclencheur : `pg_cron` quotidien à 09:00 Africa/Abidjan.

```sql
SELECT cron.schedule('event-reminders-jminus1', '0 9 * * *', $$
  SELECT net.http_post(
    url := 'https://…/functions/v1/event-reminder-cron',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  );
$$);
```

Edge function `event-reminder-cron` :
1. Fetch toutes les inscriptions des événements démarrant **demain**.
2. Pour chacune, invoque `ansut-notify` (SMS + Email).
3. Log dans `audit_trail` avec `action: 'REMINDER_J1_SENT'`.

## Étape 5 — UI cockpit

- **Page `/notifications`** dans le cockpit : timeline des envois (depuis `audit_trail`), filtres par canal/statut, bouton "Renvoyer".
- **Préférences participant** sur la page d'inscription publique : checkboxes opt-in SMS/Email/WhatsApp.
- **Test manuel** : bouton "Envoyer test" sur la page event (admin only).

## Étape 6 — Templates WhatsApp

Action `list_templates` exposée dans `ansut-notify` → UI admin pour visualiser les templates approuvés Meta. Création des templates côté Hub gouv.ci (hors plateforme — instruction utilisateur).

## Étape 7 — Tests

- Unit tests pour le helper `notifications.ts` (mock fetch vers ansut-notify).
- E2E Playwright : déclencher une inscription test → vérifier qu'une entrée `audit_trail.NOTIFY_SENT` apparaît (Hub mocké en preview).
- Test manuel cockpit : envoyer un SMS/Email à un numéro de test pour valider la chaîne complète.

## Détails techniques

- **Pas de `Deno`** dans le runtime moderne — on déploie via `supabase--deploy_edge_functions` (Deno côté Supabase Edge Functions, c'est OK).
- **Audit trail** : table `audit_trail (id, table_name, action, payload jsonb, user_id, created_at)`.
- **Idempotence** : clé `notification_outbox.idempotency_key = '{purpose}:{registration_id}'` pour éviter doublons sur retry pg_cron.
- **Rate limit Hub** : pas de cap connu, mais on bufferise via `notification_outbox` consommé en lot (max 50/min).
- **Numéros téléphone** : normalisation E.164 côté trigger (préfixe +225 par défaut si absent).
- **Erreurs Hub** : non-bloquantes pour le métier ; remontées dans `audit_trail.payload->>'error'` + toast cockpit.

## Hors périmètre (chantiers suivants)

- OTP de connexion 2FA (skill `ansut-hub-otp` séparé).
- Templates WhatsApp à faire approuver côté Meta (action utilisateur DSIS).
- Marketing / newsletter de masse (interdit par les guidelines — utiliser Lovable Emails dédié si besoin un jour).

## Question avant exécution

Le plan a 7 étapes et touche DB + edge functions + cron + UI cockpit. Je propose d'**exécuter en 3 vagues** :

1. **Vague 1 (fondations)** : `ansut-notify` + `audit_trail` + helper + UI test manuel.
2. **Vague 2 (triggers)** : inscription confirmée + check-in.
3. **Vague 3 (cron)** : rappel J-1 + page `/notifications` cockpit.

Validez-vous ce plan et l'ordre des vagues ? On démarre par la Vague 1 ?
