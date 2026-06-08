-- Lot S4 / M4-C : live_polls + live_poll_votes — scoping org_admin par organisation
--
-- Avant :
--   - `polls_write_admin_only`         : org_admin global (toutes orgs)
--   - `live_poll_votes_delete_admin`   : org_admin global (toutes orgs)
-- Après :
--   - super_admin global OU org_admin uniquement sur les polls de SES events.
--   - Résolution : live_polls.session_id -> event_sessions.event_id -> events.organization_id
--
-- Rollback :
--   DROP POLICY IF EXISTS "polls_write_admin_scoped" ON public.live_polls;
--   CREATE POLICY "polls_write_admin_only" ON public.live_polls
--     FOR ALL TO authenticated
--     USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'))
--     WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));
--   DROP POLICY IF EXISTS "live_poll_votes_delete_admin_scoped" ON public.live_poll_votes;
--   CREATE POLICY "live_poll_votes_delete_admin" ON public.live_poll_votes
--     FOR DELETE TO authenticated
--     USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

-- ---- live_polls (ALL = écritures admin)
DROP POLICY IF EXISTS "polls_write_admin_only" ON public.live_polls;

CREATE POLICY "polls_write_admin_scoped"
  ON public.live_polls
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(
        (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
      ) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(
        (SELECT s.event_id FROM public.event_sessions s WHERE s.id = session_id)
      ) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  );

-- ---- live_poll_votes (DELETE admin)
DROP POLICY IF EXISTS "live_poll_votes_delete_admin" ON public.live_poll_votes;

CREATE POLICY "live_poll_votes_delete_admin_scoped"
  ON public.live_poll_votes
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(
        (SELECT s.event_id
           FROM public.event_sessions s
           JOIN public.live_polls p ON p.session_id = s.id
          WHERE p.id = poll_id)
      ) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  );