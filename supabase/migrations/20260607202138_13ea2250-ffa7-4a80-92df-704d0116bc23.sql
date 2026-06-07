CREATE TABLE public.event_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'info',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_announcements_event_id_idx ON public.event_announcements(event_id);
CREATE INDEX event_announcements_published_at_idx ON public.event_announcements(published_at DESC);

GRANT SELECT ON public.event_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_announcements TO authenticated;
GRANT ALL ON public.event_announcements TO service_role;

ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_public"
  ON public.event_announcements FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_announcements.event_id
        AND (e.status = 'published'
             OR has_role(auth.uid(), 'super_admin'::app_role)
             OR has_role(auth.uid(), 'org_admin'::app_role)
             OR has_role(auth.uid(), 'staff'::app_role))
    )
  );

CREATE POLICY "announcements_write_admin"
  ON public.event_announcements FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
  );

CREATE TRIGGER event_announcements_set_updated_at
  BEFORE UPDATE ON public.event_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();