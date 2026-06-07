-- Sprint 3.2 : Messagerie directe entre participants
-- Architecture : conversations 1:1 liées à un événement, identifiées par qr_token (pas de compte requis)

-- Table des conversations
CREATE TABLE IF NOT EXISTS event_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_a UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Empêcher les doublons de conversation entre deux participants
  CONSTRAINT unique_conversation UNIQUE (event_id, participant_a, participant_b),
  -- Empêcher de se parler à soi-même
  CONSTRAINT no_self_conversation CHECK (participant_a <> participant_b)
);

-- Index pour retrouver rapidement les conversations d'un participant
CREATE INDEX idx_conversations_participant_a ON event_conversations(participant_a);
CREATE INDEX idx_conversations_participant_b ON event_conversations(participant_b);

-- Table des messages
CREATE TABLE IF NOT EXISTS event_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES event_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour charger les messages d'une conversation rapidement
CREATE INDEX idx_messages_conversation ON event_messages(conversation_id, created_at);
-- Index pour compter les messages non lus
CREATE INDEX idx_messages_unread ON event_messages(sender_id, read_at) WHERE read_at IS NULL;

-- RLS : accès public (les participants s'identifient par qr_token, pas par auth)
-- La sécurité est gérée côté application (vérification du qr_token)
ALTER TABLE event_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Policy permissive pour l'accès anon (la vérification se fait côté app via qr_token)
CREATE POLICY "anon_conversations_select" ON event_conversations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_conversations_insert" ON event_conversations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_messages_select" ON event_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_messages_insert" ON event_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_messages_update" ON event_messages FOR UPDATE TO anon USING (true);

-- Policy pour les utilisateurs authentifiés (organisateurs)
CREATE POLICY "auth_conversations_all" ON event_conversations FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_messages_all" ON event_messages FOR ALL TO authenticated USING (true);

-- Fonction RPC pour obtenir ou créer une conversation entre deux participants
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_event_id UUID,
  p_participant_a UUID,
  p_participant_b UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_a UUID;
  v_b UUID;
BEGIN
  -- Normaliser l'ordre pour éviter les doublons (a < b)
  IF p_participant_a < p_participant_b THEN
    v_a := p_participant_a;
    v_b := p_participant_b;
  ELSE
    v_a := p_participant_b;
    v_b := p_participant_a;
  END IF;

  -- Chercher une conversation existante
  SELECT id INTO v_conversation_id
  FROM event_conversations
  WHERE event_id = p_event_id AND participant_a = v_a AND participant_b = v_b;

  -- Si elle n'existe pas, la créer
  IF v_conversation_id IS NULL THEN
    INSERT INTO event_conversations (event_id, participant_a, participant_b)
    VALUES (p_event_id, v_a, v_b)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;
