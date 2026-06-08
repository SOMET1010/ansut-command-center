-- 1. Storage table
CREATE TABLE IF NOT EXISTS public.security_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  total_issues int NOT NULL,
  trigger_source text NOT NULL DEFAULT 'manual', -- 'manual' | 'ddl' | 'cron'
  ddl_commands text[],
  report jsonb NOT NULL
);

GRANT SELECT ON public.security_audit_runs TO authenticated;
GRANT ALL ON public.security_audit_runs TO service_role;

ALTER TABLE public.security_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_runs_select_super_admin"
  ON public.security_audit_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_security_audit_runs_generated_at
  ON public.security_audit_runs (generated_at DESC);

-- 2. Refactor: internal compute function (no auth gate), used by both manual RPC and trigger.
CREATE OR REPLACE FUNCTION public._security_audit_compute()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rls_disabled jsonb;
  v_permissive jsonb;
  v_pii_exposed jsonb;
  v_def_anon jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object('table', c.relname)), '[]'::jsonb)
  INTO v_rls_disabled
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND NOT c.relrowsecurity AND c.relname NOT LIKE 'pg_%';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', tablename, 'policy', policyname, 'command', cmd
  )), '[]'::jsonb)
  INTO v_permissive
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
    AND (qual = 'true' OR with_check = 'true');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', table_name, 'column', column_name
  )), '[]'::jsonb)
  INTO v_pii_exposed
  FROM information_schema.role_column_grants
  WHERE table_schema = 'public' AND grantee = 'anon' AND privilege_type = 'SELECT'
    AND column_name ~* '(email|phone|password|token|secret|api_key|ssn|credit|wifi_password|wifi_ssid)';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('function', p.proname)), '[]'::jsonb)
  INTO v_def_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND p.proname NOT IN (
      'register_for_event','me_registration','update_my_profile',
      'list_my_conversations','list_conversation_messages','mark_conversation_read',
      'send_conversation_message','start_conversation','get_participant_public',
      'list_my_meetings','create_meeting_request','respond_to_meeting','cancel_my_meeting',
      'list_my_bookmarks','toggle_my_bookmark','record_session_attendance',
      'cast_poll_vote','get_match_recommendations','_reg_from_token',
      'has_role','super_admin_exists','claim_first_admin','list_event_directory'
    );

  RETURN jsonb_build_object(
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
      jsonb_array_length(v_rls_disabled) + jsonb_array_length(v_permissive)
      + jsonb_array_length(v_pii_exposed) + jsonb_array_length(v_def_anon)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public._security_audit_compute() FROM PUBLIC, anon, authenticated;

-- 3. Public RPC: gated + persists the run
CREATE OR REPLACE FUNCTION public.run_security_audit()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog
AS $$
DECLARE v_report jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Accès refusé : super_admin requis';
  END IF;
  v_report := public._security_audit_compute();
  INSERT INTO public.security_audit_runs (generated_at, total_issues, trigger_source, report)
  VALUES (now(), (v_report->>'total_issues')::int, 'manual', v_report);
  RETURN v_report;
END;
$$;

-- 4. DDL event trigger: runs audit after any schema change (migration).
CREATE OR REPLACE FUNCTION public._security_audit_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog
AS $$
DECLARE
  v_report jsonb;
  v_cmds text[];
  r record;
BEGIN
  v_cmds := ARRAY[]::text[];
  FOR r IN SELECT command_tag, object_identity FROM pg_event_trigger_ddl_commands() LOOP
    v_cmds := v_cmds || (r.command_tag || ' ' || COALESCE(r.object_identity,''));
  END LOOP;

  -- Skip noise: changes scoped to our own audit table/functions
  IF EXISTS (
    SELECT 1 FROM unnest(v_cmds) c
    WHERE c LIKE '%security_audit_runs%' OR c LIKE '%_security_audit_%'
  ) AND array_length(v_cmds, 1) <= 4 THEN
    RETURN;
  END IF;

  BEGIN
    v_report := public._security_audit_compute();
    INSERT INTO public.security_audit_runs (
      generated_at, total_issues, trigger_source, ddl_commands, report
    ) VALUES (
      now(), (v_report->>'total_issues')::int, 'ddl', v_cmds, v_report
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never break a migration if the audit itself fails
    NULL;
  END;
END;
$$;

DROP EVENT TRIGGER IF EXISTS security_audit_after_ddl;
CREATE EVENT TRIGGER security_audit_after_ddl
  ON ddl_command_end
  EXECUTE FUNCTION public._security_audit_on_ddl();