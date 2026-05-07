-- =====================================================================
-- Migration : protection anti-abus du freemium
--
-- Ajoute :
--   - signup_ip / signup_user_agent / signup_at sur profiles
--   - table abuse_signals (logs : signup, blocked, quota_reached)
--   - RPC count_recent_signups_by_ip (utilisée au precheck inscription)
--   - RPC log_abuse_signal (insertion sécurisée depuis routes API)
--
-- Stratégie : un même IP ne peut créer plus de 2 comptes en 30j.
-- Les emails jetables (mailinator, yopmail, etc.) sont rejetés côté API.
-- Tout est loggé dans abuse_signals pour analyse.
-- =====================================================================

-- 1) Fingerprint d'inscription sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_ip TEXT,
  ADD COLUMN IF NOT EXISTS signup_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS signup_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip ON profiles(signup_ip);
CREATE INDEX IF NOT EXISTS idx_profiles_signup_at ON profiles(signup_at DESC);

-- 2) Table de logs d'abus
CREATE TABLE IF NOT EXISTS abuse_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT,
  user_agent TEXT,
  email TEXT,
  user_id UUID,
  event TEXT NOT NULL,            -- 'signup' | 'blocked' | 'quota_reached'
  reason TEXT,                    -- 'disposable_email' | 'ip_rate_limit' | ...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_signals_ip ON abuse_signals(ip);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_event ON abuse_signals(event);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_created_at ON abuse_signals(created_at DESC);

-- RLS : table interne, jamais lue depuis le client. Pas de policy SELECT
-- → invisible aux utilisateurs. Inserts uniquement via RPC SECURITY DEFINER.
ALTER TABLE abuse_signals ENABLE ROW LEVEL SECURITY;

-- 3) RPC : compte les inscriptions récentes (30j) pour une IP donnée.
-- Appelée AVANT l'inscription (utilisateur anon), donc SECURITY DEFINER pour
-- bypasser la RLS de profiles.
CREATE OR REPLACE FUNCTION count_recent_signups_by_ip(p_ip TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_ip IS NULL OR p_ip = '' THEN
    RETURN 0;
  END IF;
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM profiles
  WHERE signup_ip = p_ip
    AND signup_at >= NOW() - INTERVAL '30 days';
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION count_recent_signups_by_ip(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION count_recent_signups_by_ip(TEXT) TO anon, authenticated;

-- 4) RPC : insertion abuse_signals depuis routes API (anon ou authentifié)
CREATE OR REPLACE FUNCTION log_abuse_signal(
  p_ip TEXT,
  p_user_agent TEXT,
  p_email TEXT,
  p_user_id UUID,
  p_event TEXT,
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO abuse_signals (ip, user_agent, email, user_id, event, reason)
  VALUES (p_ip, p_user_agent, p_email, p_user_id, p_event, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION log_abuse_signal(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_abuse_signal(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
