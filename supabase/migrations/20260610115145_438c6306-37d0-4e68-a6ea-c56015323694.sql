REVOKE SELECT (wifi_ssid, wifi_password, wifi_encryption) ON public.events FROM anon, authenticated;
GRANT SELECT (wifi_ssid, wifi_password, wifi_encryption) ON public.events TO service_role;