-- Fix 1: Restrict directory policy to anon role only.
-- Authenticated users will use list_event_directory() RPC (safe columns) or the admin policy.
DROP POLICY IF EXISTS "registrations_select_directory_public" ON public.event_registrations;

CREATE POLICY "registrations_select_directory_anon"
  ON public.event_registrations FOR SELECT
  TO anon
  USING (is_visible_in_directory = true AND status = 'confirmed');

CREATE OR REPLACE FUNCTION public.list_event_directory(p_event_id uuid, p_category text DEFAULT NULL)
RETURNS TABLE(
  id uuid, full_name text, organization text, "position" text, country text,
  bio text, photo_url text, interests text[], participant_category text, linkedin_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.full_name, r.organization, r."position", r.country, r.bio,
         r.photo_url, r.interests, r.participant_category, r.linkedin_url
  FROM public.event_registrations r
  WHERE r.event_id = p_event_id
    AND r.is_visible_in_directory = true
    AND r.status = 'confirmed'
    AND (p_category IS NULL OR r.participant_category = p_category)
  ORDER BY r.full_name
$$;
GRANT EXECUTE ON FUNCTION public.list_event_directory(uuid, text) TO anon, authenticated;

-- Fix 2: Prevent any non-admin authenticated user from reading event WiFi credentials.
-- Column grants already exclude wifi columns from anon SELECT; do the same for authenticated.
-- Admins read wifi through the new get_event_wifi() RPC.
REVOKE SELECT (wifi_ssid, wifi_password, wifi_encryption) ON public.events FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_event_wifi(p_event_id uuid)
RETURNS TABLE(wifi_ssid text, wifi_password text, wifi_encryption text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'org_admin')
    OR public.has_role(auth.uid(),'staff')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT e.wifi_ssid, e.wifi_password, e.wifi_encryption
  FROM public.events e WHERE e.id = p_event_id;
END $$;
GRANT EXECUTE ON FUNCTION public.get_event_wifi(uuid) TO authenticated;