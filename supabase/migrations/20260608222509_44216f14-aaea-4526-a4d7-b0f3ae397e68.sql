-- Lot S4-bis / M4b-C : organizations UPDATE scopé
--
-- Rollback :
-- DROP POLICY IF EXISTS "orgs_update_admin_scoped" ON public.organizations;
-- CREATE POLICY "orgs_update_admin" ON public.organizations FOR UPDATE TO authenticated
--   USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;

CREATE POLICY "orgs_update_admin_scoped"
  ON public.organizations FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'org_admin')
        AND id = public.current_user_org()
        AND public.current_user_org() IS NOT NULL)
  );