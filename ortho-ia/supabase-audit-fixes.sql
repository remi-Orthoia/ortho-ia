-- ============================================================================
-- Migration d'audit (2026-05-24) — rattrapage schéma vs code applicatif
-- ============================================================================
--
-- Cette migration est 100 % idempotente (ADD COLUMN IF NOT EXISTS,
-- CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS / CREATE POLICY).
-- Elle est sûre à rejouer plusieurs fois et n'écrase aucune donnée.
--
-- Pourquoi cette migration ?
-- Le code applicatif (app/dashboard/nouveau-crbo/resultats/page.tsx,
-- app/api/crbo/[id]/route.ts, app/dashboard/profil/page.tsx, etc.) écrit
-- et lit des colonnes qui ne sont créées par AUCUNE migration versionnée
-- dans le repo. Elles ont vraisemblablement été ajoutées en prod via le
-- SQL Editor sans être committées. Cette migration les ré-applique de façon
-- idempotente pour que le repo redevienne source de vérité.
--
-- Tables traitées :
--   1. crbos       — colonnes manquantes + updated_at + format_crbo
--   2. profiles    — colonne referral_code
--   3. drafts      — NOUVELLE table de brouillons CRBO
--   4. referrals   — NOUVELLE table (code la référence mais aucune migration)
--   5. referral_rewards — NOUVELLE table (idem)
--   6. Indexes manquants sur crbos et patients
--   7. Fonction delete_expired_drafts() pour cleanup
-- ============================================================================


-- ============================================================================
-- 1. crbos — colonnes attendues par le code mais absentes des migrations
-- ============================================================================

-- structure_json : JSONB de la structure CRBO complète post-génération
-- (anamnese_redigee, domains[], diagnostic, recommandations, ...).
-- Écrite par resultats/page.tsx, lue par dashboard, preview, historique,
-- patchée section-par-section par /api/crbo/[id]/route.ts.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS structure_json JSONB;

-- comportement_seance : notes qualitatives sur le comportement du patient
-- pendant la passation (fatigue, anxiété, coopération…). Saisi à l'étape
-- Anamnèse, écrit par resultats/page.tsx.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS comportement_seance TEXT;

-- duree_seance_minutes : durée de la séance en minutes. Saisi à l'étape
-- Anamnèse, écrit par resultats/page.tsx.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS duree_seance_minutes INTEGER
  CHECK (duree_seance_minutes IS NULL OR (duree_seance_minutes > 0 AND duree_seance_minutes < 600));

-- severite_globale : 'Leger' | 'Modere' | 'Severe' — dénormalisé depuis
-- structure_json.severite_globale pour les tris kanban + dashboard.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS severite_globale TEXT
  CHECK (severite_globale IS NULL OR severite_globale IN ('Léger', 'Modéré', 'Sévère'));

-- bilan_precedent_id : FK auto-référente pour les renouvellements (lie un
-- CRBO de renouvellement à son CRBO initial). ON DELETE SET NULL pour ne
-- pas casser la chaîne si l'ortho supprime l'ancien bilan.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS bilan_precedent_id UUID
  REFERENCES crbos(id) ON DELETE SET NULL;

-- format_crbo : 'synthetique' (2-3 pages) | 'complet' (4-6 pages). Choisi
-- par l'ortho à l'étape Résultats, actuellement stocké uniquement dans
-- formData côté client. À persister pour qu'un re-export Word respecte le
-- format d'origine.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS format_crbo TEXT DEFAULT 'synthetique'
  CHECK (format_crbo IS NULL OR format_crbo IN ('synthetique', 'complet'));

-- crbo_text : ancien stockage du texte CRBO brut (markdown). Lu par
-- dashboard en fallback de crbo_genere. Probablement ajouté en prod sans
-- migration. ADD IF NOT EXISTS pour aligner.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS crbo_text TEXT;

-- updated_at : horodatage de la dernière modification (PATCH section,
-- regen, ...). Absent de la table initiale mais utile pour tris + audits.
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger updated_at sur crbos — utilise la fonction update_updated_at_column
-- déjà définie dans supabase-schema.sql.
DROP TRIGGER IF EXISTS update_crbos_updated_at ON crbos;
CREATE TRIGGER update_crbos_updated_at
  BEFORE UPDATE ON crbos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 2. profiles — colonne referral_code
-- ============================================================================
-- Référencée par supabase-auto-create-profile.sql (trigger handle_new_user)
-- et par app/auth/register + app/dashboard/profil, mais aucune migration ne
-- la déclare formellement.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);


-- ============================================================================
-- 3. drafts — NOUVELLE table de brouillons CRBO côté DB
-- ============================================================================
-- L'auto-save actuel est purement localStorage (cf. AUDIT_SAUVEGARDE_FORMULAIRE.md).
-- Cette table prépare une éventuelle bascule DB-side : multi-device (saisie
-- en cabinet, finalisation à la maison), audit RGPD plus propre, etc.
-- Le code applicatif ne l'utilise pas encore — wiring à faire dans une PR
-- séparée. La table est créée d'abord pour qu'elle soit prête.

CREATE TABLE IF NOT EXISTS drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etape INTEGER NOT NULL DEFAULT 1 CHECK (etape >= 1 AND etape <= 10),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- test_type : 'exalang_8_11', 'examath', 'moca', etc. NULL tant que
  -- l'ortho n'a pas coche de test a l'etape Resultats. Utilise par le
  -- dashboard pour afficher "Brouillon Exalang 8-11 — etape 3".
  test_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- expires_at : 30j par defaut. Le job de cleanup (cf. section 7) purge
  -- automatiquement les brouillons expires.
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_expires_at ON drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_drafts_user_updated ON drafts(user_id, updated_at DESC);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_owns_drafts" ON drafts;
CREATE POLICY "user_owns_drafts"
  ON drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 4. referrals — NOUVELLE table (code la référence mais aucune migration)
-- ============================================================================
-- Référencée par app/auth/register/page.tsx (INSERT à l'inscription si
-- ?ref=<code>) et app/dashboard/profil/page.tsx (SELECT des filleules).
-- Sans cette table, le code échoue en silence côté inscription (try/catch
-- best-effort) et le panneau "Mes filleules" reste vide.

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT,
  -- status :
  --   'pending'   : filleule inscrite mais pas encore en plan payant
  --   'active'    : filleule payante, parrainage recompense
  --   'cancelled' : filleule a annule son abonnement
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Une filleule ne peut pas avoir 2 parrains
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Chaque ortho voit les referrals dont elle est referrer OU referred.
DROP POLICY IF EXISTS "users_read_own_referrals" ON referrals;
CREATE POLICY "users_read_own_referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- INSERT : une nouvelle filleule peut creer la ligne (referred_id = elle)
DROP POLICY IF EXISTS "users_insert_referrals" ON referrals;
CREATE POLICY "users_insert_referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- UPDATE reserve au service_role (passage pending → active via webhook Stripe).


-- ============================================================================
-- 5. referral_rewards — NOUVELLE table
-- ============================================================================
-- Référencée par app/dashboard/profil/page.tsx (SELECT amount, type, status
-- WHERE type='earned'). Sans cette table, le compteur "X € de credit ce
-- mois" reste a 0.

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Lien optionnel vers le referral source (pour audit / SQL stats).
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  -- Montant en euros (NUMERIC pour eviter les .99 floating point).
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  -- type :
  --   'earned'   : gain credit ce mois (filleule active)
  --   'spent'    : utilise sur une facture
  --   'expired'  : non utilise dans le delai
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'expired')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'cancelled')),
  -- Mois calendaire concerne (1er du mois) — base pour le filtre du profil.
  month DATE NOT NULL DEFAULT date_trunc('month', NOW())::DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_rewards" ON referral_rewards;
CREATE POLICY "users_read_own_rewards"
  ON referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE reserve au service_role (calcul reward = webhook Stripe).


-- ============================================================================
-- 6. Indexes manquants
-- ============================================================================

-- crbos : tri par updated_at DESC (utile une fois les editions PATCH frequentes)
CREATE INDEX IF NOT EXISTS idx_crbos_updated_at ON crbos(updated_at DESC);

-- crbos : composite user_id + statut (acceleration kanban filter)
CREATE INDEX IF NOT EXISTS idx_crbos_user_statut ON crbos(user_id, statut);

-- crbos : bilan_precedent_id pour resolutions de chaine de renouvellements
CREATE INDEX IF NOT EXISTS idx_crbos_bilan_precedent_id ON crbos(bilan_precedent_id)
  WHERE bilan_precedent_id IS NOT NULL;

-- patients : tri par nom (deja indexe via PK mais pas par nom)
CREATE INDEX IF NOT EXISTS idx_patients_user_nom ON patients(user_id, nom);


-- ============================================================================
-- 7. Cleanup automatique des drafts expires
-- ============================================================================
-- Fonction simple SQL — appelable manuellement OU schedulee via pg_cron si
-- l'extension est installee sur le projet Supabase.

CREATE OR REPLACE FUNCTION delete_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM drafts WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION delete_expired_drafts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_expired_drafts() TO service_role;

-- pg_cron : a activer manuellement dans Supabase Dashboard si souhaite.
-- Une fois pg_cron installe (Database → Extensions → pg_cron), executer :
--
--   SELECT cron.schedule(
--     'cleanup-expired-drafts',
--     '0 3 * * *',                    -- tous les jours a 3h du matin UTC
--     $$ SELECT delete_expired_drafts() $$
--   );
--
-- Sinon, l'app peut appeler la fonction au demarrage du dashboard
-- (best-effort) :
--   await supabase.rpc('delete_expired_drafts')


-- ============================================================================
-- FIN MIGRATION D'AUDIT
-- ============================================================================
