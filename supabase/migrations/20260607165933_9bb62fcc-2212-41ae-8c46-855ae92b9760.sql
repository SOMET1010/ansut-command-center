
CREATE TABLE IF NOT EXISTS public.super_admin_bootstrap_emails (
  email text PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.super_admin_bootstrap_emails TO authenticated;
GRANT ALL ON public.super_admin_bootstrap_emails TO service_role;
ALTER TABLE public.super_admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins read bootstrap list" ON public.super_admin_bootstrap_emails;
CREATE POLICY "Super admins read bootstrap list"
  ON public.super_admin_bootstrap_emails
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.super_admin_bootstrap_emails (email, note)
VALUES ('psomet@ansut.ci', 'DG ANSUT — auto super_admin')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF EXISTS (
    SELECT 1 FROM public.super_admin_bootstrap_emails
    WHERE lower(email) = lower(NEW.email)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'super_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  END IF;

  RETURN NEW;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
JOIN public.super_admin_bootstrap_emails w ON lower(w.email) = lower(u.email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = u.id AND r.role = 'super_admin'
);
