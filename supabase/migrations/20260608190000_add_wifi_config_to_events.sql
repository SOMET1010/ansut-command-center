-- ============================================================
-- Ajout de la configuration WiFi à la table events
-- Permet aux organisateurs de configurer le WiFi depuis le Cockpit
-- et aux participants de scanner un QR code pour se connecter
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS wifi_ssid TEXT,
  ADD COLUMN IF NOT EXISTS wifi_password TEXT,
  ADD COLUMN IF NOT EXISTS wifi_encryption TEXT DEFAULT 'WPA'
    CHECK (wifi_encryption IS NULL OR wifi_encryption IN ('WPA', 'WEP', 'nopass'));

-- Commentaires pour documentation
COMMENT ON COLUMN public.events.wifi_ssid IS 'Nom du réseau WiFi de l''événement';
COMMENT ON COLUMN public.events.wifi_password IS 'Mot de passe du réseau WiFi';
COMMENT ON COLUMN public.events.wifi_encryption IS 'Type de chiffrement WiFi (WPA, WEP, ou nopass)';
