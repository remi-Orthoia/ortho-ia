-- ================================================
-- SCHÉMA DE BASE DE DONNÉES ORTHO.IA
-- À exécuter dans Supabase SQL Editor
-- ================================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  crbo_count INTEGER DEFAULT 0,
  crbo_limit INTEGER DEFAULT 3,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Table des CRBO générés
CREATE TABLE IF NOT EXISTS crbos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_prenom TEXT NOT NULL,
  patient_nom TEXT NOT NULL,
  patient_ddn DATE,
  patient_classe TEXT,
  bilan_date DATE,
  bilan_type TEXT DEFAULT 'initial' CHECK (bilan_type IN ('initial', 'renouvellement')),
  medecin_nom TEXT,
  medecin_tel TEXT,
  motif TEXT,
  anamnese TEXT,
  test_utilise TEXT,
  resultats TEXT,
  notes_analyse TEXT,
  crbo_genere TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_crbos_user_id ON crbos(user_id);
CREATE INDEX IF NOT EXISTS idx_crbos_created_at ON crbos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 5. Fonction pour incrémenter le compteur de CRBO
CREATE OR REPLACE FUNCTION increment_crbo_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions 
  SET crbo_count = crbo_count + 1,
      updated_at = NOW()
  WHERE subscriptions.user_id = increment_crbo_count.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour réinitialiser le compteur mensuel
CREATE OR REPLACE FUNCTION reset_monthly_crbo_count()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions 
  SET crbo_count = 0,
      updated_at = NOW()
  WHERE plan = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS (Row Level Security) - Sécurité des données

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crbos ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour crbos
CREATE POLICY "Users can view own crbos" ON crbos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crbos" ON crbos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crbos" ON crbos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crbos" ON crbos
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FIN DU SCHÉMA
-- ================================================
