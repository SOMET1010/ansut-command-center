CREATE TABLE public.event_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_time TIMESTAMPTZ,
  proposed_location TEXT,
  message TEXT,
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_meetings_distinct_parties CHECK (requester_id <> recipient_id),
  CONSTRAINT event_meetings_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX event_meetings_event_id_idx ON public.event_meetings(event_id);
CREATE INDEX event_meetings_requester_id_idx ON public.event_meetings(requester_id);
CREATE INDEX event_meetings_recipient_id_idx ON public.event_meetings(recipient_id);

GRANT SELECT, INSERT, UPDATE ON public.event_meetings TO anon, authenticated;
GRANT ALL ON public.event_meetings TO service_role;

ALTER TABLE public.event_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select_all" ON public.event_meetings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "meetings_insert_all" ON public.event_meetings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "meetings_update_all" ON public.event_meetings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "meetings_delete_admin" ON public.event_meetings
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
  );

CREATE TRIGGER event_meetings_set_updated_at
  BEFORE UPDATE ON public.event_meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_match_recommendations(
  p_registration_id UUID,
  p_event_id UUID,
  p_limit INT DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
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
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT r.id, r.participant_category, r.interests
    FROM public.event_registrations r
    WHERE r.id = p_registration_id
  )
  SELECT
    r.id,
    r.full_name,
    r.email,
    COALESCE(r.organization, '') AS organization,
    COALESCE(r.position, '') AS job_title,
    COALESCE(r.country, '') AS country,
    COALESCE(r.bio, '') AS bio,
    COALESCE(r.photo_url, '') AS photo_url,
    r.participant_category,
    COALESCE(r.interests, ARRAY[]::TEXT[]) AS interests,
    COALESCE(r.linkedin_url, '') AS linkedin_url,
    (
      CASE WHEN r.participant_category IS DISTINCT FROM (SELECT participant_category FROM me) THEN 20 ELSE 0 END
      + COALESCE(cardinality(ARRAY(
          SELECT UNNEST(r.interests) INTERSECT SELECT UNNEST((SELECT interests FROM me))
        )), 0) * 10
    )::INT AS match_score
  FROM public.event_registrations r
  WHERE r.event_id = p_event_id
    AND r.id <> p_registration_id
    AND r.status = 'confirmed'
    AND r.is_visible_in_directory = true
  ORDER BY match_score DESC, r.full_name ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_match_recommendations(UUID, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_recommendations(UUID, UUID, INT) TO anon, authenticated, service_role;