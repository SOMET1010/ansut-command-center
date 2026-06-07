-- ============================================================
-- Table: event_meetings
-- Demandes de rendez-vous bilatérales entre participants
-- ============================================================

CREATE TABLE IF NOT EXISTS event_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  proposed_time TIMESTAMPTZ,
  proposed_location TEXT,
  message TEXT,
  response_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  -- Un participant ne peut pas envoyer deux demandes au même destinataire pour le même événement
  CONSTRAINT unique_meeting_request UNIQUE (event_id, requester_id, recipient_id),
  -- Un participant ne peut pas se demander un RDV à lui-même
  CONSTRAINT no_self_meeting CHECK (requester_id != recipient_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_meetings_requester ON event_meetings(requester_id, status);
CREATE INDEX idx_meetings_recipient ON event_meetings(recipient_id, status);
CREATE INDEX idx_meetings_event ON event_meetings(event_id, created_at DESC);

-- RLS : accès public (identification par qr_token côté application)
ALTER TABLE event_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings lisibles par tous (filtrage applicatif)"
  ON event_meetings FOR SELECT
  USING (true);

CREATE POLICY "Meetings créables par tous (filtrage applicatif)"
  ON event_meetings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Meetings modifiables par tous (filtrage applicatif)"
  ON event_meetings FOR UPDATE
  USING (true);

-- ============================================================
-- RPC: get_match_recommendations
-- Retourne les participants recommandés basés sur les intérêts communs
-- et la complémentarité des catégories
-- ============================================================

CREATE OR REPLACE FUNCTION get_match_recommendations(
  p_registration_id UUID,
  p_event_id UUID,
  p_limit INT DEFAULT 10
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
LANGUAGE plpgsql
AS $$
DECLARE
  v_interests TEXT[];
  v_category TEXT;
BEGIN
  -- Récupérer les intérêts et la catégorie du participant
  SELECT r.interests, r.participant_category
  INTO v_interests, v_category
  FROM event_registrations r
  WHERE r.id = p_registration_id;

  RETURN QUERY
  SELECT
    r.id,
    r.full_name,
    r.email,
    r.organization,
    r.job_title,
    r.country,
    r.bio,
    r.photo_url,
    r.participant_category,
    r.interests,
    r.linkedin_url,
    -- Score de matching :
    -- +3 par intérêt commun
    -- +5 si catégorie complémentaire (différente = networking diversifié)
    -- +2 si même pays (facilite les échanges)
    (
      COALESCE(array_length(
        ARRAY(SELECT unnest(r.interests) INTERSECT SELECT unnest(v_interests)),
        1
      ), 0) * 3
      + CASE WHEN r.participant_category != v_category AND r.participant_category IS NOT NULL THEN 5 ELSE 0 END
      + CASE WHEN r.country = (SELECT reg.country FROM event_registrations reg WHERE reg.id = p_registration_id) THEN 2 ELSE 0 END
    )::INT AS match_score
  FROM event_registrations r
  WHERE r.event_id = p_event_id
    AND r.id != p_registration_id
    AND r.is_visible_in_directory = TRUE
    AND r.status = 'confirmed'
    -- Exclure ceux à qui on a déjà envoyé une demande
    AND r.id NOT IN (
      SELECT m.recipient_id FROM event_meetings m
      WHERE m.requester_id = p_registration_id AND m.event_id = p_event_id
    )
  ORDER BY match_score DESC, r.full_name ASC
  LIMIT p_limit;
END;
$$;
