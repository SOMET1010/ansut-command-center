ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS wifi_ssid TEXT,
  ADD COLUMN IF NOT EXISTS wifi_password TEXT,
  ADD COLUMN IF NOT EXISTS wifi_encryption TEXT DEFAULT 'WPA'
    CHECK (wifi_encryption IS NULL OR wifi_encryption IN ('WPA', 'WEP', 'nopass'));