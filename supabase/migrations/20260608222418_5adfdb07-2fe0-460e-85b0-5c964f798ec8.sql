-- Lot S4-bis / M4b-A : filtrer SELECT public par events.status='published'
-- Avant : USING (true) → fuite des sessions/speakers/rattachements des events draft
-- Après : visible publiquement uniquement si event publié ; admins/staff voient tout
--
-- Rollback :
-- DROP POLICY IF EXISTS "sessions_select_public_published" ON public.event_sessions;
-- CREATE POLICY "sessions_select_public" ON public.event_sessions
--   FOR SELECT TO anon, authenticated USING (true);
-- DROP POLICY IF EXISTS "speakers_select_public_published" ON public.event_speakers;
-- CREATE POLICY "speakers_select_public" ON public.event_speakers
--   FOR SELECT TO anon, authenticated USING (true);
-- DROP POLICY IF EXISTS "session_speakers_select_public_published" ON public.event_session_speakers;
-- CREATE POLICY "session_speakers_select_public" ON public.event_session_speakers
--   FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sessions_select_public" ON public.event_sessions;
CREATE POLICY "sessions_select_public_published"
  ON public.event_sessions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_id AND e.status = 'published')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "speakers_select_public" ON public.event_speakers;
CREATE POLICY "speakers_select_public_published"
  ON public.event_speakers FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_id AND e.status = 'published')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "session_speakers_select_public" ON public.event_session_speakers;
CREATE POLICY "session_speakers_select_public_published"
  ON public.event_session_speakers FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_sessions s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = session_id AND e.status = 'published'
    )
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  );