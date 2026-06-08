-- Lot S4-bis / M4b-E : event_meetings + session_attendance + session_bookmarks
-- SELECT/DELETE admin scopés par organisation
--
-- Rollback :
--   DROP POLICY ..._scoped et recréer les policies d'origine (admin global)

-- ---- event_meetings (event_id direct)
DROP POLICY IF EXISTS "meetings_admin_select" ON public.event_meetings;
DROP POLICY IF EXISTS "meetings_delete_admin" ON public.event_meetings;

CREATE POLICY "meetings_admin_select_scoped"
  ON public.event_meetings FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

CREATE POLICY "meetings_delete_admin_scoped"
  ON public.event_meetings FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(event_id) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

-- ---- session_attendance (résolution session→event)
DROP POLICY IF EXISTS "attendance_select_admin" ON public.session_attendance;
DROP POLICY IF EXISTS "attendance_delete_admin" ON public.session_attendance;

CREATE POLICY "attendance_select_admin_scoped"
  ON public.session_attendance FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(
          (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
        ) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

CREATE POLICY "attendance_delete_admin_scoped"
  ON public.session_attendance FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(
          (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
        ) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

-- ---- session_bookmarks (résolution session→event)
DROP POLICY IF EXISTS "bookmarks_select_admin" ON public.session_bookmarks;

CREATE POLICY "bookmarks_select_admin_scoped"
  ON public.session_bookmarks FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND public.event_org(
          (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
        ) = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );