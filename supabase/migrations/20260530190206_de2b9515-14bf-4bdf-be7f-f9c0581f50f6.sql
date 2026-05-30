ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID;

CREATE INDEX IF NOT EXISTS idx_event_registrations_qr_token
  ON public.event_registrations(qr_token);

CREATE OR REPLACE FUNCTION public.check_in_registration(p_qr_token UUID)
RETURNS TABLE (
  registration_id UUID,
  full_name TEXT,
  email TEXT,
  organization TEXT,
  job_position TEXT,
  event_id UUID,
  event_name TEXT,
  reg_status TEXT,
  checked_at TIMESTAMPTZ,
  already_checked_in BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
  ev_name TEXT;
  was_checked BOOLEAN;
  new_checked_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  IF NOT (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'org_admin')
    OR public.has_role(auth.uid(), 'staff')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT * INTO reg FROM public.event_registrations WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code inconnu';
  END IF;

  SELECT name INTO ev_name FROM public.events WHERE id = reg.event_id;

  was_checked := reg.checked_in_at IS NOT NULL;
  new_checked_at := reg.checked_in_at;

  IF NOT was_checked THEN
    UPDATE public.event_registrations
      SET status = 'checked_in',
          checked_in_at = now(),
          checked_in_by = auth.uid()
      WHERE id = reg.id
      RETURNING event_registrations.checked_in_at INTO new_checked_at;
  END IF;

  registration_id := reg.id;
  full_name := reg.full_name;
  email := reg.email;
  organization := reg.organization;
  job_position := reg.position;
  event_id := reg.event_id;
  event_name := ev_name;
  reg_status := CASE WHEN was_checked THEN reg.status ELSE 'checked_in' END;
  checked_at := new_checked_at;
  already_checked_in := was_checked;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_registration(UUID) TO authenticated;