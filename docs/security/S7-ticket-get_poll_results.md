# S7 — Ticket : RPC `get_poll_results(p_poll_id)`

**Origine** : arbitrage S5 Famille 2 (live_poll_votes différé).
**Type** : sécurité (defense-in-depth) **+** correctif fonctionnel.
**Priorité** : haute.

## Contexte

Pendant l'exécution de S5 Famille 2 partielle, vérification GRANTs sur `live_poll_votes` :
- ACL anon = `Dxtm` (DELETE, TRUNCATE, TRIGGER, MAINTAIN) — **pas de SELECT**.
- Deux routes publiques lisent pourtant cette table directement via `supabase.from("live_poll_votes").select("answer")` :
  - `src/routes/poll.$pollId.tsx` lignes 100-103 — affichage résultats après vote.
  - `src/routes/live.$sessionId.tsx` lignes 130-133 — compteur votes écran régie temps réel.
- Les appels échouent en **401 silencieux** côté visiteur anonyme — résultats jamais affichés.

## Objectif

1. Créer une RPC `SECURITY DEFINER` `get_poll_results(p_poll_id uuid)` retournant **uniquement** les agrégats :
   - `total_votes int`
   - `counts jsonb` — `{ "option_label_or_value": count }`
   - aucune ligne brute, aucun `participant_id`.
2. Vérifier dans le handler que le sondage existe et appartient à un événement publié (pas de fuite d'infos sur sondages internes).
3. Refactorer les 2 routes pour appeler la RPC au lieu du `from("live_poll_votes")`.
4. Confirmer que `live_poll_votes` n'a plus aucune lecture directe côté frontend.
5. (Optionnel S7) Révoquer les résidus ACL `Dxtm` sur `live_poll_votes` pour anon → `REVOKE ALL ON public.live_poll_votes FROM anon`.

## Critères d'acceptation

- `/poll/$pollId` affiche les résultats post-vote pour un visiteur anonyme identifié par QR token.
- `/live/$sessionId` affiche le décompte de votes en temps réel sans session authentifiée.
- `rg "from\\(\"live_poll_votes\"" src/` ne renvoie plus aucun résultat.
- `live_poll_votes` ACL anon = vide.

## Squelette SQL proposé

```sql
CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_status text;
  v_counts jsonb;
  v_total int;
BEGIN
  SELECT e.status INTO v_event_status
  FROM public.live_polls p
  JOIN public.event_sessions s ON s.id = p.session_id
  JOIN public.events e ON e.id = s.event_id
  WHERE p.id = p_poll_id;

  IF v_event_status IS NULL OR v_event_status <> 'published' THEN
    RETURN jsonb_build_object('total_votes', 0, 'counts', '{}'::jsonb);
  END IF;

  SELECT count(*),
         COALESCE(jsonb_object_agg(ans, c), '{}'::jsonb)
    INTO v_total, v_counts
  FROM (
    SELECT CASE
             WHEN jsonb_typeof(answer) = 'string' THEN trim(both '"' from answer::text)
             ELSE answer::text
           END AS ans,
           count(*) AS c
    FROM public.live_poll_votes
    WHERE poll_id = p_poll_id
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object('total_votes', COALESCE(v_total, 0), 'counts', COALESCE(v_counts, '{}'::jsonb));
END;
$$;
```

## Rappel principe

Pas de lecture brute publique des votes. Toute exposition publique doit passer par un agrégat contrôlé.

---

## Point complémentaire — comportement SELECT `events`

Observé pendant S5 Famille 3 :
- `has_table_privilege('anon','public.events','SELECT')` → **false**
- `relacl` de `events` ne contient pas `r` pour `anon`
- Pourtant `curl /rest/v1/events?status=eq.published` avec la publishable key répond **200 avec données**.

Hypothèse : la couche PostgREST + publishable key contourne `has_table_privilege` standard, ou applique une autorisation au niveau policy `roles:{public}` indépendamment du GRANT relationnel. À clarifier en S7 :
1. Reproduire avec `psql` en `SET ROLE anon` (devrait échouer).
2. Reproduire via curl avec ancien `anon` JWT (devrait également passer).
3. Conclure : effet publishable key, effet PostgREST, ou inheritance de rôle ?
4. Si effet structurel : documenter ; si bug local : créer le GRANT SELECT explicite (cohérent avec policy intentionnelle).
