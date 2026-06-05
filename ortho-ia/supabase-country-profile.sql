-- ============================================================================
-- Migration : ajout du pays d'exercice ortho au profil
-- ============================================================================
--
-- Contexte : ortho.ia ouvre aux orthophonistes BE et CH (et LU à terme). Le
-- code pays détermine les mentions administratives à insérer dans le CRBO
-- (AMO/NGAP pour FR, INAMI/catégorie B2 pour BE, conventions cantonales pour
-- CH, CNS pour LU).
--
-- Champ : code ISO 3166-1 alpha-2 (FR / BE / CH / LU). Default 'FR' pour les
-- comptes existants (rétrocompatible).
--
-- À exécuter dans le SQL Editor Supabase (prod + staging).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country TEXT
  DEFAULT 'FR'
  CHECK (country IN ('FR', 'BE', 'CH', 'LU'));

-- Backfill explicite pour les lignes existantes (au cas où DEFAULT ne s'applique pas).
UPDATE profiles SET country = 'FR' WHERE country IS NULL;

COMMENT ON COLUMN profiles.country IS
  'Code ISO 3166-1 alpha-2 du pays d''exercice de l''orthophoniste. Détermine les mentions administratives (AMO/NGAP, INAMI, NA Suisse, CNS Luxembourg) dans le CRBO généré. Default FR.';
