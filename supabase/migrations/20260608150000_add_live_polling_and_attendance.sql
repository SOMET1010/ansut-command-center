-- Sprint 3.4 : Mode Présentation, QR de présence par session, Live Polling

-- Table de présence par session (check-in session, différent du check-in événement)
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_session_attendance UNIQUE (session_id, participant_id)
);
CREATE INDEX idx_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_attendance_participant ON session_attendance(participant_id);

-- Table des sondages live (questions posées pendant une session)
CREATE TABLE IF NOT EXISTS live_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL DEFAULT 'single_choice'
    CHECK (poll_type IN ('single_choice', 'multiple_choice', 'word_cloud', 'rating')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX idx_polls_session ON live_polls(session_id);
CREATE INDEX idx_polls_active ON live_polls(is_active) WHERE is_active = true;

-- Table des votes (réponses des participants)
CREATE TABLE IF NOT EXISTS live_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES live_polls(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_poll_vote UNIQUE (poll_id, participant_id)
);
CREATE INDEX idx_votes_poll ON live_poll_votes(poll_id);

-- RLS
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_poll_votes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (les participants voient les sondages actifs)
CREATE POLICY "anon_attendance_select" ON session_attendance FOR SELECT TO anon USING (true);
CREATE POLICY "anon_attendance_insert" ON session_attendance FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_polls_select" ON live_polls FOR SELECT TO anon USING (true);
CREATE POLICY "anon_votes_select" ON live_poll_votes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_votes_insert" ON live_poll_votes FOR INSERT TO anon WITH CHECK (true);

-- Accès complet pour les organisateurs authentifiés
CREATE POLICY "auth_attendance_all" ON session_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_polls_all" ON live_polls FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_votes_all" ON live_poll_votes FOR ALL TO authenticated USING (true);
