-- ============================================================================
-- Migration : ajout du support B-CM / B-CMado dans la table crbos
-- ============================================================================
-- Les bilans de cognition mathématique partagent la table crbos avec les
-- bilans langage (UI/historique/quota mutualisés). On distingue le sous-type
-- via une colonne dédiée NULL-able :
--   - NULL          = bilan langage historique (Exalang, Evaleo, etc.)
--   - 'b-cm'        = Bilan Cognition Mathématique enfant
--   - 'b-cmado'     = Bilan Cognition Mathématique ado
--
-- L'état brut du bilan math (cotations couleur + notes brutes + textes IA
-- par épreuve) est sérialisé en JSON dans la colonne resultats existante,
-- pas dans une nouvelle table. Choix volontaire pour Phase 3 (rapide,
-- pas de migration côté lecture). Migration vers une table dédiée
-- bilan_math_epreuves possible en Phase 4 si on veut faire des stats.
-- ============================================================================

ALTER TABLE crbos
  ADD COLUMN IF NOT EXISTS bilan_subtype TEXT
  CHECK (bilan_subtype IS NULL OR bilan_subtype IN ('b-cm', 'b-cmado'));

-- Index partiel : on ne filtre quasi jamais sur NULL, donc on exclut les
-- bilans langage pour garder l'index compact.
CREATE INDEX IF NOT EXISTS idx_crbos_bilan_subtype
  ON crbos(bilan_subtype)
  WHERE bilan_subtype IS NOT NULL;

COMMENT ON COLUMN crbos.bilan_subtype IS
  'Sous-type de bilan : NULL=langage (legacy), b-cm=cognition math enfant, b-cmado=cognition math ado';
