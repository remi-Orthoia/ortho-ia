-- Migration : notes / fil de discussion par patient.
--
-- V1 (beta) : scope personnel — chaque ortho ne voit que ses propres notes
-- sur ses propres patients. L'évolution V2 vers "compte team" se fera en
-- ajoutant une colonne team_id + un assouplissement de la policy
-- "users can read own notes" pour autoriser les members du même team.
--
-- Cas d'usage :
--   - "Mère rappelle de privilégier l'écrit en début de séance"
--   - "Nouveau diagnostic TDAH posé par le pédiatre — bilan associé à prévoir"
--   - "Lien retour psychomotricien collègue 2024-04-15"
--   - "Renouvellement à programmer en septembre 2026"

CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_notes_user_id ON patient_notes(user_id);

-- RLS
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- Tous les CRUD restreints à l'utilisateur·rice propriétaire.
-- Note : on vérifie aussi que le patient_id appartient bien à l'user via
-- une sous-requête — défense en profondeur si jamais on autorise plus tard
-- des inserts avec un patient_id falsifié.

DROP POLICY IF EXISTS "Users can read own patient notes" ON patient_notes;
CREATE POLICY "Users can read own patient notes"
  ON patient_notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patient notes" ON patient_notes;
CREATE POLICY "Users can insert own patient notes"
  ON patient_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_notes.patient_id
        AND patients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own patient notes" ON patient_notes;
CREATE POLICY "Users can update own patient notes"
  ON patient_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patient notes" ON patient_notes;
CREATE POLICY "Users can delete own patient notes"
  ON patient_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_patient_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patient_notes_updated_at ON patient_notes;
CREATE TRIGGER patient_notes_updated_at
  BEFORE UPDATE ON patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_notes_updated_at();
