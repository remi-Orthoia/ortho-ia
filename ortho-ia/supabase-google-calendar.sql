-- Migration : intégration Google Calendar pour pré-remplissage CRBO depuis RDV
--
-- Stocke les tokens OAuth de l'utilisateur (1 ligne par user). RLS strict :
-- chaque ortho ne voit/modifie que ses propres tokens. Service role peut tout
-- (pour les opérations serveur callback OAuth).
--
-- Pour activer la fonctionnalité, l'opérateur doit poser ces env vars :
--   GOOGLE_OAUTH_CLIENT_ID
--   GOOGLE_OAUTH_CLIENT_SECRET
--   GOOGLE_OAUTH_REDIRECT_URI    (ex: https://ortho-ia.vercel.app/api/calendar/callback)
-- + activer Google Calendar API dans le projet GCP
-- + ajouter le redirect URI dans les credentials OAuth GCP

CREATE TABLE IF NOT EXISTS user_google_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT, -- peut être absent si l'ortho a déjà autorisé avant
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar.readonly',
  google_email TEXT, -- pour afficher "Connecté en tant que xxx@gmail.com"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own google tokens" ON user_google_tokens;
CREATE POLICY "Users can read own google tokens"
  ON user_google_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own google tokens" ON user_google_tokens;
CREATE POLICY "Users can delete own google tokens"
  ON user_google_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Pas de policy INSERT/UPDATE depuis le client : seul le service role (côté
-- API callback OAuth) peut écrire. Évite qu'un attaquant pose un faux token.

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_user_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_google_tokens_updated_at ON user_google_tokens;
CREATE TRIGGER user_google_tokens_updated_at
  BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_google_tokens_updated_at();
