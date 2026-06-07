-- ============================================================
-- Table: event_announcements
-- Fil d'annonces live pour les participants d'un événement
-- ============================================================

CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'info'
    CHECK (announcement_type IN ('info', 'warning', 'urgent', 'schedule_change', 'logistics')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour le tri chronologique par événement
CREATE INDEX idx_announcements_event_published
  ON event_announcements(event_id, published_at DESC);

-- Index pour les annonces épinglées
CREATE INDEX idx_announcements_pinned
  ON event_announcements(event_id, is_pinned)
  WHERE is_pinned = TRUE;

-- RLS : lecture publique (les participants consultent sans compte)
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Annonces lisibles par tous"
  ON event_announcements FOR SELECT
  USING (true);

CREATE POLICY "Annonces créées par les utilisateurs authentifiés"
  ON event_announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Annonces modifiables par les utilisateurs authentifiés"
  ON event_announcements FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Annonces supprimables par les utilisateurs authentifiés"
  ON event_announcements FOR DELETE
  TO authenticated
  USING (true);
