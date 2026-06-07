-- live_polls
CREATE TABLE IF NOT EXISTS public.live_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  question text NOT NULL,
  poll_type text NOT NULL DEFAULT 'single' CHECK (poll_type IN ('single','multi','rating','text')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  show_results boolean NOT NULL DEFAULT true,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_polls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_polls TO authenticated;
GRANT ALL ON public.live_polls TO service_role;
ALTER TABLE public.live_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_polls_select_public" ON public.live_polls
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live_polls_write_admin" ON public.live_polls
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

CREATE TRIGGER live_polls_set_updated_at
  BEFORE UPDATE ON public.live_polls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS live_polls_session_idx ON public.live_polls(session_id);

-- live_poll_votes
CREATE TABLE IF NOT EXISTS public.live_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.live_polls(id) ON DELETE CASCADE,
  voter_id uuid,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.live_poll_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.live_poll_votes TO authenticated;
GRANT ALL ON public.live_poll_votes TO service_role;
ALTER TABLE public.live_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_poll_votes_select_public" ON public.live_poll_votes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live_poll_votes_insert_public" ON public.live_poll_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "live_poll_votes_delete_admin" ON public.live_poll_votes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

CREATE INDEX IF NOT EXISTS live_poll_votes_poll_idx ON public.live_poll_votes(poll_id);

-- session_attendance
CREATE TABLE IF NOT EXISTS public.session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, participant_id)
);
GRANT SELECT, INSERT ON public.session_attendance TO anon;
GRANT SELECT, INSERT, DELETE ON public.session_attendance TO authenticated;
GRANT ALL ON public.session_attendance TO service_role;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_attendance_select_public" ON public.session_attendance
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "session_attendance_insert_public" ON public.session_attendance
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "session_attendance_delete_admin" ON public.session_attendance
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

CREATE INDEX IF NOT EXISTS session_attendance_session_idx ON public.session_attendance(session_id);
CREATE INDEX IF NOT EXISTS session_attendance_participant_idx ON public.session_attendance(participant_id);
