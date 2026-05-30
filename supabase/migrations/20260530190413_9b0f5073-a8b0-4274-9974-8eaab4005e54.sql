CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_organization TEXT,
  p_position TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token UUID;
BEGIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Nom requis';
  END IF;
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email requis';
  END IF;

  INSERT INTO public.event_registrations
    (event_id, full_name, email, phone, organization, position)
  VALUES
    (p_event_id, trim(p_full_name), lower(trim(p_email)),
     NULLIF(trim(p_phone), ''), NULLIF(trim(p_organization), ''), NULLIF(trim(p_position), ''))
  RETURNING qr_token INTO new_token;

  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;