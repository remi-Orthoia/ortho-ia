-- ================================================
-- MISE À JOUR SCHEMA - KANBAN + CARNET PATIENTS
-- À exécuter dans Supabase SQL Editor
-- ================================================

-- 1. Table des patients (carnet patients)
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  date_naissance DATE,
  classe TEXT,
  ecole TEXT,
  -- Médecin traitant
  medecin_nom TEXT,
  medecin_tel TEXT,
  medecin_adresse TEXT,
  -- Anamnèse de base (réutilisable)
  anamnese_base TEXT,
  -- Notes diverses
  notes TEXT,
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des médecins (carnet médecins)
CREATE TABLE IF NOT EXISTS medecins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  specialite TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ajouter colonne statut aux CRBO pour le Kanban
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'a_rediger' 
  CHECK (statut IN ('a_rediger', 'en_cours', 'a_relire', 'termine'));

-- 4. Ajouter référence patient (optionnel, pour lier un CRBO à un patient du carnet)
ALTER TABLE crbos ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_medecins_user_id ON medecins(user_id);
CREATE INDEX IF NOT EXISTS idx_crbos_statut ON crbos(statut);
CREATE INDEX IF NOT EXISTS idx_crbos_patient_id ON crbos(patient_id);

-- 6. RLS pour patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS pour medecins
ALTER TABLE medecins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medecins" ON medecins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medecins" ON medecins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medecins" ON medecins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medecins" ON medecins
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Trigger updated_at pour patients
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Trigger updated_at pour medecins
CREATE TRIGGER update_medecins_updated_at
  BEFORE UPDATE ON medecins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FIN DE LA MISE À JOUR
-- ================================================
