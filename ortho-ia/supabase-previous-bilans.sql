-- =====================================================================
-- Migration : table `previous_bilans`
--
-- Stocke les comptes-rendus de bilans orthophoniques **externes**
-- (rédigés en dehors d'ortho-ia, importés en PDF ou Word) que l'ortho
-- uploade au début d'un bilan de renouvellement pour permettre l'analyse
-- comparative par Claude.
--
-- Structure :
--   - `extracted_data` JSONB : payload extrait par Claude Vision (PDF) ou
--     `mammoth` + Claude (DOCX). Forme proche de CRBOStructure :
--     { bilan_date, tests_utilises[], anamnese_redigee, domains[], diagnostic, amenagements[] }
--   - `original_filename` / `source_format` : pour audit + UX (afficher
--     "bilan-laurie.pdf importé").
--
-- Sécurité : RLS user-scoped (chaque ortho ne voit que ses propres
-- imports). Pas d'anonymisation au stockage — l'extraction côté API
-- s'occupe de scrubber les données patient avant envoi à Claude.
-- =====================================================================

CREATE TABLE IF NOT EXISTS previous_bilans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  /** Données structurées extraites du document (CRBOStructure-compatible). */
  extracted_data JSONB NOT NULL,
  /** Nom du fichier original (audit + UX). */
  original_filename TEXT,
  /** 'pdf' | 'docx' — pour debug et stats. */
  source_format TEXT,
  /** Date du bilan extrait (dénormalisée depuis extracted_data pour les tris). */
  bilan_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_previous_bilans_user_id ON previous_bilans(user_id);
CREATE INDEX IF NOT EXISTS idx_previous_bilans_patient_id ON previous_bilans(patient_id);
CREATE INDEX IF NOT EXISTS idx_previous_bilans_created_at ON previous_bilans(created_at DESC);

ALTER TABLE previous_bilans ENABLE ROW LEVEL SECURITY;

-- Chaque ortho voit, crée, modifie et supprime UNIQUEMENT ses propres imports.
CREATE POLICY "Users can view own previous_bilans" ON previous_bilans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own previous_bilans" ON previous_bilans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own previous_bilans" ON previous_bilans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own previous_bilans" ON previous_bilans
  FOR DELETE USING (auth.uid() = user_id);
