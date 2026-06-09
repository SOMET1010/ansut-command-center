-- S5 Famille 2 partielle — event_announcements + live_polls
-- live_poll_votes intentionnellement non touché (différé S7 — RPC d'agrégation à créer).

REVOKE ALL ON public.event_announcements FROM anon;
REVOKE ALL ON public.live_polls          FROM anon;

GRANT SELECT ON public.event_announcements TO anon;
GRANT SELECT ON public.live_polls          TO anon;

-- Rollback :
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_announcements TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_polls          TO anon;