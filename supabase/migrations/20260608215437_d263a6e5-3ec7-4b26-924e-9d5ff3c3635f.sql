-- =========================================================
-- Phase S — Lot S1 : Correctif /networking/$slug (401 anon)
-- =========================================================
-- Objectif : permettre la lecture publique de l'annuaire SANS
-- exposer email, phone, qr_token ni autre PII présente dans
-- public.event_registrations. La table reste fermée à anon.
--
-- Stratégie : nouvelle RPC SECURITY DEFINER qui ne retourne
-- que les colonnes publiques déjà destinées à l'annuaire.
-- =========================================================

CREATE OR REPLACE FUNCTION public.list_event_networking(
  p_slug text,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  organization text,
  "position" text,
  country text,
  bio text,
  photo_url text,
  interests text[],
  participant_category text,
  linkedin_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.full_name,
    r.organization,
    r."position",
    r.country,
    r.bio,
    r.photo_url,
    r.interests,
    r.participant_category,
    r.linkedin_url
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE e.slug = p_slug
    AND e.status = 'published'
    AND r.is_visible_in_directory = true
    AND r.status = 'confirmed'
    AND (p_category IS NULL OR p_category = 'all' OR r.participant_category = p_category)
  ORDER BY r.full_name ASC
$$;

-- Lecture publique explicite : c'est l'annuaire visible.
REVOKE ALL ON FUNCTION public.list_event_networking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_event_networking(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.list_event_networking(text, text) IS
'Phase S/S1 — Annuaire networking public d''un événement publié. Retourne uniquement les colonnes publiques (aucune PII : pas d''email, phone, qr_token). Filtre interne : event.status=published, registration.is_visible_in_directory=true, status=confirmed.';

-- =========================================================
-- ROLLBACK (à exécuter en cas de régression)
-- =========================================================
-- DROP FUNCTION IF EXISTS public.list_event_networking(text, text);
-- =========================================================
