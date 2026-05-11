-- Migration : bilan_references — base de cas de référence validés par les
-- orthophonistes beta. Alimente le few-shot prompt pour calibrer l'IA sur
-- des exemples concrets de CRBO de qualité par type de test.
--
-- Workflow :
--   1. L'ortho génère un CRBO et donne une note ≥ 4 + corrections explicites
--      → si applicable, l'écran feedback insère ici l'output IA + les
--        corrections (pour servir de référence négative-vers-positive)
--   2. L'ortho peut aussi pousser directement un cas "doré" depuis un Word
--      qu'elle nous fournit (workflow manuel beta, cf. GUIDE_BETA_TESTERS.md)
--   3. À chaque génération, le système requête bilan_references pour
--      le même test_type + tranche_age et injecte 2 exemples en few-shot
--
-- RLS : chaque ortho ne voit que ses propres références (V1). V2 envisagée :
-- partage opt-in d'un cas anonymisé pour enrichir la base commune.

CREATE TABLE IF NOT EXISTS bilan_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL,            -- 'Exalang 8-11', 'MoCA', 'BETL', etc.
  profil_type TEXT,                   -- 'dyslexie phonologique', 'TDL léger', etc.
  tranche_age TEXT,                   -- '7-9 ans', '60-75 ans', etc. — clé de filtrage
  input_scores JSONB,                 -- structure des scores qui ont alimenté le draft IA
  input_notes TEXT,                   -- anamnèse / notes brutes ortho au moment de la génération
  output_crbo_cible TEXT,             -- CRBO final tel que l'ortho l'aurait rédigé (gold standard)
  output_crbo_genere TEXT,            -- ce que l'IA a produit (à des fins de comparaison)
  valide_par TEXT,                    -- nom / cabinet de l'ortho qui valide la référence
  qualite_score INT CHECK (qualite_score BETWEEN 1 AND 5),
  corrections TEXT,                   -- libre — décrit les écarts entre IA et cible
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id)
);

-- Index sur les colonnes de filtrage pour la requête few-shot
CREATE INDEX IF NOT EXISTS idx_bilan_refs_test_type ON bilan_references(test_type, tranche_age);
CREATE INDEX IF NOT EXISTS idx_bilan_refs_quality ON bilan_references(qualite_score) WHERE qualite_score >= 4;

ALTER TABLE bilan_references ENABLE ROW LEVEL SECURITY;

-- RLS user-scoped. Notez bien que le few-shot côté serveur utilisera le
-- service_role pour LIRE l'ensemble (calibrage cross-ortho), mais l'écran
-- ortho ne voit/écrit que ses propres références.
DROP POLICY IF EXISTS "ortho_owns_references" ON bilan_references;
CREATE POLICY "ortho_owns_references"
  ON bilan_references
  FOR ALL
  USING (auth.uid() = user_id);
