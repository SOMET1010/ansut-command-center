-- Defensive: re-assert REVOKEs of sensitive columns from the anon role.
-- These statements are idempotent — running them twice is harmless.

-- events: WiFi credentials must never be exposed to anon
REVOKE SELECT (wifi_ssid, wifi_password, wifi_encryption)
  ON public.events FROM anon;

-- event_registrations: PII columns must never be exposed to anon
REVOKE SELECT (email, phone, qr_token, country, user_id, checked_in_at, checked_in_by)
  ON public.event_registrations FROM anon;

-- Also revoke from PUBLIC (the implicit role) just to be safe
REVOKE SELECT (wifi_ssid, wifi_password, wifi_encryption)
  ON public.events FROM PUBLIC;
REVOKE SELECT (email, phone, qr_token, country, user_id, checked_in_at, checked_in_by)
  ON public.event_registrations FROM PUBLIC;