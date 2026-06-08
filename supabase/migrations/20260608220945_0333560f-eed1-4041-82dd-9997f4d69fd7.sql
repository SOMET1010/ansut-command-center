-- Correctif : retirer EXECUTE TO PUBLIC (héritage par défaut Postgres) puis grants explicites.

-- B1 : check_in_registration → authenticated only (staff/org_admin/super_admin gated en interne)
REVOKE EXECUTE ON FUNCTION public.check_in_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_in_registration(uuid) TO authenticated, service_role;

-- B2 : get_event_wifi → authenticated only (idem)
REVOKE EXECUTE ON FUNCTION public.get_event_wifi(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_wifi(uuid) TO authenticated, service_role;

-- B4 : _security_audit_on_ddl → interne (event trigger), aucun rôle API
REVOKE EXECUTE ON FUNCTION public._security_audit_on_ddl() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._security_audit_on_ddl() TO service_role;