-- ============================================================================
-- Table : webinaire_inscriptions
-- ============================================================================
-- Stocke les inscriptions au webinaire de lancement Ortho.ia (début juillet 2026).
--
-- Accessible :
--   - INSERT public (depuis la landing /webinaire, via /api/webinaire/subscribe)
--   - SELECT réservé à l'équipe (pas de RLS SELECT pour les anon)
--
-- Sécurité : la route API valide format email + applique un rate-limit côté
-- serveur. La RLS empêche en plus de lister les inscriptions sans la service_role.
-- ============================================================================

CREATE TABLE IF NOT EXISTS webinaire_inscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  ville TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_webinaire_inscriptions_created_at
  ON webinaire_inscriptions(created_at DESC);

ALTER TABLE webinaire_inscriptions ENABLE ROW LEVEL SECURITY;

-- INSERT public — la landing peut écrire des inscriptions anonymes.
-- L'unicité de l'email évite les doublons (gérée côté API avec un message clair).
DROP POLICY IF EXISTS "Public can subscribe to webinaire" ON webinaire_inscriptions;
CREATE POLICY "Public can subscribe to webinaire" ON webinaire_inscriptions
  FOR INSERT WITH CHECK (true);

-- Pas de SELECT pour anon — seul le service_role (côté serveur Vercel) peut lire.
COMMENT ON TABLE webinaire_inscriptions IS
  'Inscriptions au webinaire de lancement Ortho.ia (debut juillet 2026)';
