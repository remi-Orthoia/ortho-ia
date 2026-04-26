-- ================================================
-- MIGRATION : champs additionnels banque médecins
-- À exécuter dans Supabase SQL Editor
-- Non destructif : ADD COLUMN IF NOT EXISTS
-- ================================================

-- Champs supplémentaires demandés par Laurie pour la banque médecins
ALTER TABLE medecins ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE medecins ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE medecins ADD COLUMN IF NOT EXISTS code_postal TEXT;

-- Compteur d'utilisations (pour trier les plus fréquents en premier dans l'autocomplete)
ALTER TABLE medecins ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- Index pour le tri par fréquence d'utilisation
CREATE INDEX IF NOT EXISTS idx_medecins_user_usage ON medecins(user_id, usage_count DESC);

-- Fonction d'incrément du compteur (appelée à la sélection / utilisation d'un médecin)
CREATE OR REPLACE FUNCTION increment_medecin_usage(medecin_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE medecins
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = medecin_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- FIN
-- ================================================
