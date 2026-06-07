
CREATE TABLE IF NOT EXISTS public.event_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'panel',
  track text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO authenticated;
GRANT ALL ON public.event_sessions TO service_role;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_public ON public.event_sessions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY sessions_write_admin ON public.event_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE TRIGGER event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  title text,
  organization text,
  bio text,
  photo_url text,
  linkedin_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_speakers TO authenticated;
GRANT ALL ON public.event_speakers TO service_role;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY speakers_select_public ON public.event_speakers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY speakers_write_admin ON public.event_speakers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE TRIGGER event_speakers_updated_at
  BEFORE UPDATE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
