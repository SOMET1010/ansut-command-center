-- ============================================================
-- FIX: live_polls poll_type CHECK constraint
-- La contrainte originale (Lovable) n'accepte que: 'single','multi','rating','text'
-- Le frontend utilise: 'single','multi','rating' (aligné après correction)
-- Cette migration est un no-op si la contrainte est déjà correcte,
-- mais documente l'alignement frontend/DB.
-- ============================================================

-- Supprimer l'ancienne contrainte CHECK si elle existe
ALTER TABLE public.live_polls DROP CONSTRAINT IF EXISTS live_polls_poll_type_check;

-- Recréer avec les valeurs alignées (superset pour compatibilité)
ALTER TABLE public.live_polls ADD CONSTRAINT live_polls_poll_type_check
  CHECK (poll_type IN ('single', 'multi', 'rating', 'text'));
