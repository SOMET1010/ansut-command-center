-- =========================================================================
-- Lot S3 — Restrictions SECURITY DEFINER (B1, B2, B3, B4, A21, A22)
-- =========================================================================

-- ---- B1 : check_in_registration → authenticated only -------------------
REVOKE EXECUTE ON FUNCTION public.check_in_registration(uuid) FROM anon;

-- ---- B2 : get_event_wifi → authenticated only --------------------------
REVOKE EXECUTE ON FUNCTION public.get_event_wifi(uuid) FROM anon;

-- ---- B4 : _security_audit_on_ddl → interne uniquement ------------------
REVOKE EXECUTE ON FUNCTION public._security_audit_on_ddl() FROM anon, authenticated;

-- ---- B3 : get_or_create_conversation → supprimée (doublon non sécurisé)
--      Appelant unique (src/routes/messages.$slug.tsx) refactoré pour
--      utiliser start_conversation(p_qr_token, p_other_participant_id).
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid, uuid);

-- ---- A22 : _reg_from_token → plus exposé via API -----------------------
--      Les autres fonctions SECURITY DEFINER l'invoquent en tant que owner,
--      donc le REVOKE ne casse PAS leur exécution.
REVOKE EXECUTE ON FUNCTION public._reg_from_token(uuid) FROM anon, authenticated;

-- ---- A21 : refonte get_match_recommendations sur qr_token --------------
--      Ancien contrat : (p_registration_id, p_event_id, p_limit)
--      → Un anon pouvait demander les recommandations de n'importe qui.
--      Nouveau contrat : (p_qr_token, p_limit) → résolution serveur.
DROP FUNCTION IF EXISTS public.get_match_recommendations(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_match_recommendations(
  p_qr_token uuid,
  p_limit integer DEFAULT 15
)
RETURNS TABLE (
  id uuid,
  full_name text,
  organization text,
  job_title text,
  country text,
  bio text,
  photo_url text,
  participant_category text,
  interests text[],
  linkedin_url text,
  match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg_id uuid;
  v_event_id uuid;
  v_interests TEXT[];
  v_category TEXT;
  v_country TEXT;
BEGIN
  -- Résolution serveur : qr_token → registration (ownership garanti)
  SELECT r.id, r.event_id, r.interests, r.participant_category, r.country
    INTO v_reg_id, v_event_id, v_interests, v_category, v_country
  FROM public.event_registrations r
  WHERE r.qr_token = p_qr_token;

  IF v_reg_id IS NULL THEN
    RAISE EXCEPTION 'Code badge invalide';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.full_name,
    COALESCE(r.organization, '')::TEXT,
    COALESCE(r.position, '')::TEXT,
    COALESCE(r.country, '')::TEXT,
    COALESCE(r.bio, '')::TEXT,
    COALESCE(r.photo_url, '')::TEXT,
    r.participant_category,
    COALESCE(r.interests, ARRAY[]::TEXT[]),
    COALESCE(r.linkedin_url, '')::TEXT,
    (
      COALESCE(array_length(
        ARRAY(SELECT unnest(r.interests) INTERSECT SELECT unnest(v_interests)),
        1
      ), 0) * 3
      + CASE WHEN r.participant_category IS DISTINCT FROM v_category THEN 5 ELSE 0 END
      + CASE WHEN r.country = v_country THEN 2 ELSE 0 END
    )::INT AS match_score
  FROM public.event_registrations r
  WHERE r.event_id = v_event_id
    AND r.id <> v_reg_id
    AND r.is_visible_in_directory = TRUE
    AND r.status = 'confirmed'
    AND r.id NOT IN (
      SELECT m.recipient_id FROM public.event_meetings m
      WHERE m.requester_id = v_reg_id AND m.event_id = v_event_id
    )
  ORDER BY match_score DESC, r.full_name ASC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_match_recommendations(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_recommendations(uuid, integer) TO anon, authenticated, service_role;