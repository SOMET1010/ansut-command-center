-- S1-bis : Révocation accès PII anon
-- Cause de l'exposition : GRANT ALL hérité (arwdDxtm) sur anon pour les 3 tables.
-- RLS active mais GRANTs largement ouverts → l'audit flagge correctement le risque.
-- Correction : aligner les GRANTs sur l'intention réelle des policies.

-- 1) newsletter_subscribers : anon ne doit pouvoir QUE s'inscrire (policy newsletter_insert_public)
REVOKE ALL ON public.newsletter_subscribers FROM anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;

-- 2) profiles : toutes les policies sont scopées à authenticated → anon n'a aucun accès légitime
REVOKE ALL ON public.profiles FROM anon;

-- 3) super_admin_bootstrap_emails : seul super_admin lit, handle_new_user() est SECURITY DEFINER
--    → ni anon ni authenticated n'ont besoin d'un accès direct
REVOKE ALL ON public.super_admin_bootstrap_emails FROM anon;
REVOKE ALL ON public.super_admin_bootstrap_emails FROM authenticated;

-- service_role conservé partout (déjà présent), authenticated conservé sur newsletter et profiles.