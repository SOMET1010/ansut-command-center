
-- Conversations: writes only via start_conversation RPC (SECURITY DEFINER)
DROP POLICY IF EXISTS "conversations_insert_via_rpc" ON public.event_conversations;

-- Messages: writes only via send_conversation_message / mark_conversation_read RPCs
DROP POLICY IF EXISTS "messages_insert_via_rpc" ON public.event_messages;
DROP POLICY IF EXISTS "messages_update_via_rpc" ON public.event_messages;

-- Session attendance: insert only via record_session_attendance RPC
DROP POLICY IF EXISTS "attendance_insert_public" ON public.session_attendance;

-- Session bookmarks: read/write only via list_my_bookmarks / toggle_my_bookmark RPCs
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own_or_admin" ON public.session_bookmarks;

-- Admin-only fallback for direct visibility
CREATE POLICY "bookmarks_select_admin"
  ON public.session_bookmarks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'org_admin'));
