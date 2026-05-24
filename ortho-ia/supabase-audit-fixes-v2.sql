-- =====================================================================
-- Migration : supabase-audit-fixes-v2.sql
-- Date      : 2026-05-24 (audit live via MCP Supabase)
-- Projet    : psxngyjpshweknwrhpck
--
-- Objet : delta REEL entre code applicatif et schema prod, mesure cette
-- fois en live (et non par inspection statique des fichiers .sql comme
-- la v1 du 2026-05-24 17h54).
--
-- Couvre :
--   §1 — 4 tables referencees par le code mais ABSENTES en DB
--        (ortho_feedbacks, bilan_references, previous_bilans, session_journal)
--   §2 — crbos.updated_at + trigger (manquant)
--   §3 — Index manquants sur 4 FK (advisor perfo)
--   §4 — search_path fige sur 6 fonctions (advisor secu)
--   §5 — REVOKE EXECUTE sur 4 fonctions SECURITY DEFINER (advisor secu)
--   §6 — Note manuelle : activer leaked_password_protection (dashboard Auth)
--
-- Idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, etc.).
-- A executer dans le SQL Editor Supabase Studio.
-- =====================================================================

-- =====================================================================
-- §1 — 4 TABLES MANQUANTES
-- =====================================================================
-- Toutes les nouvelles policies utilisent `(select auth.uid())` pour
-- eviter l'eval par ligne (lint auth_rls_initplan), contrairement aux
-- migrations originales (supabase-{ortho-feedbacks,bilan-references,
-- previous-bilans,session-journal}.sql) qui utilisaient `auth.uid()` nu.
-- =====================================================================

-- §1.1 ortho_feedbacks --------------------------------------------------
CREATE TABLE IF NOT EXISTS ortho_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crbo_id UUID REFERENCES crbos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  qualite_score INT CHECK (qualite_score BETWEEN 1 AND 5),
  modifications TEXT,
  sections_modifiees TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_user ON ortho_feedbacks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_score ON ortho_feedbacks(qualite_score);
CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_crbo ON ortho_feedbacks(crbo_id);

ALTER TABLE ortho_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ortho_owns_feedbacks" ON ortho_feedbacks;
CREATE POLICY "ortho_owns_feedbacks"
  ON ortho_feedbacks FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- §1.2 bilan_references -------------------------------------------------
CREATE TABLE IF NOT EXISTS bilan_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL,
  profil_type TEXT,
  tranche_age TEXT,
  input_scores JSONB,
  input_notes TEXT,
  output_crbo_cible TEXT,
  output_crbo_genere TEXT,
  valide_par TEXT,
  qualite_score INT CHECK (qualite_score BETWEEN 1 AND 5),
  corrections TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_bilan_refs_test_type ON bilan_references(test_type, tranche_age);
CREATE INDEX IF NOT EXISTS idx_bilan_refs_quality ON bilan_references(qualite_score) WHERE qualite_score >= 4;
CREATE INDEX IF NOT EXISTS idx_bilan_refs_user ON bilan_references(user_id, created_at DESC);

ALTER TABLE bilan_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ortho_owns_references" ON bilan_references;
CREATE POLICY "ortho_owns_references"
  ON bilan_references FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- §1.3 previous_bilans --------------------------------------------------
CREATE TABLE IF NOT EXISTS previous_bilans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  extracted_data JSONB NOT NULL,
  original_filename TEXT,
  source_format TEXT,
  bilan_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_previous_bilans_user_id ON previous_bilans(user_id);
CREATE INDEX IF NOT EXISTS idx_previous_bilans_patient_id ON previous_bilans(patient_id);
CREATE INDEX IF NOT EXISTS idx_previous_bilans_created_at ON previous_bilans(created_at DESC);

ALTER TABLE previous_bilans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own previous_bilans" ON previous_bilans;
CREATE POLICY "Users can view own previous_bilans" ON previous_bilans
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own previous_bilans" ON previous_bilans;
CREATE POLICY "Users can insert own previous_bilans" ON previous_bilans
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own previous_bilans" ON previous_bilans;
CREATE POLICY "Users can update own previous_bilans" ON previous_bilans
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own previous_bilans" ON previous_bilans;
CREATE POLICY "Users can delete own previous_bilans" ON previous_bilans
  FOR DELETE USING ((select auth.uid()) = user_id);

-- §1.4 session_journal --------------------------------------------------
CREATE TABLE IF NOT EXISTS session_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 10000),
  category TEXT CHECK (category IS NULL OR category IN ('observation', 'idee', 'rappel', 'formation', 'autre')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_journal_user_id ON session_journal(user_id, created_at DESC);

ALTER TABLE session_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own journal" ON session_journal;
CREATE POLICY "Users can read own journal"
  ON session_journal FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own journal" ON session_journal;
CREATE POLICY "Users can insert own journal"
  ON session_journal FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own journal" ON session_journal;
CREATE POLICY "Users can update own journal"
  ON session_journal FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own journal" ON session_journal;
CREATE POLICY "Users can delete own journal"
  ON session_journal FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Trigger updated_at sur session_journal (reutilise update_updated_at_column)
DROP TRIGGER IF EXISTS session_journal_updated_at ON session_journal;
CREATE TRIGGER session_journal_updated_at
  BEFORE UPDATE ON session_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- §2 — crbos.updated_at + TRIGGER + smart_objectives
-- =====================================================================
-- Trigger absent alors que la table est la plus editee (PATCH sections
-- via /api/crbo/[id], banner reprise CRBO, regenerate-section, etc.).
--
-- Bonus : smart_objectives + smart_objectives_generated_at, ecrits par
-- /api/generate-smart-objectives mais jamais ajoutes en DB. La
-- migration `supabase-smart-objectives.sql` n'avait jamais ete appliquee.
-- Sans ces colonnes, l'UPDATE rate silencieusement → la fiche SMART est
-- regeneree a chaque clic (cout Claude).
-- =====================================================================

ALTER TABLE crbos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_crbos_updated_at ON crbos;
CREATE TRIGGER update_crbos_updated_at
  BEFORE UPDATE ON crbos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_crbos_updated_at ON crbos(updated_at DESC);

ALTER TABLE crbos ADD COLUMN IF NOT EXISTS smart_objectives JSONB;
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS smart_objectives_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN crbos.smart_objectives IS
  'Fiche objectifs therapeutiques SMART generee par Claude. NULL tant que jamais cliquee.';
COMMENT ON COLUMN crbos.smart_objectives_generated_at IS
  'Horodatage de la derniere generation SMART.';

-- =====================================================================
-- §3 — INDEX MANQUANTS SUR FOREIGN KEYS
-- =====================================================================
-- Cible : 4 FK sans index couvrant (lint unindexed_foreign_keys).
-- Impact : suboptimal au DELETE/UPDATE de la table parente et aux JOINs.
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_crbos_bilan_precedent_id
  ON crbos(bilan_precedent_id)
  WHERE bilan_precedent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crbo_share_links_user_id
  ON crbo_share_links(user_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id
  ON feedbacks(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id
  ON referral_rewards(referral_id);

-- =====================================================================
-- §4 — search_path FIGE SUR 6 FONCTIONS
-- =====================================================================
-- Lint function_search_path_mutable : si search_path est mutable, un
-- attaquant ayant CREATE sur n'importe quel schema dans le search_path
-- peut shadower une fonction/table referencee dans le corps. Forcer
-- search_path = public, pg_temp neutralise ce vecteur.
-- =====================================================================

ALTER FUNCTION public.get_public_stats()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_shared_crbo(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_referral_code(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_crbo_count(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.reset_monthly_crbo_count()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

-- =====================================================================
-- §5 — REVOKE EXECUTE SUR 4 FONCTIONS SECURITY DEFINER
-- =====================================================================
-- Lint anon_security_definer_function_executable :
-- ces fonctions tournent avec les droits du proprietaire. Anonymes ne
-- doivent JAMAIS pouvoir les declencher via /rest/v1/rpc/<name>.
--
-- Decisions par fonction :
--
-- get_public_stats          : public read deliberement, on garde anon.
-- get_shared_crbo           : utilise par les liens de partage publics,
--                             on garde anon.
-- lookup_referrer_by_code   : utilise par le formulaire register avant
--                             login, on garde anon.
--
-- activate_referral_for_user: appelee par trigger interne + service_role
--                             lors du webhook Stripe. Aucun client direct.
--                             REVOKE anon + authenticated.
-- increment_crbo_count      : appelee par API serveur (Next.js routes)
--                             via service_role. REVOKE anon (garder
--                             authenticated par precaution si appel
--                             direct decide plus tard).
-- reset_monthly_crbo_count  : cron / maintenance. REVOKE anon +
--                             authenticated.
-- trigger_activate_referral_on_pro : trigger function pure, jamais
--                             callable via REST. REVOKE anon +
--                             authenticated (les triggers internes
--                             continuent de tourner — REVOKE EXECUTE
--                             ne bloque pas les triggers).
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.activate_referral_for_user(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_crbo_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_activate_referral_on_pro() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_crbo_count(uuid) FROM anon, public;
-- Note : on garde EXECUTE pour `authenticated` sur increment_crbo_count
-- au cas ou un appel client direct serait introduit. Si l'audit montre
-- qu'il n'y a que des appels serveur, decommenter la ligne suivante :
-- REVOKE EXECUTE ON FUNCTION public.increment_crbo_count(uuid) FROM authenticated;

-- =====================================================================
-- §6 — NOTE MANUELLE : LEAKED PASSWORD PROTECTION
-- =====================================================================
-- L'advisor signale auth_leaked_password_protection desactive.
-- Activation : Supabase Dashboard → Authentication → Sign In / Up
-- → Password Settings → activer "Check against HaveIBeenPwned"
-- (impossible via SQL, c'est un toggle GoTrue cote API d'admin).
-- =====================================================================

-- Fin de migration v2. Replay safe.
