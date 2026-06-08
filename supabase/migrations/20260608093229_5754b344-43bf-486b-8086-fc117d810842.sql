-- 1. Helper resolver
CREATE OR REPLACE FUNCTION public._reg_from_token(p_qr_token uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.event_registrations WHERE qr_token = p_qr_token $$;
REVOKE ALL ON FUNCTION public._reg_from_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._reg_from_token(uuid) TO anon, authenticated, service_role;

-- 2. event_registrations column-level grants
REVOKE ALL ON public.event_registrations FROM anon;
GRANT INSERT (event_id, full_name, email, phone, organization, position, country, bio,
              linkedin_url, photo_url, interests, participant_category,
              is_visible_in_directory, status, user_id, qr_token)
  ON public.event_registrations TO anon;
GRANT SELECT (id, event_id, full_name, organization, position, country, bio,
              photo_url, interests, participant_category, linkedin_url,
              is_visible_in_directory, status, created_at)
  ON public.event_registrations TO anon;

-- 3. me_registration + update_my_profile
CREATE OR REPLACE FUNCTION public.me_registration(p_qr_token uuid)
RETURNS TABLE (
  id uuid, full_name text, email text, phone text,
  organization text, job_position text, country text, bio text,
  photo_url text, linkedin_url text, interests text[],
  participant_category text, is_visible_in_directory boolean,
  event_id uuid, status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, r.full_name, r.email, r.phone, r.organization, r.position,
         r.country, r.bio, r.photo_url, r.linkedin_url, r.interests,
         r.participant_category, r.is_visible_in_directory, r.event_id, r.status
  FROM public.event_registrations r
  WHERE r.qr_token = p_qr_token
$$;
GRANT EXECUTE ON FUNCTION public.me_registration(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_qr_token uuid,
  p_country text DEFAULT NULL,
  p_participant_category text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_is_visible_in_directory boolean DEFAULT NULL,
  p_interests text[] DEFAULT NULL,
  p_photo_url text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  v_id := public._reg_from_token(p_qr_token);
  IF v_id IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  IF p_bio IS NOT NULL AND length(p_bio) > 2000 THEN RAISE EXCEPTION 'Bio trop longue'; END IF;
  IF p_country IS NOT NULL AND length(p_country) > 100 THEN RAISE EXCEPTION 'Pays trop long'; END IF;
  IF p_linkedin_url IS NOT NULL AND length(p_linkedin_url) > 500 THEN RAISE EXCEPTION 'URL trop longue'; END IF;
  UPDATE public.event_registrations SET
    country = COALESCE(p_country, country),
    participant_category = COALESCE(p_participant_category, participant_category),
    bio = COALESCE(p_bio, bio),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    is_visible_in_directory = COALESCE(p_is_visible_in_directory, is_visible_in_directory),
    interests = COALESCE(p_interests, interests),
    photo_url = COALESCE(p_photo_url, photo_url)
  WHERE id = v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.update_my_profile(uuid, text, text, text, text, boolean, text[], text) TO anon, authenticated;

-- 4. session_attendance
DROP POLICY IF EXISTS session_attendance_insert_public ON public.session_attendance;
REVOKE INSERT, UPDATE, DELETE ON public.session_attendance FROM anon;

CREATE OR REPLACE FUNCTION public.record_session_attendance(
  p_qr_token uuid, p_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reg_id uuid; v_session_event uuid; v_reg_event uuid; v_already boolean; v_full_name text;
BEGIN
  SELECT id, event_id, full_name INTO v_reg_id, v_reg_event, v_full_name
    FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF v_reg_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_token'); END IF;
  SELECT event_id INTO v_session_event FROM public.event_sessions WHERE id = p_session_id;
  IF v_session_event IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_session'); END IF;
  IF v_session_event <> v_reg_event THEN RETURN jsonb_build_object('ok', false, 'error', 'wrong_event'); END IF;
  SELECT EXISTS (SELECT 1 FROM public.session_attendance
                 WHERE session_id = p_session_id AND participant_id = v_reg_id) INTO v_already;
  IF v_already THEN RETURN jsonb_build_object('ok', true, 'already', true, 'full_name', v_full_name); END IF;
  INSERT INTO public.session_attendance (session_id, participant_id) VALUES (p_session_id, v_reg_id);
  RETURN jsonb_build_object('ok', true, 'already', false, 'full_name', v_full_name);
END $$;
GRANT EXECUTE ON FUNCTION public.record_session_attendance(uuid, uuid) TO anon, authenticated;

-- 5. live_poll_votes
DROP POLICY IF EXISTS live_poll_votes_insert_public ON public.live_poll_votes;
REVOKE INSERT, UPDATE, DELETE ON public.live_poll_votes FROM anon;

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_qr_token uuid, p_poll_id uuid, p_answer jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg_id uuid; v_reg_event uuid; v_poll_active boolean; v_poll_event uuid;
BEGIN
  SELECT id, event_id INTO v_reg_id, v_reg_event FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF v_reg_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_token'); END IF;
  SELECT p.is_active, s.event_id INTO v_poll_active, v_poll_event
    FROM public.live_polls p JOIN public.event_sessions s ON s.id = p.session_id
    WHERE p.id = p_poll_id;
  IF v_poll_active IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_poll'); END IF;
  IF NOT v_poll_active THEN RETURN jsonb_build_object('ok', false, 'error', 'poll_closed'); END IF;
  IF v_poll_event <> v_reg_event THEN RETURN jsonb_build_object('ok', false, 'error', 'wrong_event'); END IF;
  IF EXISTS (SELECT 1 FROM public.live_poll_votes WHERE poll_id = p_poll_id AND participant_id = v_reg_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_voted');
  END IF;
  INSERT INTO public.live_poll_votes (poll_id, participant_id, answer) VALUES (p_poll_id, v_reg_id, p_answer);
  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(uuid, uuid, jsonb) TO anon, authenticated;

-- 6. session_bookmarks
DROP POLICY IF EXISTS bookmarks_select_all ON public.session_bookmarks;
DROP POLICY IF EXISTS bookmarks_insert_all ON public.session_bookmarks;
DROP POLICY IF EXISTS bookmarks_delete_all ON public.session_bookmarks;
REVOKE ALL ON public.session_bookmarks FROM anon;
CREATE POLICY bookmarks_admin_select ON public.session_bookmarks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE OR REPLACE FUNCTION public.list_my_bookmarks(p_qr_token uuid, p_event_id uuid)
RETURNS TABLE (session_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.session_id FROM public.session_bookmarks b
  JOIN public.event_sessions s ON s.id = b.session_id
  WHERE b.participant_id = public._reg_from_token(p_qr_token) AND s.event_id = p_event_id
$$;
GRANT EXECUTE ON FUNCTION public.list_my_bookmarks(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.toggle_my_bookmark(
  p_qr_token uuid, p_session_id uuid, p_add boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_session_event uuid; v_reg_event uuid;
BEGIN
  SELECT id, event_id INTO v_reg, v_reg_event FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  SELECT event_id INTO v_session_event FROM public.event_sessions WHERE id = p_session_id;
  IF v_session_event IS NULL OR v_session_event <> v_reg_event THEN RAISE EXCEPTION 'Session invalide'; END IF;
  IF p_add THEN
    INSERT INTO public.session_bookmarks (session_id, participant_id) VALUES (p_session_id, v_reg) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.session_bookmarks WHERE session_id = p_session_id AND participant_id = v_reg;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.toggle_my_bookmark(uuid, uuid, boolean) TO anon, authenticated;

-- 7. event_meetings
DROP POLICY IF EXISTS meetings_select_all ON public.event_meetings;
DROP POLICY IF EXISTS meetings_insert_all ON public.event_meetings;
DROP POLICY IF EXISTS meetings_update_all ON public.event_meetings;
REVOKE ALL ON public.event_meetings FROM anon;
CREATE POLICY meetings_admin_select ON public.event_meetings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE OR REPLACE FUNCTION public.list_my_meetings(p_qr_token uuid)
RETURNS TABLE (
  id uuid, event_id uuid, requester_id uuid, recipient_id uuid,
  status text, proposed_time timestamptz, proposed_location text,
  message text, response_message text, created_at timestamptz, responded_at timestamptz,
  requester_name text, requester_org text, recipient_name text, recipient_org text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (SELECT public._reg_from_token(p_qr_token) AS id)
  SELECT m.id, m.event_id, m.requester_id, m.recipient_id, m.status,
         m.proposed_time, m.proposed_location, m.message, m.response_message,
         m.created_at, m.responded_at,
         rq.full_name, rq.organization, rc.full_name, rc.organization
  FROM public.event_meetings m
  JOIN public.event_registrations rq ON rq.id = m.requester_id
  JOIN public.event_registrations rc ON rc.id = m.recipient_id
  WHERE m.requester_id = (SELECT id FROM me) OR m.recipient_id = (SELECT id FROM me)
  ORDER BY m.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.list_my_meetings(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_my_sent_meeting_recipients(p_qr_token uuid)
RETURNS TABLE (recipient_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.recipient_id FROM public.event_meetings m
  WHERE m.requester_id = public._reg_from_token(p_qr_token)
$$;
GRANT EXECUTE ON FUNCTION public.list_my_sent_meeting_recipients(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_meeting_request(
  p_qr_token uuid, p_recipient_id uuid,
  p_message text DEFAULT NULL, p_proposed_time timestamptz DEFAULT NULL,
  p_proposed_location text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_event uuid; v_rec_event uuid; v_id uuid;
BEGIN
  SELECT id, event_id INTO v_reg, v_event FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  IF v_reg = p_recipient_id THEN RAISE EXCEPTION 'Destinataire invalide'; END IF;
  SELECT event_id INTO v_rec_event FROM public.event_registrations WHERE id = p_recipient_id;
  IF v_rec_event IS NULL OR v_rec_event <> v_event THEN RAISE EXCEPTION 'Destinataire invalide'; END IF;
  IF p_message IS NOT NULL AND length(p_message) > 1000 THEN RAISE EXCEPTION 'Message trop long'; END IF;
  IF p_proposed_location IS NOT NULL AND length(p_proposed_location) > 200 THEN RAISE EXCEPTION 'Lieu trop long'; END IF;
  INSERT INTO public.event_meetings (event_id, requester_id, recipient_id, message, proposed_time, proposed_location)
    VALUES (v_event, v_reg, p_recipient_id, p_message, p_proposed_time, p_proposed_location)
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.create_meeting_request(uuid, uuid, text, timestamptz, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_meeting(
  p_qr_token uuid, p_meeting_id uuid, p_status text, p_response_message text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_recipient uuid;
BEGIN
  v_reg := public._reg_from_token(p_qr_token);
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  IF p_status NOT IN ('accepted', 'declined') THEN RAISE EXCEPTION 'Statut invalide'; END IF;
  SELECT recipient_id INTO v_recipient FROM public.event_meetings WHERE id = p_meeting_id;
  IF v_recipient IS NULL OR v_recipient <> v_reg THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.event_meetings SET status = p_status, response_message = p_response_message, responded_at = now()
    WHERE id = p_meeting_id;
END $$;
GRANT EXECUTE ON FUNCTION public.respond_to_meeting(uuid, uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_meeting(p_qr_token uuid, p_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_requester uuid;
BEGIN
  v_reg := public._reg_from_token(p_qr_token);
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  SELECT requester_id INTO v_requester FROM public.event_meetings WHERE id = p_meeting_id;
  IF v_requester IS NULL OR v_requester <> v_reg THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.event_meetings SET status = 'cancelled' WHERE id = p_meeting_id;
END $$;
GRANT EXECUTE ON FUNCTION public.cancel_my_meeting(uuid, uuid) TO anon, authenticated;

-- 8. event_conversations + event_messages
DROP POLICY IF EXISTS conv_select_all ON public.event_conversations;
DROP POLICY IF EXISTS msg_select_all ON public.event_messages;
DROP POLICY IF EXISTS msg_insert_all ON public.event_messages;
DROP POLICY IF EXISTS msg_update_read ON public.event_messages;
REVOKE ALL ON public.event_conversations FROM anon;
REVOKE ALL ON public.event_messages FROM anon;
CREATE POLICY conv_admin_select ON public.event_conversations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));
CREATE POLICY msg_admin_select ON public.event_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'org_admin'));

CREATE OR REPLACE FUNCTION public.start_conversation(
  p_qr_token uuid, p_other_participant_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_event uuid; v_other_event uuid; v_a uuid; v_b uuid; v_conv uuid;
BEGIN
  SELECT id, event_id INTO v_reg, v_event FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  IF v_reg = p_other_participant_id THEN RAISE EXCEPTION 'Participants identiques'; END IF;
  SELECT event_id INTO v_other_event FROM public.event_registrations WHERE id = p_other_participant_id;
  IF v_other_event IS NULL OR v_other_event <> v_event THEN RAISE EXCEPTION 'Participant invalide'; END IF;
  IF v_reg < p_other_participant_id THEN v_a := v_reg; v_b := p_other_participant_id;
  ELSE v_a := p_other_participant_id; v_b := v_reg; END IF;
  SELECT id INTO v_conv FROM public.event_conversations
    WHERE event_id = v_event AND participant_a = v_a AND participant_b = v_b;
  IF v_conv IS NULL THEN
    INSERT INTO public.event_conversations (event_id, participant_a, participant_b)
      VALUES (v_event, v_a, v_b) RETURNING id INTO v_conv;
  END IF;
  RETURN v_conv;
END $$;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_my_conversations(p_qr_token uuid)
RETURNS TABLE (
  conversation_id uuid, other_id uuid, other_name text, other_organization text,
  other_category text, last_message text, last_at timestamptz, unread_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (SELECT public._reg_from_token(p_qr_token) AS id)
  SELECT c.id, o.id, o.full_name, o.organization, o.participant_category,
         lm.content, COALESCE(lm.created_at, c.created_at),
         COALESCE((SELECT count(*) FROM public.event_messages m2
                   WHERE m2.conversation_id = c.id AND m2.sender_id <> (SELECT id FROM me) AND m2.read_at IS NULL), 0)
  FROM public.event_conversations c
  JOIN public.event_registrations o
    ON o.id = CASE WHEN c.participant_a = (SELECT id FROM me) THEN c.participant_b ELSE c.participant_a END
  LEFT JOIN LATERAL (
    SELECT content, created_at FROM public.event_messages
    WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
  ) lm ON true
  WHERE c.participant_a = (SELECT id FROM me) OR c.participant_b = (SELECT id FROM me)
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC
$$;
GRANT EXECUTE ON FUNCTION public.list_my_conversations(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_conversation_messages(
  p_qr_token uuid, p_conversation_id uuid
) RETURNS TABLE (
  id uuid, content text, sender_id uuid, read_at timestamptz, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_ok boolean;
BEGIN
  v_reg := public._reg_from_token(p_qr_token);
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.event_conversations
    WHERE id = p_conversation_id AND (participant_a = v_reg OR participant_b = v_reg)) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY SELECT m.id, m.content, m.sender_id, m.read_at, m.created_at
    FROM public.event_messages m WHERE m.conversation_id = p_conversation_id ORDER BY m.created_at ASC;
END $$;
GRANT EXECUTE ON FUNCTION public.list_conversation_messages(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_conversation_message(
  p_qr_token uuid, p_conversation_id uuid, p_content text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_ok boolean; v_id uuid;
BEGIN
  v_reg := public._reg_from_token(p_qr_token);
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Code badge invalide'; END IF;
  IF p_content IS NULL OR length(btrim(p_content)) = 0 THEN RAISE EXCEPTION 'Message vide'; END IF;
  IF length(p_content) > 4000 THEN RAISE EXCEPTION 'Message trop long'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.event_conversations
    WHERE id = p_conversation_id AND (participant_a = v_reg OR participant_b = v_reg)) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO public.event_messages (conversation_id, sender_id, content)
    VALUES (p_conversation_id, v_reg, p_content) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.send_conversation_message(uuid, uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_qr_token uuid, p_conversation_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_reg uuid; v_ok boolean;
BEGIN
  v_reg := public._reg_from_token(p_qr_token);
  IF v_reg IS NULL THEN RETURN; END IF;
  SELECT EXISTS (SELECT 1 FROM public.event_conversations
    WHERE id = p_conversation_id AND (participant_a = v_reg OR participant_b = v_reg)) INTO v_ok;
  IF NOT v_ok THEN RETURN; END IF;
  UPDATE public.event_messages SET read_at = now()
    WHERE conversation_id = p_conversation_id AND sender_id <> v_reg AND read_at IS NULL;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid, uuid) TO anon, authenticated;

-- 9. get_participant_public
CREATE OR REPLACE FUNCTION public.get_participant_public(p_id uuid)
RETURNS TABLE (id uuid, full_name text, organization text, participant_category text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, full_name, organization, participant_category
  FROM public.event_registrations
  WHERE id = p_id AND is_visible_in_directory = true AND status = 'confirmed'
$$;
GRANT EXECUTE ON FUNCTION public.get_participant_public(uuid) TO anon, authenticated;