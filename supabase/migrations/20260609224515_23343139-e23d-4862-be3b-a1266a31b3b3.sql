-- S5 Famille 4 — tables internes / sensibles : retirer tout droit anon
-- authenticated / service_role / RLS inchangés.

REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.audit_trail FROM anon;
REVOKE ALL ON public.security_audit_runs FROM anon;
REVOKE ALL ON public.notification_outbox FROM anon;
REVOKE ALL ON public.session_attendance FROM anon;

-- Rollback :
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_trail TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_audit_runs TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_outbox TO anon;
-- GRANT TRIGGER, TRUNCATE, REFERENCES, MAINTAIN ON public.session_attendance TO anon;