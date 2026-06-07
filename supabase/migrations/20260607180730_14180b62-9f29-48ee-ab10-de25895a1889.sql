
-- =========================================================================
-- 1. PRIVILEGE ESCALATION FIX — user_roles INSERT/DELETE/UPDATE policies
-- =========================================================================
-- Without these, any authenticated user could insert a row granting
-- themselves super_admin/org_admin/staff.

CREATE POLICY "user_roles_insert_super_admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "user_roles_delete_super_admin"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "user_roles_update_super_admin"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Note: claim_first_admin() and handle_new_user() are SECURITY DEFINER
-- and continue to work because they bypass RLS.


-- =========================================================================
-- 2. EVENT REGISTRATIONS — tighten public INSERT policy
-- =========================================================================
-- Previously WITH CHECK (true) allowed anyone to insert a registration
-- for any event_id, even draft/cancelled events.

DROP POLICY IF EXISTS "registrations_insert_public" ON public.event_registrations;

CREATE POLICY "registrations_insert_public"
  ON public.event_registrations
  FOR INSERT
  TO public
  WITH CHECK (
    -- The target event must exist and be published
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.status = 'published'
    )
    -- Basic input hygiene
    AND full_name IS NOT NULL
    AND length(btrim(full_name)) BETWEEN 1 AND 200
    AND email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND (phone IS NULL OR length(phone) <= 32)
    AND (organization IS NULL OR length(organization) <= 200)
    AND (position IS NULL OR length(position) <= 200)
    -- Anonymous registration: user_id must be NULL.
    -- Authenticated registration: user_id must match the caller.
    AND (
      (auth.uid() IS NULL AND user_id IS NULL)
      OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    )
    -- Anyone trying to set staff-only fields is blocked
    AND status = 'confirmed'
    AND checked_in_at IS NULL
    AND checked_in_by IS NULL
  );


-- =========================================================================
-- 3. NEWSLETTER — tighten public INSERT policy
-- =========================================================================

DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscribers;

CREATE POLICY "newsletter_insert_public"
  ON public.newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND (source IS NULL OR length(source) <= 100)
    -- Subscribers cannot mark themselves confirmed or unsubscribed
    AND confirmed_at IS NULL
    AND unsubscribed_at IS NULL
  );


-- =========================================================================
-- 4. SECURITY DEFINER FUNCTIONS — revoke direct EXECUTE where unsafe
-- =========================================================================
-- These functions are either used internally by triggers or by RLS policies.
-- They do not need to be callable directly by anon/authenticated clients
-- via PostgREST RPC.

REVOKE EXECUTE ON FUNCTION public.handle_new_user()       FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()         FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_registration()  FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.super_admin_exists()     FROM anon, public;

-- Keep these callable — they are intentionally invoked by clients:
--   claim_first_admin()                : signed-in user bootstraps first admin
--   check_in_registration(uuid)        : staff/admin scan QR codes
--   register_for_event(...)            : public event registration RPC
--   super_admin_exists()               : kept for authenticated (bootstrap UI hint)
GRANT EXECUTE ON FUNCTION public.claim_first_admin()                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_registration(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_exists()                          TO authenticated;
