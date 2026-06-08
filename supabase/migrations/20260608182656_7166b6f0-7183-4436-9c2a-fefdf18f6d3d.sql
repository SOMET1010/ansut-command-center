
CREATE OR REPLACE FUNCTION public.run_security_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rls_disabled jsonb;
  v_permissive jsonb;
  v_pii_exposed jsonb;
  v_def_anon jsonb;
  v_summary jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Accès refusé : super_admin requis';
  END IF;

  -- 1. Tables in public schema without RLS
  SELECT COALESCE(jsonb_agg(jsonb_build_object('table', c.relname)), '[]'::jsonb)
  INTO v_rls_disabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity
    AND c.relname NOT LIKE 'pg_%';

  -- 2. Permissive RLS policies (USING true or WITH CHECK true) on write ops
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', tablename, 'policy', policyname, 'command', cmd
  )), '[]'::jsonb)
  INTO v_permissive
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
    AND (qual = 'true' OR with_check = 'true');

  -- 3. Sensitive columns granted to anon
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', table_name, 'column', column_name
  )), '[]'::jsonb)
  INTO v_pii_exposed
  FROM information_schema.role_column_grants
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND privilege_type = 'SELECT'
    AND column_name ~* '(email|phone|password|token|secret|api_key|ssn|credit|wifi_password|wifi_ssid)';

  -- 4. SECURITY DEFINER functions executable by anon
  SELECT COALESCE(jsonb_agg(jsonb_build_object('function', p.proname)), '[]'::jsonb)
  INTO v_def_anon
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND p.proname NOT IN (
      -- Whitelist: intentionally callable by anon (participant RPCs validating qr_token)
      'register_for_event','me_registration','update_my_profile',
      'list_my_conversations','list_conversation_messages','mark_conversation_read',
      'send_conversation_message','start_conversation','get_participant_public',
      'list_my_meetings','create_meeting_request','respond_to_meeting','cancel_my_meeting',
      'list_my_bookmarks','toggle_my_bookmark','record_session_attendance',
      'cast_poll_vote','get_match_recommendations','_reg_from_token',
      'has_role','super_admin_exists','claim_first_admin'
    );

  v_summary := jsonb_build_object(
    'generated_at', now(),
    'checks', jsonb_build_object(
      'rls_disabled_tables', v_rls_disabled,
      'permissive_write_policies', v_permissive,
      'sensitive_columns_exposed_to_anon', v_pii_exposed,
      'security_definer_callable_by_anon', v_def_anon
    ),
    'counts', jsonb_build_object(
      'rls_disabled', jsonb_array_length(v_rls_disabled),
      'permissive', jsonb_array_length(v_permissive),
      'pii_exposed', jsonb_array_length(v_pii_exposed),
      'definer_anon', jsonb_array_length(v_def_anon)
    ),
    'total_issues',
      jsonb_array_length(v_rls_disabled)
      + jsonb_array_length(v_permissive)
      + jsonb_array_length(v_pii_exposed)
      + jsonb_array_length(v_def_anon)
  );

  RETURN v_summary;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_security_audit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_security_audit() TO authenticated;
