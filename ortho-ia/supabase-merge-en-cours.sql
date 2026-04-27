-- ================================================
-- MIGRATION : fusion colonne kanban "En cours" dans "À rédiger"
-- À exécuter dans Supabase SQL Editor
-- Non destructif : remap les CRBO existants en statut 'en_cours' vers 'a_rediger'.
-- ================================================

-- 1. Migrer les CRBO existants
UPDATE crbos SET statut = 'a_rediger' WHERE statut = 'en_cours';

-- 2. Mettre à jour le CHECK constraint (Postgres auto-nomme la contrainte
--    crbos_statut_check). On la drop puis recrée sans 'en_cours'.
--    Si la contrainte n'existe pas (cas rare), le DROP IF EXISTS est silencieux.
ALTER TABLE crbos DROP CONSTRAINT IF EXISTS crbos_statut_check;
ALTER TABLE crbos ADD CONSTRAINT crbos_statut_check
  CHECK (statut IN ('a_rediger', 'a_relire', 'termine'));

-- ================================================
-- FIN
-- ================================================
