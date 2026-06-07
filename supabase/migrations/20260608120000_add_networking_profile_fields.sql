-- Sprint 3.1 : Annuaire participants / Networking
-- Ajoute les champs de profil enrichi à event_registrations pour l'annuaire

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS photo_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS country text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS participant_category text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS is_visible_in_directory boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT NULL;

-- Contrainte sur les catégories de participants
COMMENT ON COLUMN event_registrations.participant_category IS 
  'Catégorie du participant : fsu, regulator, operator, partner, startup, international_org, government, other';

-- Index pour la recherche dans l'annuaire (filtres fréquents)
CREATE INDEX IF NOT EXISTS idx_registrations_directory 
  ON event_registrations (event_id, is_visible_in_directory, participant_category)
  WHERE is_visible_in_directory = true AND status = 'confirmed';

-- Index GIN pour la recherche full-text sur nom + organisation
CREATE INDEX IF NOT EXISTS idx_registrations_search
  ON event_registrations USING gin (
    to_tsvector('french', coalesce(full_name, '') || ' ' || coalesce(organization, '') || ' ' || coalesce(country, ''))
  );

-- RLS : permettre la lecture publique de l'annuaire (participants visibles uniquement)
CREATE POLICY IF NOT EXISTS "public_directory_read" ON event_registrations
  FOR SELECT
  USING (is_visible_in_directory = true AND status = 'confirmed');
