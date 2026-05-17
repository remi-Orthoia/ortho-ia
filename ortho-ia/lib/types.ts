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
  notes_analyse?: string
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
  notes_analyse: string
  /**
   * Format du CRBO produit par l'IA :
   *  - 'complet' (défaut, 4-6 pages) : commentaires longs, analyse détaillée, recommandations complètes
   *  - 'synthetique' (2-3 pages) : commentaires concis, recommandations top 5-7, focus sur l'essentiel
   * Le toggle est visible dans l'étape Résultats du formulaire.
   */
  format_crbo?: 'complet' | 'synthetique'

  // Étape 5 — state of the art
  /** Observations du clinicien sur le comportement du patient pendant la séance. */
  comportement_seance?: string
  /** Durée totale de la séance en minutes (chronomètre). */
  duree_seance_minutes?: number

  // Étape 4 — renouvellement uniquement
  /** Notes libres sur l'évolution depuis le dernier bilan. */
  evolution_notes?: string
  /** Éléments d'anamnèse stables à conserver (repris du bilan initial, éditable). */
  elements_stables?: string
  /** ID du bilan précédent (pour lier en DB et injecter dans le prompt). */
  bilan_precedent_id?: string
  /** Snapshot des résultats du bilan précédent (pour comparaison Claude). */
  bilan_precedent_structure?: import('./prompts').CRBOStructure | null
  bilan_precedent_date?: string
  /** Anamnèse rédigée du bilan précédent — pour affichage lecture seule dans l'étape 4. */
  bilan_precedent_anamnese?: string
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

// Options de formulaire — Classe / niveau (du préscolaire à la retraite).
// Regroupées en familles pour rendu avec <optgroup>. La liste à plat
// CLASSES_OPTIONS reste exportée pour la validation et le voice-command.
export const CLASSES_GROUPS = [
  {
    label: 'Préscolaire',
    options: ['TPS', 'PS', 'MS', 'GS'] as const,
  },
  {
    label: 'Primaire',
    options: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] as const,
  },
  {
    label: 'Collège',
    options: ['6ème', '5ème', '4ème', '3ème'] as const,
  },
  {
    label: 'Lycée',
    options: ['2nde', '1ère', 'Terminale'] as const,
  },
  {
    label: 'Études supérieures',
    options: ['Bac+1', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat'] as const,
  },
  {
    label: 'Adulte',
    options: [
      'Adulte actif',
      'Retraité',
    ] as const,
  },
  {
    label: 'Autre',
    options: ['Autre'] as const,
  },
] as const

export const CLASSES_OPTIONS = CLASSES_GROUPS.flatMap(g => g.options) as readonly string[]

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
  'Exalang Lyfac',
  'EVALO 2-6',
  'ELO',
  'BALE',
  'EVALEO 6-15',
  'N-EEL',
  'BILO',
  'BELEC',
  'BETL',
  'PREDIMEM',
  'PrediFex',
  'PrediLac',
  'BECD',
  'BIA',
  'Examath',
  'OMF / Déglutition',
  'Autre'
] as const

// Avec le passage à CLASSES_GROUPS.flatMap, l'inférence d'union de tuple
// n'est plus directe — on type sur string pour rester souple (les fallback
// "Autre" et la validation au runtime via CLASSES_OPTIONS.includes() gèrent).
export type ClasseOption = string
export type TestOption = typeof TESTS_OPTIONS[number]
