-- S5 Famille 1 — sessions / speakers : restreindre anon à SELECT
-- Avant : anon = arwdDxtm (ALL). Après : anon = SELECT uniquement.
-- RLS inchangé (policies M4b-A en place). Aucun changement UX.

REVOKE ALL ON public.event_sessions FROM anon;
REVOKE ALL ON public.event_speakers FROM anon;
REVOKE ALL ON public.event_session_speakers FROM anon;

GRANT SELECT ON public.event_sessions TO anon;
GRANT SELECT ON public.event_speakers TO anon;
GRANT SELECT ON public.event_session_speakers TO anon;

-- Rollback :
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_speakers TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_session_speakers TO anon;