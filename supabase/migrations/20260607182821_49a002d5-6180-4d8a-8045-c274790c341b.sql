-- =========================================================
-- Hardening RLS: event_registrations & profiles
-- =========================================================

-- ---------- Helper: org of current user (security definer) ----------
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ---------- Helper: org of an event (security definer, bypass RLS) ----------
CREATE OR REPLACE FUNCTION public.event_org(_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.events WHERE id = _event_id
$$;

-- =========================================================
-- profiles
-- =========================================================

-- Tighten SELECT: org_admin only sees profiles in their own org
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND organization_id IS NOT NULL
      AND organization_id = public.current_user_org()
    )
  );

-- Tighten UPDATE: add WITH CHECK so users cannot mutate id or change org
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND id = (SELECT p.id FROM public.profiles p WHERE p.id = auth.uid())
    AND organization_id IS NOT DISTINCT FROM (
      SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Tighten INSERT: forbid self-assigning to an arbitrary organization
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND organization_id IS NULL  -- org assignment is admin-only (separate policy if needed)
  );

-- Super admin can update any profile (including org assignment)
DROP POLICY IF EXISTS profiles_update_super_admin ON public.profiles;
CREATE POLICY profiles_update_super_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- =========================================================
-- event_registrations
-- =========================================================

-- SELECT: scope org_admin/staff to their organization's events
DROP POLICY IF EXISTS registrations_select_admin_or_own ON public.event_registrations;
CREATE POLICY registrations_select_admin_or_own ON public.event_registrations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR (
      (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'staff'))
      AND public.event_org(event_id) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  );

-- UPDATE: add WITH CHECK to forbid mutating event_id, qr_token, user_id, email, identity
-- and scope org_admin/staff to their org
DROP POLICY IF EXISTS registrations_update_admin ON public.event_registrations;
CREATE POLICY registrations_update_admin ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'staff'))
      AND public.event_org(event_id) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  )
  WITH CHECK (
    -- immutable columns: event_id, qr_token, user_id, email, full_name, created_at
    event_id = (SELECT r.event_id FROM public.event_registrations r WHERE r.id = event_registrations.id)
    AND qr_token = (SELECT r.qr_token FROM public.event_registrations r WHERE r.id = event_registrations.id)
    AND user_id IS NOT DISTINCT FROM (SELECT r.user_id FROM public.event_registrations r WHERE r.id = event_registrations.id)
    AND email = (SELECT r.email FROM public.event_registrations r WHERE r.id = event_registrations.id)
    AND full_name = (SELECT r.full_name FROM public.event_registrations r WHERE r.id = event_registrations.id)
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR (
        (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'staff'))
        AND public.event_org(event_id) = public.current_user_org()
      )
    )
  );

-- DELETE: scope org_admin to their org
DROP POLICY IF EXISTS registrations_delete_admin ON public.event_registrations;
CREATE POLICY registrations_delete_admin ON public.event_registrations
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND public.event_org(event_id) = public.current_user_org()
      AND public.current_user_org() IS NOT NULL
    )
  );

-- Note: registrations_insert_public unchanged — already strictly validated.
