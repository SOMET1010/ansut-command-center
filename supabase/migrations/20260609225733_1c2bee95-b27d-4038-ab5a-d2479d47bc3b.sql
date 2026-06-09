-- S5 Famille 3 — events + organizations
-- SELECT sur events intentionnellement non touché (comportement publishable key à clarifier S7).

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON public.events FROM anon;

REVOKE ALL ON public.organizations FROM anon;

-- Rollback :
-- GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.events TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon;