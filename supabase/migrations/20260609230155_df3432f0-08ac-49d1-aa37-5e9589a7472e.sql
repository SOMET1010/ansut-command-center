-- S7 - RPC d'agrégation pour résultats de sondages
-- Remplace les lectures directes de live_poll_votes par un agrégat anonymisé.
-- SECURITY DEFINER : contourne RLS pour calculer des comptes, ne retourne jamais
-- les votes bruts (pas de participant_id, pas de timestamp individuel).

CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_counts jsonb;
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.live_polls WHERE id = p_poll_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_poll');
  END IF;

  SELECT COUNT(*)::int INTO v_total
  FROM public.live_poll_votes
  WHERE poll_id = p_poll_id;

  -- Agrégat clé→count à partir de answer (jsonb).
  -- Pour les réponses multi (jsonb array), on dépile chaque option.
  WITH expanded AS (
    SELECT
      CASE
        WHEN jsonb_typeof(answer) = 'array' THEN
          (SELECT jsonb_array_elements_text(answer))
        WHEN jsonb_typeof(answer) = 'string' THEN
          trim(both '"' from answer::text)
        ELSE answer::text
      END AS key
    FROM public.live_poll_votes
    WHERE poll_id = p_poll_id
  )
  SELECT COALESCE(jsonb_object_agg(key, c), '{}'::jsonb) INTO v_counts
  FROM (
    SELECT key, COUNT(*)::int AS c
    FROM expanded
    GROUP BY key
  ) t;

  RETURN jsonb_build_object(
    'ok', true,
    'total_votes', v_total,
    'counts', COALESCE(v_counts, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_poll_results(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_poll_results(uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_poll_results(uuid) IS
'S7: agrégat public des résultats de sondage. SECURITY DEFINER. Ne retourne jamais les votes bruts.';