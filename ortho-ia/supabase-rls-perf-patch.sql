-- =====================================================================
-- Patch : supabase-rls-perf-patch.sql
-- Date  : 2026-05-24
-- Objet : remplacer `auth.uid()` par `(select auth.uid())` dans toutes
--         les policies RLS. Le wrapping en sous-requete fait que
--         PostgreSQL evalue auth.uid() UNE FOIS par requete au lieu
--         d'une fois par ligne (lint auth_rls_initplan).
--
-- Impact :
--   - Aucun changement fonctionnel (memes droits).
--   - Gain perf sur les SELECT de >100 lignes (latence quasi divisee
--     par N a tres grande echelle).
--   - 26 policies sur 9 tables.
--   - Bonus : consolidation des 2 policies SELECT sur `referrals` en
--     une seule (lint multiple_permissive_policies).
--
-- Idempotent (DROP IF EXISTS partout). A appliquer en SQL Editor
-- Supabase Studio, idealement hors heure de pointe (DROP/CREATE
-- policy prend un AccessExclusiveLock bref).
--
-- A appliquer APRES supabase-audit-fixes-v2.sql (qui cree les
-- nouvelles tables — elles utilisent deja le pattern optimise).
-- =====================================================================

-- =====================================================================
-- TABLE : crbo_share_links (2 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can create share links" ON crbo_share_links;
CREATE POLICY "Users can create share links"
  ON crbo_share_links FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own share links" ON crbo_share_links;
CREATE POLICY "Users can view own share links"
  ON crbo_share_links FOR SELECT
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : crbos (4 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view own crbos" ON crbos;
CREATE POLICY "Users can view own crbos"
  ON crbos FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own crbos" ON crbos;
CREATE POLICY "Users can insert own crbos"
  ON crbos FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own crbos" ON crbos;
CREATE POLICY "Users can update own crbos"
  ON crbos FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own crbos" ON crbos;
CREATE POLICY "Users can delete own crbos"
  ON crbos FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : medecins (4 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view own medecins" ON medecins;
CREATE POLICY "Users can view own medecins"
  ON medecins FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own medecins" ON medecins;
CREATE POLICY "Users can insert own medecins"
  ON medecins FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own medecins" ON medecins;
CREATE POLICY "Users can update own medecins"
  ON medecins FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own medecins" ON medecins;
CREATE POLICY "Users can delete own medecins"
  ON medecins FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : patients (4 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients"
  ON patients FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert own patients"
  ON patients FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients"
  ON patients FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own patients" ON patients;
CREATE POLICY "Users can delete own patients"
  ON patients FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : prefill_sessions (3 policies — la SELECT garde le filtre expires_at)
-- =====================================================================
DROP POLICY IF EXISTS "Users read own prefill sessions" ON prefill_sessions;
CREATE POLICY "Users read own prefill sessions"
  ON prefill_sessions FOR SELECT
  USING ((select auth.uid()) = user_id AND expires_at > now());

DROP POLICY IF EXISTS "Users insert own prefill sessions" ON prefill_sessions;
CREATE POLICY "Users insert own prefill sessions"
  ON prefill_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own prefill sessions" ON prefill_sessions;
CREATE POLICY "Users delete own prefill sessions"
  ON prefill_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : profiles (3 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- =====================================================================
-- TABLE : referral_rewards (1 policy)
-- =====================================================================
DROP POLICY IF EXISTS "Read own referral rewards" ON referral_rewards;
CREATE POLICY "Read own referral rewards"
  ON referral_rewards FOR SELECT
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- TABLE : referrals (2 → 1 policy — consolidation)
-- =====================================================================
-- Lint multiple_permissive_policies signalait 2 policies SELECT sur la
-- meme table/role. On les fusionne en une seule expression : un
-- utilisateur voit le referral si il est parraine OU filleule.
-- =====================================================================
DROP POLICY IF EXISTS "Read own referrals as referrer" ON referrals;
DROP POLICY IF EXISTS "Read own referrals as referred" ON referrals;

CREATE POLICY "Read own referrals"
  ON referrals FOR SELECT
  USING ((select auth.uid()) IN (referrer_id, referred_id));

-- =====================================================================
-- TABLE : subscriptions (3 policies)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- =====================================================================
-- Fin du patch. 26 policies recreees, 1 consolidee (referrals).
-- Apres application, relancer get_advisors(performance) → les warnings
-- auth_rls_initplan et multiple_permissive_policies doivent disparaitre.
-- =====================================================================
