-- Lot S4-bis / M4b-B : events INSERT/UPDATE/DELETE scopés par organisation
--
-- Rollback :
-- DROP POLICY IF EXISTS "events_insert_admin_scoped" ON public.events;
-- DROP POLICY IF EXISTS "events_update_admin_scoped" ON public.events;
-- DROP POLICY IF EXISTS "events_delete_admin_scoped" ON public.events;
-- CREATE POLICY "events_insert_admin" ON public.events FOR INSERT TO authenticated
--   WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));
-- CREATE POLICY "events_update_admin" ON public.events FOR UPDATE TO authenticated
--   USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));
-- CREATE POLICY "events_delete_admin" ON public.events FOR DELETE TO authenticated
--   USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
DROP POLICY IF EXISTS "events_update_admin" ON public.events;
DROP POLICY IF EXISTS "events_delete_admin" ON public.events;

CREATE POLICY "events_insert_admin_scoped"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND organization_id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

CREATE POLICY "events_update_admin_scoped"
  ON public.events FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND organization_id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND organization_id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );

CREATE POLICY "events_delete_admin_scoped"
  ON public.events FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND organization_id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );