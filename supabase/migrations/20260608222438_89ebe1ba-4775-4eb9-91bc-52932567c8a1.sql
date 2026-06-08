-- Lot S4-bis / M4b-D : event_sessions + event_speakers + event_session_speakers écritures
-- Avant : org_admin global. Après : org_admin scopé via event_org(event_id) = current_user_org()
--
-- Rollback :
-- DROP POLICY IF EXISTS "sessions_write_admin_scoped" ON public.event_sessions;
-- CREATE POLICY "sessions_write_admin_only" ON public.event_sessions
--   FOR ALL TO authenticated
--   USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'))
--   WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));
-- (idem speakers_write_admin_only et session_speakers_write_admin_only)

DROP POLICY IF EXISTS "sessions_write_admin_only" ON public.event_sessions;
CREATE POLICY "sessions_write_admin_scoped"
  ON public.event_sessions FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

DROP POLICY IF EXISTS "speakers_write_admin_only" ON public.event_speakers;
CREATE POLICY "speakers_write_admin_scoped"
  ON public.event_speakers FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

DROP POLICY IF EXISTS "session_speakers_write_admin_only" ON public.event_session_speakers;
CREATE POLICY "session_speakers_write_admin_scoped"
  ON public.event_session_speakers FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(
          (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
        ) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(
          (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
        ) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );