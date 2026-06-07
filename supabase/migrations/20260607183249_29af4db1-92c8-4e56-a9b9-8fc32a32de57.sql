CREATE OR REPLACE FUNCTION public.run_rls_tests()
RETURNS TABLE(result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  org_a uuid := '11111111-1111-1111-1111-111111111111';
  org_b uuid := '22222222-2222-2222-2222-222222222222';
  u_super uuid := 'a0000001-0000-0000-0000-000000000001';
  u_admin_a uuid := 'a0000002-0000-0000-0000-000000000002';
  u_admin_b uuid := 'a0000003-0000-0000-0000-000000000003';
  u_staff_a uuid := 'a0000004-0000-0000-0000-000000000004';
  u_plain uuid := 'a0000005-0000-0000-0000-000000000005';
  u_attendee uuid := 'a0000006-0000-0000-0000-000000000006';
  ev_a uuid := 'e1111111-0000-0000-0000-000000000001';
  ev_b uuid := 'e2222222-0000-0000-0000-000000000002';
  reg_a1 uuid := 'f1111111-0000-0000-0000-000000000001';
  reg_b1 uuid := 'f2222222-0000-0000-0000-000000000002';
  reg_a2 uuid := 'f3333333-0000-0000-0000-000000000003';
  c int;
  pass_count int := 0;
  fail_count int := 0;
  lines text[] := '{}';
  ln text;
  did_raise boolean;
BEGIN
  ---------------------------------------------------------------------
  -- SEED (definer privileges → bypasses RLS & FK checks)
  ---------------------------------------------------------------------
  INSERT INTO public.organizations (id, name, slug) VALUES
    (org_a, '__test_org_a', '__test-org-a'),
    (org_b, '__test_org_b', '__test-org-b');

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, email_confirmed_at)
  VALUES
    (u_super,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_super@test.local',    '', now(), now(), now()),
    (u_admin_a,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_admin_a@test.local',  '', now(), now(), now()),
    (u_admin_b,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_admin_b@test.local',  '', now(), now(), now()),
    (u_staff_a,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_staff_a@test.local',  '', now(), now(), now()),
    (u_plain,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_plain@test.local',    '', now(), now(), now()),
    (u_attendee, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '__rlstest_attendee@test.local', '', now(), now(), now());

  UPDATE public.profiles SET organization_id = org_a WHERE id = u_admin_a;
  UPDATE public.profiles SET organization_id = org_b WHERE id = u_admin_b;
  UPDATE public.profiles SET organization_id = org_a WHERE id = u_staff_a;

  INSERT INTO public.user_roles (user_id, role, organization_id) VALUES
    (u_super,   'super_admin', NULL),
    (u_admin_a, 'org_admin',   org_a),
    (u_admin_b, 'org_admin',   org_b),
    (u_staff_a, 'staff',       org_a);

  INSERT INTO public.events (id, organization_id, name, slug, starts_at, ends_at, status) VALUES
    (ev_a, org_a, '__test_evt_a', '__test-evt-a', now(), now() + interval '1 day', 'published'),
    (ev_b, org_b, '__test_evt_b', '__test-evt-b', now(), now() + interval '1 day', 'published');

  INSERT INTO public.event_registrations (id, event_id, full_name, email, status, user_id) VALUES
    (reg_a1, ev_a, 'Anon A',   '__rlstest_anon_a@test.local',  'confirmed', NULL),
    (reg_b1, ev_b, 'Anon B',   '__rlstest_anon_b@test.local',  'confirmed', NULL),
    (reg_a2, ev_a, 'Attendee', '__rlstest_attendee@test.local','confirmed', u_attendee);

  ---------------------------------------------------------------------
  -- profiles SELECT
  ---------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_super::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.profiles WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 6 THEN lines := array_append(lines, 'OK   | profiles.select super_admin sees all 6'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.select super_admin sees all 6 (got '||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_admin_a::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.profiles WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 2 THEN lines := array_append(lines, 'OK   | profiles.select org_admin A scoped to own org (self + staff_a)'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.select org_admin A scoped to own org (got '||c||', expected 2)'); fail_count := fail_count+1; END IF;

  SELECT count(*) INTO c FROM public.profiles WHERE id = u_admin_b;
  IF c = 0 THEN lines := array_append(lines, 'OK   | profiles.select org_admin A cannot see org B admin'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.select org_admin A leak (saw org B admin)'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.profiles WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 1 THEN lines := array_append(lines, 'OK   | profiles.select plain user sees only own'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.select plain user (got '||c||', expected 1)'); fail_count := fail_count+1; END IF;

  ---------------------------------------------------------------------
  -- profiles UPDATE
  ---------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  did_raise := false;
  BEGIN
    EXECUTE format('UPDATE public.profiles SET organization_id = %L WHERE id = %L', org_a, u_plain);
  EXCEPTION WHEN OTHERS THEN did_raise := true;
  END;
  -- WITH CHECK comparing organization_id to current may fail silently if value is NULL on both sides.
  -- Verify the value was NOT changed instead:
  RESET ROLE;
  SELECT organization_id IS NULL INTO did_raise FROM public.profiles WHERE id = u_plain;
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  IF did_raise THEN lines := array_append(lines, 'OK   | profiles.update plain user cannot self-assign to org'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.update plain user DID change organization_id'); fail_count := fail_count+1; END IF;

  UPDATE public.profiles SET full_name = 'New Name' WHERE id = u_plain;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 1 THEN lines := array_append(lines, 'OK   | profiles.update plain user can change own full_name'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.update plain user blocked from own full_name (rows='||c||')'); fail_count := fail_count+1; END IF;

  UPDATE public.profiles SET full_name = 'Hack' WHERE id = u_admin_a;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | profiles.update plain user cannot touch others'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | profiles.update plain user mutated another profile'); fail_count := fail_count+1; END IF;

  ---------------------------------------------------------------------
  -- event_registrations SELECT
  ---------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_super::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 3 THEN lines := array_append(lines, 'OK   | registrations.select super_admin sees all 3'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select super_admin (got '||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_admin_a::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 2 THEN lines := array_append(lines, 'OK   | registrations.select org_admin A scoped to org A'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select org_admin A (got '||c||', expected 2)'); fail_count := fail_count+1; END IF;

  SELECT count(*) INTO c FROM public.event_registrations WHERE id = reg_b1;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.select org_admin A cannot see org B reg'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select org_admin A leaked org B reg'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_admin_b::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 1 THEN lines := array_append(lines, 'OK   | registrations.select org_admin B scoped to org B'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select org_admin B (got '||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_staff_a::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 2 THEN lines := array_append(lines, 'OK   | registrations.select staff A scoped to org A'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select staff A (got '||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 1 THEN lines := array_append(lines, 'OK   | registrations.select attendee sees only own'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select attendee (got '||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO c FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.select plain user sees nothing'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.select plain user (got '||c||', expected 0)'); fail_count := fail_count+1; END IF;

  ---------------------------------------------------------------------
  -- event_registrations UPDATE
  ---------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_staff_a::text, 'role', 'authenticated')::text, true);
  UPDATE public.event_registrations SET status = 'checked_in', checked_in_at = now(), checked_in_by = u_staff_a WHERE id = reg_a1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 1 THEN lines := array_append(lines, 'OK   | registrations.update staff A can check-in own org'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update staff A blocked from check-in'); fail_count := fail_count+1; END IF;

  -- immutable email
  did_raise := false;
  BEGIN
    EXECUTE format('UPDATE public.event_registrations SET email = %L WHERE id = %L', 'hijack@x.io', reg_a1);
  EXCEPTION WHEN OTHERS THEN did_raise := true;
  END;
  RESET ROLE;
  SELECT email = '__rlstest_anon_a@test.local' INTO did_raise FROM public.event_registrations WHERE id = reg_a1;
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_staff_a::text, 'role', 'authenticated')::text, true);
  IF did_raise THEN lines := array_append(lines, 'OK   | registrations.update staff cannot mutate email (immutable)'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update staff DID change email'); fail_count := fail_count+1; END IF;

  -- immutable event_id
  BEGIN
    EXECUTE format('UPDATE public.event_registrations SET event_id = %L WHERE id = %L', ev_b, reg_a1);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  SELECT event_id = ev_a INTO did_raise FROM public.event_registrations WHERE id = reg_a1;
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_staff_a::text, 'role', 'authenticated')::text, true);
  IF did_raise THEN lines := array_append(lines, 'OK   | registrations.update staff cannot mutate event_id (immutable)'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update staff DID change event_id'); fail_count := fail_count+1; END IF;

  -- org_admin A cannot touch org B
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_admin_a::text, 'role', 'authenticated')::text, true);
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = reg_b1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.update org_admin A cannot update org B'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update org_admin A modified org B (rows='||c||')'); fail_count := fail_count+1; END IF;

  -- plain user cannot update
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = reg_a1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.update plain user cannot update'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update plain user updated (rows='||c||')'); fail_count := fail_count+1; END IF;

  -- attendee owner cannot update
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = reg_a2;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.update attendee owner cannot self-modify'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.update attendee owner modified own row'); fail_count := fail_count+1; END IF;

  ---------------------------------------------------------------------
  -- event_registrations DELETE
  ---------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_staff_a::text, 'role', 'authenticated')::text, true);
  DELETE FROM public.event_registrations WHERE id = reg_a1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.delete staff cannot delete'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.delete staff DID delete'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_admin_a::text, 'role', 'authenticated')::text, true);
  DELETE FROM public.event_registrations WHERE id = reg_b1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.delete org_admin A cannot delete org B'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.delete org_admin A deleted org B'); fail_count := fail_count+1; END IF;

  DELETE FROM public.event_registrations WHERE id = reg_a1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 1 THEN lines := array_append(lines, 'OK   | registrations.delete org_admin A can delete own org'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.delete org_admin A blocked from own org (rows='||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_super::text, 'role', 'authenticated')::text, true);
  DELETE FROM public.event_registrations WHERE id = reg_b1;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 1 THEN lines := array_append(lines, 'OK   | registrations.delete super_admin can delete any'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.delete super_admin blocked (rows='||c||')'); fail_count := fail_count+1; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_plain::text, 'role', 'authenticated')::text, true);
  DELETE FROM public.event_registrations WHERE id = reg_a2;
  GET DIAGNOSTICS c = ROW_COUNT;
  IF c = 0 THEN lines := array_append(lines, 'OK   | registrations.delete plain user cannot delete'); pass_count := pass_count+1;
  ELSE lines := array_append(lines, 'FAIL | registrations.delete plain user DID delete'); fail_count := fail_count+1; END IF;

  ---------------------------------------------------------------------
  -- CLEANUP
  ---------------------------------------------------------------------
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  DELETE FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
  DELETE FROM public.events WHERE slug LIKE '\_\_test-evt%' ESCAPE '\';
  DELETE FROM public.user_roles WHERE user_id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
  DELETE FROM public.profiles WHERE id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
  DELETE FROM auth.users WHERE id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
  DELETE FROM public.organizations WHERE id IN (org_a, org_b);

  lines := array_append(lines, '------------------------------------------------------------');
  lines := array_append(lines, format('SUMMARY: %s passed, %s failed', pass_count, fail_count));

  FOREACH ln IN ARRAY lines LOOP
    result := ln;
    RETURN NEXT;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);
  BEGIN
    DELETE FROM public.event_registrations WHERE email LIKE '\_\_rlstest\_%' ESCAPE '\';
    DELETE FROM public.events WHERE slug LIKE '\_\_test-evt%' ESCAPE '\';
    DELETE FROM public.user_roles WHERE user_id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
    DELETE FROM public.profiles WHERE id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
    DELETE FROM auth.users WHERE id IN (u_super, u_admin_a, u_admin_b, u_staff_a, u_plain, u_attendee);
    DELETE FROM public.organizations WHERE id IN (org_a, org_b);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RAISE;
END
$fn$;

REVOKE ALL ON FUNCTION public.run_rls_tests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_rls_tests() TO service_role;