
-- Restrict anonymous SELECT on events to non-sensitive columns only
REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (
  id, organization_id, name, slug, description, location,
  starts_at, ends_at, capacity, cover_url, status,
  created_by, created_at, updated_at
) ON public.events TO anon;

-- Authenticated users keep full SELECT (RLS still applies)
GRANT SELECT ON public.events TO authenticated;
