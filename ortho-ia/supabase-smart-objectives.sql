-- =====================================================================
-- Migration : stockage de la fiche d'objectifs SMART par CRBO
--
-- Objectif : eviter de regenerer la fiche a chaque clic (cout Claude + non
-- reproductibilite). Le premier appel sauvegarde le JSON dans cette colonne,
-- les clics suivants relisent depuis la BDD. Un bouton "Regenerer" force
-- un nouvel appel Claude qui ecrase le JSON existant.
-- =====================================================================

ALTER TABLE crbos
  ADD COLUMN IF NOT EXISTS smart_objectives JSONB,
  ADD COLUMN IF NOT EXISTS smart_objectives_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN crbos.smart_objectives IS
  'Fiche objectifs therapeutiques SMART generee par Claude. Forme : { objectifs: [...], strategies_ebp: [...], prochaine_evaluation: string }. NULL tant que l''ortho n''a jamais clique sur "Objectifs SMART".';

COMMENT ON COLUMN crbos.smart_objectives_generated_at IS
  'Horodatage de la derniere generation. Affiche dans l''UI ("genere le 12 mai 2026") pour que l''ortho sache si la fiche est ancienne et meriterait une regeneration.';
