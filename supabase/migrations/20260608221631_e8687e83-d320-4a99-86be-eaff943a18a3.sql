-- Lot S4 / M4-A : event_registrations — suppression policy orpheline
-- La policy `registrations_select_directory_anon` est inopérante depuis S1-bis
-- (GRANT SELECT à anon révoqué). On la supprime pour rendre l'intention
-- explicite : l'annuaire public passe uniquement par la RPC SECURITY DEFINER
-- `list_event_networking` (qui projette uniquement les colonnes non-PII).
--
-- Rollback :
-- CREATE POLICY "registrations_select_directory_anon"
--   ON public.event_registrations FOR SELECT TO anon
--   USING (is_visible_in_directory = true AND status = 'confirmed');

DROP POLICY IF EXISTS "registrations_select_directory_anon" ON public.event_registrations;