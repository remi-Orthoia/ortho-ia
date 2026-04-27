-- ================================================
-- MIGRATION : rename notes_passation → notes_analyse
-- À exécuter dans Supabase SQL Editor AVANT le déploiement Vercel.
-- ================================================
--
-- Le champ "notes_analyse" reflète mieux l'usage clinique : ce sont les
-- observations qualitatives de l'orthophoniste sur la passation et l'analyse
-- du bilan (fatigue, anxiété, conditions, etc.), pas seulement des notes
-- chronologiques.
--
-- Idempotent : la rename ne s'exécute que si la colonne existe encore sous
-- l'ancien nom. Si vous relancez le script après migration, il ne fait rien.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crbos'
      AND column_name = 'notes_passation'
      AND table_schema = 'public'
  ) THEN
    EXECUTE 'ALTER TABLE crbos RENAME COLUMN notes_passation TO notes_analyse';
  END IF;
END $$;

-- ================================================
-- FIN
-- ================================================
