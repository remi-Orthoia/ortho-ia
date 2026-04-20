// Types pour l'application Ortho.ia

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  adresse?: string
  code_postal?: string
  ville?: string
  telephone?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'pro' | 'team'
  status: 'active' | 'canceled' | 'past_due'
  crbo_count: number
  crbo_limit: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_end?: string
  created_at: string
}

export interface CRBO {
  id: string
  user_id: string
  patient_prenom: string
  patient_nom: string
  patient_ddn: string
  patient_classe: string
  bilan_date: string
  bilan_type: 'initial' | 'renouvellement'
  medecin_nom: string
  medecin_tel?: string
  motif: string
  anamnese: string
  test_utilise: string
  resultats: string
  notes_passation?: string
  crbo_genere: string
  document_url?: string
  created_at: string
}

export interface CRBOFormData {
  // Étape 1: Infos orthophoniste
  ortho_nom: string
  ortho_adresse: string
  ortho_cp: string
  ortho_ville: string
  ortho_tel: string
  ortho_email: string
  
  // Étape 2: Infos patient
  patient_prenom: string
  patient_nom: string
  patient_ddn: string
  patient_classe: string
  bilan_date: string
  bilan_type: 'initial' | 'renouvellement'
  
  // Étape 3: Médecin & Motif
  medecin_nom: string
  medecin_tel: string
  motif: string
  
  // Étape 4: Anamnèse
  anamnese: string
  audio_file?: File
  
  // Étape 5: Résultats
  test_utilise: string[]
  resultats_pdf?: File
  resultats_manuels: string
  notes_passation: string
}

export interface GenerateCRBORequest {
  formData: CRBOFormData
  extractedResults?: string
}

export interface GenerateCRBOResponse {
  success: boolean
  /** Texte reconstitué du CRBO (pour persistance et affichage fallback). */
  crbo?: string
  /** Structure JSON renvoyée par Claude via tool_use. */
  structure?: import('./prompts').CRBOStructure
  error?: string
}

// Options de formulaire
export const CLASSES_OPTIONS = [
  'PS', 'MS', 'GS',
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème', '5ème', '4ème', '3ème',
  '2nde', '1ère', 'Terminale',
  'Adulte', 'Autre'
] as const

/** Tests de screening rapide — à proposer AVANT un bilan complet (adulte / senior). */
export const TESTS_SCREENING_OPTIONS = [
  'MoCA',
] as const

/** Bilans complets (enfant, adolescent, adulte). */
export const TESTS_OPTIONS = [
  ...TESTS_SCREENING_OPTIONS,
  'Exalang 3-6',
  'Exalang 5-8',
  'Exalang 8-11',
  'Exalang 11-15',
  'EVALO 2-6',
  'ELO',
  'BALE',
  'EVALEO 6-15',
  'N-EEL',
  'BILO',
  'BELEC',
  'Examath',
  'OMF / Déglutition',
  'Autre'
] as const

export type ClasseOption = typeof CLASSES_OPTIONS[number]
export type TestOption = typeof TESTS_OPTIONS[number]
