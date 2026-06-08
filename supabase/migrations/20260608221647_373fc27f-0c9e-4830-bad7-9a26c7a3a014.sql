-- Lot S4 / M4-B : event_announcements — scoping org_admin par organisation
--
-- Avant : `announcements_write_admin_only` autorisait tout org_admin à écrire
--         sur n'importe quel événement (pas de filtre organization).
-- Après : super_admin global OU org_admin uniquement sur les events de son org.
-- Lecture publique (announcements_select_published) inchangée.
--
-- Rollback :
-- DROP POLICY IF EXISTS "announcements_write_admin_scoped" ON public.event_announcements;
-- CREATE POLICY "announcements_write_admin_only" ON public.event_announcements
--   FOR ALL TO authenticated
--   USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'))
--   WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'org_admin'));

DROP POLICY IF EXISTS "announcements_write_admin_only" ON public.event_announcements;

CREATE POLICY "announcements_write_admin_scoped"
  ON public.event_announcements
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(event_id) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(event_id) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  );