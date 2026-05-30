
-- Table event_registrations
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed', -- pending, confirmed, cancelled, checked_in
  qr_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE INDEX idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_registrations_user ON public.event_registrations(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT INSERT ON public.event_registrations TO anon;
GRANT ALL ON public.event_registrations TO service_role;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER registrations_updated_at BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validation : refuse insertion si événement non publié OU capacité atteinte
CREATE OR REPLACE FUNCTION public.validate_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev RECORD;
  current_count INT;
BEGIN
  SELECT status, capacity INTO ev FROM public.events WHERE id = NEW.event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Événement introuvable';
  END IF;
  IF ev.status <> 'published' THEN
    RAISE EXCEPTION 'Cet événement n''est pas ouvert aux inscriptions';
  END IF;
  IF ev.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count FROM public.event_registrations
      WHERE event_id = NEW.event_id AND status <> 'cancelled';
    IF current_count >= ev.capacity THEN
      RAISE EXCEPTION 'Capacité maximale atteinte';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_registration() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER registrations_validate BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.validate_registration();

-- RLS event_registrations
CREATE POLICY "registrations_insert_public" ON public.event_registrations FOR INSERT
  WITH CHECK (true); -- la validation est faite par le trigger

CREATE POLICY "registrations_select_admin_or_own" ON public.event_registrations FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "registrations_update_admin" ON public.event_registrations FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "registrations_delete_admin" ON public.event_registrations FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
  );

-- Fonction bootstrap : premier admin
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'super_admin') INTO has_admin;
  IF has_admin THEN
    RAISE EXCEPTION 'Un super administrateur existe déjà';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Fonction publique : un super_admin existe-t-il ?
CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'super_admin');
$$;

REVOKE EXECUTE ON FUNCTION public.super_admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO anon, authenticated;

-- Seed ANSUT
INSERT INTO public.organizations (name, slug, primary_color)
VALUES ('ANSUT', 'ansut', '#1d3a8a')
ON CONFLICT (slug) DO NOTHING;
