-- Extension de la RPC register_for_event pour accepter le champ telegram_username.
-- Le paramètre est optionnel (DEFAULT '') pour ne pas casser les appels existants.

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_organization TEXT,
  p_position TEXT,
  p_telegram_username TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr_token UUID;
BEGIN
  INSERT INTO public.event_registrations (
    event_id, full_name, email, phone, organization, position, telegram_username
  )
  VALUES (
    p_event_id,
    trim(p_full_name),
    lower(trim(p_email)),
    nullif(trim(p_phone), ''),
    nullif(trim(p_organization), ''),
    nullif(trim(p_position), ''),
    nullif(trim(p_telegram_username), '')
  )
  RETURNING qr_token INTO v_qr_token;

  RETURN v_qr_token;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.register_for_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
