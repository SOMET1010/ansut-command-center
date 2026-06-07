
CREATE TABLE IF NOT EXISTS public.event_session_speakers (
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES public.event_speakers(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, speaker_id)
);
GRANT SELECT ON public.event_session_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_session_speakers TO authenticated;
GRANT ALL ON public.event_session_speakers TO service_role;
ALTER TABLE public.event_session_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_speakers_select_public ON public.event_session_speakers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY session_speakers_write_admin ON public.event_session_speakers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE TABLE IF NOT EXISTS public.session_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, participant_id)
);
GRANT SELECT, INSERT, DELETE ON public.session_bookmarks TO anon, authenticated;
GRANT ALL ON public.session_bookmarks TO service_role;
ALTER TABLE public.session_bookmarks ENABLE ROW LEVEL SECURITY;

-- Identification anonyme via qr_token côté client : lecture/écriture ouverte (champs non sensibles)
CREATE POLICY bookmarks_select_all ON public.session_bookmarks
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY bookmarks_insert_all ON public.session_bookmarks
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY bookmarks_delete_all ON public.session_bookmarks
  FOR DELETE TO anon, authenticated USING (true);
