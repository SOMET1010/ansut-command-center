
DROP POLICY IF EXISTS "announcements_write_admin" ON public.event_announcements;
DROP POLICY IF EXISTS "announcements_select_public" ON public.event_announcements;
DROP POLICY IF EXISTS "announcements_select_published" ON public.event_announcements;
DROP POLICY IF EXISTS "announcements_select_admin" ON public.event_announcements;
DROP POLICY IF EXISTS "announcements_write_admin_only" ON public.event_announcements;

CREATE POLICY "announcements_select_published"
  ON public.event_announcements FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "announcements_write_admin_only"
  ON public.event_announcements FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  );

DROP POLICY IF EXISTS "session_attendance_select_public" ON public.session_attendance;
DROP POLICY IF EXISTS "session_attendance_insert_public" ON public.session_attendance;
DROP POLICY IF EXISTS "session_attendance_delete_admin" ON public.session_attendance;
DROP POLICY IF EXISTS "attendance_select_admin" ON public.session_attendance;
DROP POLICY IF EXISTS "attendance_insert_public" ON public.session_attendance;
DROP POLICY IF EXISTS "attendance_delete_admin" ON public.session_attendance;
DROP POLICY IF EXISTS "session_attendance_select_admin" ON public.session_attendance;

CREATE POLICY "attendance_select_admin"
  ON public.session_attendance FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "attendance_insert_public"
  ON public.session_attendance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "attendance_delete_admin"
  ON public.session_attendance FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  );

DROP POLICY IF EXISTS "live_polls_write_admin" ON public.live_polls;
DROP POLICY IF EXISTS "live_polls_select_public" ON public.live_polls;
DROP POLICY IF EXISTS "auth_polls_all" ON public.live_polls;
DROP POLICY IF EXISTS "polls_select_active" ON public.live_polls;
DROP POLICY IF EXISTS "polls_select_admin" ON public.live_polls;
DROP POLICY IF EXISTS "polls_write_admin_only" ON public.live_polls;

CREATE POLICY "polls_select_active"
  ON public.live_polls FOR SELECT
  USING (is_active = true);

CREATE POLICY "polls_write_admin_only"
  ON public.live_polls FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  );

DROP POLICY IF EXISTS "conv_select_all" ON public.event_conversations;
DROP POLICY IF EXISTS "auth_conversations_all" ON public.event_conversations;
DROP POLICY IF EXISTS conv_admin_select ON public.event_conversations;
DROP POLICY IF EXISTS "conversations_select_admin" ON public.event_conversations;
DROP POLICY IF EXISTS "conversations_insert_via_rpc" ON public.event_conversations;

CREATE POLICY "conversations_select_admin"
  ON public.event_conversations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  );

CREATE POLICY "conversations_insert_via_rpc"
  ON public.event_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "msg_select_all" ON public.event_messages;
DROP POLICY IF EXISTS "msg_insert_all" ON public.event_messages;
DROP POLICY IF EXISTS "msg_update_read" ON public.event_messages;
DROP POLICY IF EXISTS "auth_messages_all" ON public.event_messages;
DROP POLICY IF EXISTS msg_admin_select ON public.event_messages;
DROP POLICY IF EXISTS "messages_select_admin" ON public.event_messages;
DROP POLICY IF EXISTS "messages_insert_via_rpc" ON public.event_messages;
DROP POLICY IF EXISTS "messages_update_via_rpc" ON public.event_messages;

CREATE POLICY "messages_select_admin"
  ON public.event_messages FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'org_admin'::app_role)
  );

CREATE POLICY "messages_insert_via_rpc"
  ON public.event_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "messages_update_via_rpc"
  ON public.event_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
