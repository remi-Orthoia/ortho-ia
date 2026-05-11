-- Migration : ortho_feedbacks — retours qualitatifs de l'orthophoniste sur
-- chaque CRBO généré. Alimente le calibrage du modèle (analyse des sections
-- les plus modifiées, des scores de qualité par profil de test, etc.).
--
-- Trigger automatique côté API : si qualite_score ≤ 3 ET corrections
-- non vides, le système copie aussi le retour dans bilan_references avec
-- output_crbo_genere = brouillon IA, output_crbo_cible = corrections.
-- Ce mécanisme transforme chaque mauvais draft en futur exemple négatif-
-- vers-positif pour le few-shot.

CREATE TABLE IF NOT EXISTS ortho_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crbo_id UUID REFERENCES crbos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  qualite_score INT CHECK (qualite_score BETWEEN 1 AND 5),
  modifications TEXT,                 -- libre — décrit ce que l'ortho a changé
  sections_modifiees TEXT[],          -- ex: ['anamnese', 'diagnostic', 'amenagements']
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_user ON ortho_feedbacks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_score ON ortho_feedbacks(qualite_score);
CREATE INDEX IF NOT EXISTS idx_ortho_feedbacks_crbo ON ortho_feedbacks(crbo_id);

ALTER TABLE ortho_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ortho_owns_feedbacks" ON ortho_feedbacks;
CREATE POLICY "ortho_owns_feedbacks"
  ON ortho_feedbacks
  FOR ALL
  USING (auth.uid() = user_id);
