
-- 1. Extend event_registrations with networking profile fields
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS participant_category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS is_visible_in_directory boolean NOT NULL DEFAULT true;

-- Allow public INSERT policy to keep working with the new defaulted columns:
-- existing policy doesn't reference these columns, so no policy change needed.
-- Allow participants in the directory to be read publicly when visible & confirmed.
DROP POLICY IF EXISTS registrations_select_directory_public ON public.event_registrations;
CREATE POLICY registrations_select_directory_public
  ON public.event_registrations
  FOR SELECT TO anon, authenticated
  USING (is_visible_in_directory = true AND status = 'confirmed');

GRANT SELECT ON public.event_registrations TO anon;

-- 2. event_conversations
CREATE TABLE IF NOT EXISTS public.event_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_a uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT participants_distinct CHECK (participant_a <> participant_b),
  CONSTRAINT participants_ordered  CHECK (participant_a < participant_b),
  UNIQUE (event_id, participant_a, participant_b)
);
GRANT SELECT, INSERT, UPDATE ON public.event_conversations TO anon, authenticated;
GRANT ALL ON public.event_conversations TO service_role;
ALTER TABLE public.event_conversations ENABLE ROW LEVEL SECURITY;

-- Anyone can read/insert; the RPC controls creation. (No PII beyond ids.)
DROP POLICY IF EXISTS conv_select_all ON public.event_conversations;
CREATE POLICY conv_select_all ON public.event_conversations
  FOR SELECT TO anon, authenticated USING (true);

-- 3. event_messages
CREATE TABLE IF NOT EXISTS public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.event_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_messages_conv_idx ON public.event_messages (conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.event_messages TO anon, authenticated;
GRANT ALL ON public.event_messages TO service_role;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msg_select_all ON public.event_messages;
CREATE POLICY msg_select_all ON public.event_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS msg_insert_all ON public.event_messages;
CREATE POLICY msg_insert_all ON public.event_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS msg_update_read ON public.event_messages;
CREATE POLICY msg_update_read ON public.event_messages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. RPC get_or_create_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_event_id uuid, p_participant_a uuid, p_participant_b uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a uuid; b uuid; conv_id uuid;
BEGIN
  IF p_participant_a = p_participant_b THEN
    RAISE EXCEPTION 'Participants must differ';
  END IF;
  IF p_participant_a < p_participant_b THEN
    a := p_participant_a; b := p_participant_b;
  ELSE
    a := p_participant_b; b := p_participant_a;
  END IF;

  SELECT id INTO conv_id FROM public.event_conversations
    WHERE event_id = p_event_id AND participant_a = a AND participant_b = b;
  IF conv_id IS NULL THEN
    INSERT INTO public.event_conversations (event_id, participant_a, participant_b)
      VALUES (p_event_id, a, b) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid,uuid,uuid) TO anon, authenticated;
