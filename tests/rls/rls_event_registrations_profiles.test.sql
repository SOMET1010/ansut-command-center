-- =====================================================================
-- Integration tests for RLS on `profiles` and `event_registrations`
-- =====================================================================
-- Run with:
--   psql -v ON_ERROR_STOP=1 -f tests/rls/rls_event_registrations_profiles.test.sql
--
-- Strategy:
--   * Seed orgs / users / events / registrations as service_role (bypass RLS).
--   * For each scenario: SET ROLE authenticated and impersonate a JWT via
--     set_config('request.jwt.claims', ...) so auth.uid() resolves correctly.
--   * Assert expected rows count or expected error via DO blocks.
--   * Rollback at the end — no DB pollution.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.impersonate(_user_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', _user_id::text, 'role', 'authenticated')::text,
    true
  );
END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(_actual int, _expected int, _label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF _actual <> _expected THEN
    RAISE EXCEPTION 'FAIL [%]: expected % got %', _label, _expected, _actual;
  ELSE
    RAISE NOTICE 'OK   [%]: %', _label, _actual;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert_raises(_sql text, _label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE _sql;
    RAISE EXCEPTION 'FAIL [%]: expected error, statement succeeded', _label;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'OK   [%]: blocked (%)', _label, SQLERRM;
  END;
END $$;

-- ---------------------------------------------------------------------
-- Seed (as superuser / service-role bypass)
-- ---------------------------------------------------------------------
-- Two orgs
INSERT INTO public.organizations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Org A', 'org-a-test'),
  ('22222222-2222-2222-2222-222222222222', 'Org B', 'org-b-test');

-- Users in auth.users (bypass RLS for setup)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'super@test.local', '', now(), now(), now()),
  ('aaaaaaa2-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-a@test.local', '', now(), now(), now()),
  ('aaaaaaa3-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-b@test.local', '', now(), now(), now()),
  ('aaaaaaa4-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff-a@test.local', '', now(), now(), now()),
  ('aaaaaaa5-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'plain@test.local', '', now(), now(), now()),
  ('aaaaaaa6-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'attendee@test.local', '', now(), now(), now());

-- Profiles (handle_new_user trigger may have created them — upsert org)
INSERT INTO public.profiles (id, email, organization_id) VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', 'super@test.local', NULL),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'admin-a@test.local', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaa3-0000-0000-0000-000000000003', 'admin-b@test.local', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaa4-0000-0000-0000-000000000004', 'staff-a@test.local', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaa5-0000-0000-0000-000000000005', 'plain@test.local', NULL),
  ('aaaaaaa6-0000-0000-0000-000000000006', 'attendee@test.local', NULL)
ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, email = EXCLUDED.email;

-- Roles
INSERT INTO public.user_roles (user_id, role, organization_id) VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', 'super_admin', NULL),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'org_admin', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaa3-0000-0000-0000-000000000003', 'org_admin', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaa4-0000-0000-0000-000000000004', 'staff', '11111111-1111-1111-1111-111111111111');

-- Events (one per org), published
INSERT INTO public.events (id, organization_id, name, slug, starts_at, ends_at, status) VALUES
  ('e1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Evt A', 'evt-a-test', now(), now() + interval '1 day', 'published'),
  ('e2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Evt B', 'evt-b-test', now(), now() + interval '1 day', 'published');

-- Registrations: one per event, plus one for the "attendee" user on event A
INSERT INTO public.event_registrations (id, event_id, full_name, email, status, user_id) VALUES
  ('f1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000001', 'Anon A', 'anon-a@test.local', 'confirmed', NULL),
  ('f2222222-0000-0000-0000-000000000002', 'e2222222-0000-0000-0000-000000000002', 'Anon B', 'anon-b@test.local', 'confirmed', NULL),
  ('f3333333-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000001', 'Attendee', 'attendee@test.local', 'confirmed', 'aaaaaaa6-0000-0000-0000-000000000006');

-- =====================================================================
-- Tests
-- =====================================================================
SET LOCAL ROLE authenticated;

-- ========== profiles SELECT ==========
DO $$
DECLARE c int;
BEGIN
  -- super_admin sees all 6 seeded profiles
  PERFORM pg_temp.impersonate('aaaaaaa1-0000-0000-0000-000000000001');
  SELECT count(*) INTO c FROM public.profiles WHERE id::text LIKE 'aaaaaaa%';
  PERFORM pg_temp.assert_eq(c, 6, 'profiles.select super_admin sees all');

  -- org_admin A sees own profile + profiles in org A (admin-a, staff-a) = 2
  PERFORM pg_temp.impersonate('aaaaaaa2-0000-0000-0000-000000000002');
  SELECT count(*) INTO c FROM public.profiles WHERE id::text LIKE 'aaaaaaa%';
  PERFORM pg_temp.assert_eq(c, 2, 'profiles.select org_admin A scoped to org A');

  -- org_admin A must NOT see admin-b
  SELECT count(*) INTO c FROM public.profiles WHERE id = 'aaaaaaa3-0000-0000-0000-000000000003';
  PERFORM pg_temp.assert_eq(c, 0, 'profiles.select org_admin A cannot see org B profiles');

  -- plain user sees only their own
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  SELECT count(*) INTO c FROM public.profiles WHERE id::text LIKE 'aaaaaaa%';
  PERFORM pg_temp.assert_eq(c, 1, 'profiles.select plain user sees only own');
END $$;

-- ========== profiles UPDATE ==========
DO $$
BEGIN
  -- plain user cannot self-assign to org A
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  PERFORM pg_temp.assert_raises(
    $q$UPDATE public.profiles SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'aaaaaaa5-0000-0000-0000-000000000005'$q$,
    'profiles.update plain user cannot change organization_id'
  );

  -- plain user CAN update own full_name (WITH CHECK preserves id + org)
  UPDATE public.profiles SET full_name = 'New Name' WHERE id = 'aaaaaaa5-0000-0000-0000-000000000005';
  RAISE NOTICE 'OK   [profiles.update plain user can change own full_name]';

  -- plain user cannot update someone else
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  PERFORM pg_temp.assert_eq(
    (WITH u AS (UPDATE public.profiles SET full_name = 'Hack' WHERE id = 'aaaaaaa2-0000-0000-0000-000000000002' RETURNING 1) SELECT count(*) FROM u)::int,
    0,
    'profiles.update plain user cannot touch other profiles (0 rows)'
  );
END $$;

-- ========== event_registrations SELECT ==========
DO $$
DECLARE c int;
BEGIN
  -- super_admin sees all 3 seeded registrations
  PERFORM pg_temp.impersonate('aaaaaaa1-0000-0000-0000-000000000001');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 3, 'registrations.select super_admin sees all');

  -- org_admin A sees only the 2 registrations on event A
  PERFORM pg_temp.impersonate('aaaaaaa2-0000-0000-0000-000000000002');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 2, 'registrations.select org_admin A scoped to org A events');

  -- org_admin A must NOT see registration on event B
  SELECT count(*) INTO c FROM public.event_registrations WHERE id = 'f2222222-0000-0000-0000-000000000002';
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.select org_admin A cannot see org B registrations');

  -- org_admin B symmetric check
  PERFORM pg_temp.impersonate('aaaaaaa3-0000-0000-0000-000000000003');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 1, 'registrations.select org_admin B scoped to org B');

  -- staff A sees the 2 registrations on event A (same scoping as org_admin)
  PERFORM pg_temp.impersonate('aaaaaaa4-0000-0000-0000-000000000004');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 2, 'registrations.select staff A scoped to org A');

  -- attendee user sees only their own registration
  PERFORM pg_temp.impersonate('aaaaaaa6-0000-0000-0000-000000000006');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 1, 'registrations.select attendee sees only own');

  -- plain user (no role, no registration) sees nothing
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  SELECT count(*) INTO c FROM public.event_registrations WHERE id::text LIKE 'f%';
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.select plain user sees nothing');
END $$;

-- ========== event_registrations UPDATE ==========
DO $$
DECLARE c int;
BEGIN
  -- staff A can update status on event A registration (allowed column)
  PERFORM pg_temp.impersonate('aaaaaaa4-0000-0000-0000-000000000004');
  UPDATE public.event_registrations SET status = 'checked_in', checked_in_at = now(), checked_in_by = 'aaaaaaa4-0000-0000-0000-000000000004'
    WHERE id = 'f1111111-0000-0000-0000-000000000001';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 1, 'registrations.update staff A can check-in own org');

  -- staff A CANNOT mutate immutable column email (blocked by WITH CHECK)
  PERFORM pg_temp.assert_raises(
    $q$UPDATE public.event_registrations SET email = 'hijack@test.local' WHERE id = 'f1111111-0000-0000-0000-000000000001'$q$,
    'registrations.update staff A cannot mutate email'
  );

  -- staff A CANNOT mutate immutable column event_id
  PERFORM pg_temp.assert_raises(
    $q$UPDATE public.event_registrations SET event_id = 'e2222222-0000-0000-0000-000000000002' WHERE id = 'f1111111-0000-0000-0000-000000000001'$q$,
    'registrations.update staff A cannot mutate event_id'
  );

  -- staff A CANNOT mutate qr_token
  PERFORM pg_temp.assert_raises(
    $q$UPDATE public.event_registrations SET qr_token = gen_random_uuid() WHERE id = 'f1111111-0000-0000-0000-000000000001'$q$,
    'registrations.update staff A cannot rotate qr_token'
  );

  -- org_admin A cannot touch org B registration (USING fails -> 0 rows)
  PERFORM pg_temp.impersonate('aaaaaaa2-0000-0000-0000-000000000002');
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = 'f2222222-0000-0000-0000-000000000002';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.update org_admin A cannot update org B (0 rows)');

  -- plain user cannot update any registration
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = 'f1111111-0000-0000-0000-000000000001';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.update plain user cannot update (0 rows)');

  -- attendee (owner) also cannot update — only admin/staff have UPDATE policy
  PERFORM pg_temp.impersonate('aaaaaaa6-0000-0000-0000-000000000006');
  UPDATE public.event_registrations SET status = 'cancelled' WHERE id = 'f3333333-0000-0000-0000-000000000003';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.update attendee owner cannot self-cancel');
END $$;

-- ========== event_registrations DELETE ==========
DO $$
DECLARE c int;
BEGIN
  -- staff A cannot delete (DELETE policy is admin-only)
  PERFORM pg_temp.impersonate('aaaaaaa4-0000-0000-0000-000000000004');
  DELETE FROM public.event_registrations WHERE id = 'f1111111-0000-0000-0000-000000000001';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.delete staff cannot delete (0 rows)');

  -- org_admin A cannot delete org B
  PERFORM pg_temp.impersonate('aaaaaaa2-0000-0000-0000-000000000002');
  DELETE FROM public.event_registrations WHERE id = 'f2222222-0000-0000-0000-000000000002';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.delete org_admin A cannot delete org B');

  -- org_admin A CAN delete on own org
  DELETE FROM public.event_registrations WHERE id = 'f1111111-0000-0000-0000-000000000001';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 1, 'registrations.delete org_admin A can delete own org');

  -- super_admin can delete anything
  PERFORM pg_temp.impersonate('aaaaaaa1-0000-0000-0000-000000000001');
  DELETE FROM public.event_registrations WHERE id = 'f2222222-0000-0000-0000-000000000002';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 1, 'registrations.delete super_admin can delete any');

  -- plain user cannot delete
  PERFORM pg_temp.impersonate('aaaaaaa5-0000-0000-0000-000000000005');
  DELETE FROM public.event_registrations WHERE id = 'f3333333-0000-0000-0000-000000000003';
  GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM pg_temp.assert_eq(c, 0, 'registrations.delete plain user cannot delete');
END $$;

-- =====================================================================
-- Cleanup
-- =====================================================================
RESET ROLE;
ROLLBACK;

\echo '======================================'
\echo '  ✅ All RLS tests passed (rolled back)'
\echo '======================================'
