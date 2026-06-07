
DELETE FROM public.super_admin_bootstrap_emails WHERE lower(email) = 'psomet@ansut.ci';

INSERT INTO public.super_admin_bootstrap_emails (email, note)
VALUES ('patrick.somet@ansut.ci', 'DTDI ANSUT — Patrick Somet, super_admin')
ON CONFLICT (email) DO NOTHING;

-- Rétroactif : si le compte existe déjà, on promeut
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'patrick.somet@ansut.ci'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = u.id AND r.role = 'super_admin'
  );
