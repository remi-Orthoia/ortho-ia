-- Migration : carnet de session — journal libre de l'orthophoniste.
--
-- V1 (beta) : notes personnelles entre les CRBOs. Observations cliniques
-- brutes (à voix/clavier), réflexions, rappels.
--
-- Différent de patient_notes : pas lié à un patient spécifique. C'est le
-- carnet "tout-venant" de la praticienne — ce qu'elle aurait noté dans un
-- carnet papier sur son bureau.

CREATE TABLE IF NOT EXISTS session_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 10000),
  -- Catégorisation optionnelle pour organiser : observation / idée /
  -- rappel / formation / autre. Permet plus tard un filtre dans l'UI.
  category TEXT CHECK (category IS NULL OR category IN ('observation', 'idee', 'rappel', 'formation', 'autre')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_journal_user_id ON session_journal(user_id, created_at DESC);

-- RLS user-scoped strict
ALTER TABLE session_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own journal" ON session_journal;
CREATE POLICY "Users can read own journal"
  ON session_journal FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journal" ON session_journal;
CREATE POLICY "Users can insert own journal"
  ON session_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal" ON session_journal;
CREATE POLICY "Users can update own journal"
  ON session_journal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal" ON session_journal;
CREATE POLICY "Users can delete own journal"
  ON session_journal FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_session_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS session_journal_updated_at ON session_journal;
CREATE TRIGGER session_journal_updated_at
  BEFORE UPDATE ON session_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_session_journal_updated_at();
