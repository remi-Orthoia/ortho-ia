-- =====================================================================
-- Migration : quota mensuel 10 CRBOs pour le plan Free
-- Reset automatique le 1er de chaque mois (calculé à la volée depuis
-- crbos.created_at ≥ date_trunc('month', NOW()) — pas de cron nécessaire)
-- =====================================================================

-- 1) Nouvelle limite par défaut : 10 (était 3)
ALTER TABLE subscriptions
  ALTER COLUMN crbo_limit SET DEFAULT 10;

-- 2) Backfill des comptes existants
UPDATE subscriptions SET crbo_limit = 10 WHERE plan = 'free';
UPDATE subscriptions SET crbo_limit = -1 WHERE plan IN ('pro', 'team');

-- 3) RPC : nombre de CRBOs générés par l'utilisatrice pour le mois
--    calendaire en cours (UTC). Source de vérité = table crbos.
CREATE OR REPLACE FUNCTION get_monthly_crbo_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM crbos
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW());
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_monthly_crbo_count(UUID) TO authenticated;
