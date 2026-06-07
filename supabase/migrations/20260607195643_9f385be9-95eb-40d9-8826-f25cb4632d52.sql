
ALTER TABLE public.event_session_speakers
  ADD COLUMN IF NOT EXISTS role text;
