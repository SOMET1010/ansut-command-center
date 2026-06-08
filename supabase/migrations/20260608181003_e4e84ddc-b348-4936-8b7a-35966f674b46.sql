
DROP FUNCTION IF EXISTS public.get_match_recommendations(UUID, UUID, INT);

CREATE OR REPLACE FUNCTION public.get_match_recommendations(
  p_registration_id UUID,
  p_event_id UUID,
  p_limit INT DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  organization TEXT,
  job_title TEXT,
  country TEXT,
  bio TEXT,
  photo_url TEXT,
  participant_category TEXT,
  interests TEXT[],
  linkedin_url TEXT,
  match_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interests TEXT[];
  v_category TEXT;
BEGIN
  SELECT r.interests, r.participant_category
  INTO v_interests, v_category
  FROM public.event_registrations r
  WHERE r.id = p_registration_id;

  RETURN QUERY
  SELECT
    r.id,
    r.full_name,
    COALESCE(r.organization, '')::TEXT AS organization,
    COALESCE(r.position, '')::TEXT AS job_title,
    COALESCE(r.country, '')::TEXT AS country,
    COALESCE(r.bio, '')::TEXT AS bio,
    COALESCE(r.photo_url, '')::TEXT AS photo_url,
    r.participant_category,
    COALESCE(r.interests, ARRAY[]::TEXT[]) AS interests,
    COALESCE(r.linkedin_url, '')::TEXT AS linkedin_url,
    (
      COALESCE(array_length(
        ARRAY(SELECT unnest(r.interests) INTERSECT SELECT unnest(v_interests)),
        1
      ), 0) * 3
      + CASE WHEN r.participant_category IS DISTINCT FROM v_category THEN 5 ELSE 0 END
      + CASE WHEN r.country = (SELECT reg.country FROM public.event_registrations reg WHERE reg.id = p_registration_id) THEN 2 ELSE 0 END
    )::INT AS match_score
  FROM public.event_registrations r
  WHERE r.event_id = p_event_id
    AND r.id <> p_registration_id
    AND r.is_visible_in_directory = TRUE
    AND r.status = 'confirmed'
    AND r.id NOT IN (
      SELECT m.recipient_id FROM public.event_meetings m
      WHERE m.requester_id = p_registration_id AND m.event_id = p_event_id
    )
  ORDER BY match_score DESC, r.full_name ASC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_match_recommendations(UUID, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_recommendations(UUID, UUID, INT) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "live_poll_votes_select_public" ON public.live_poll_votes;

CREATE POLICY "live_poll_votes_select_admin"
  ON public.live_poll_votes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

REVOKE SELECT ON public.live_poll_votes FROM anon;

DROP POLICY IF EXISTS "session_attendance_select_public" ON public.session_attendance;

CREATE POLICY "session_attendance_select_admin"
  ON public.session_attendance FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

REVOKE SELECT ON public.session_attendance FROM anon;

REVOKE SELECT ON public.event_registrations FROM anon;

GRANT SELECT (
  id,
  event_id,
  full_name,
  organization,
  position,
  bio,
  photo_url,
  linkedin_url,
  interests,
  participant_category,
  is_visible_in_directory,
  status,
  created_at
) ON public.event_registrations TO anon;
