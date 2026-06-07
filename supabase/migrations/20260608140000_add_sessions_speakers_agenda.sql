-- Sprint 3.3 : Agenda personnalisé — sessions, speakers, bookmarks

-- Table des intervenants (speakers)
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_speakers_event ON event_speakers(event_id);

-- Table des sessions (programme)
CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'panel'
    CHECK (session_type IN ('keynote', 'panel', 'workshop', 'networking', 'break', 'ceremony', 'visit')),
  track TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_session_times CHECK (ends_at > starts_at)
);

CREATE INDEX idx_sessions_event ON event_sessions(event_id);
CREATE INDEX idx_sessions_starts ON event_sessions(starts_at);

-- Table de liaison sessions <-> speakers (many-to-many)
CREATE TABLE IF NOT EXISTS event_session_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES event_speakers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'speaker' CHECK (role IN ('speaker', 'moderator', 'panelist')),
  CONSTRAINT unique_session_speaker UNIQUE (session_id, speaker_id)
);

-- Table des favoris (bookmarks) — un participant marque les sessions qui l'intéressent
CREATE TABLE IF NOT EXISTS session_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_bookmark UNIQUE (session_id, participant_id)
);

CREATE INDEX idx_bookmarks_participant ON session_bookmarks(participant_id);

-- RLS
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bookmarks ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous (agenda visible sans compte)
CREATE POLICY "anon_speakers_select" ON event_speakers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_sessions_select" ON event_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_session_speakers_select" ON event_session_speakers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_bookmarks_select" ON session_bookmarks FOR SELECT TO anon USING (true);
CREATE POLICY "anon_bookmarks_insert" ON session_bookmarks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_bookmarks_delete" ON session_bookmarks FOR DELETE TO anon USING (true);

-- Accès complet pour les organisateurs authentifiés
CREATE POLICY "auth_speakers_all" ON event_speakers FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_sessions_all" ON event_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_session_speakers_all" ON event_session_speakers FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_bookmarks_all" ON session_bookmarks FOR ALL TO authenticated USING (true);
