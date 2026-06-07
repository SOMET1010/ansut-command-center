-- Ajout du champ telegram_username pour permettre les notifications Telegram
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Index pour recherche par telegram_username
CREATE INDEX IF NOT EXISTS idx_event_registrations_telegram
  ON public.event_registrations(telegram_username)
  WHERE telegram_username IS NOT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN public.event_registrations.telegram_username IS
  'Nom d''utilisateur Telegram (sans @) pour les notifications. Optionnel.';
