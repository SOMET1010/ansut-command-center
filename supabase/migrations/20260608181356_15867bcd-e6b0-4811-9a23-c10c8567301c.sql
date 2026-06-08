
-- 10. profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_select_super_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 12. sessions/speakers admin write
DROP POLICY IF EXISTS "sessions_write_admin" ON public.event_sessions;
DROP POLICY IF EXISTS "auth_sessions_all" ON public.event_sessions;
DROP POLICY IF EXISTS "sessions_write_admin_only" ON public.event_sessions;

CREATE POLICY "sessions_write_admin_only"
  ON public.event_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'));

DROP POLICY IF EXISTS "speakers_write_admin" ON public.event_speakers;
DROP POLICY IF EXISTS "auth_speakers_all" ON public.event_speakers;
DROP POLICY IF EXISTS "speakers_write_admin_only" ON public.event_speakers;

CREATE POLICY "speakers_write_admin_only"
  ON public.event_speakers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'));

DROP POLICY IF EXISTS "session_speakers_write_admin" ON public.event_session_speakers;
DROP POLICY IF EXISTS "auth_session_speakers_all" ON public.event_session_speakers;
DROP POLICY IF EXISTS "session_speakers_write_admin_only" ON public.event_session_speakers;

CREATE POLICY "session_speakers_write_admin_only"
  ON public.event_session_speakers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'));

-- 13. session_bookmarks
DROP POLICY IF EXISTS "bookmarks_delete_all" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_all" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_all" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own_or_admin" ON public.session_bookmarks;
DROP POLICY IF EXISTS bookmarks_admin_select ON public.session_bookmarks;

CREATE POLICY "bookmarks_select_own"
  ON public.session_bookmarks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "bookmarks_insert_own"
  ON public.session_bookmarks FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "bookmarks_delete_own_or_admin"
  ON public.session_bookmarks FOR DELETE TO authenticated
  USING (true);
