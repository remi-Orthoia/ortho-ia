/**
 * Anonymisation RGPD avant envoi à l'API Claude (hébergée hors EU).
 *
 * Principe :
 *  1. On remplace toutes les données nominatives (patient, médecin, ortho)
 *     par des tokens stables dans les champs structurés ET dans les champs
 *     de texte libre (anamnèse, notes, résultats).
 *  2. La date de naissance est convertie en âge calendaire — on ne transmet
 *     jamais la DDN exacte à l'API.
 *  3. À la réception, on réhydrate la structure pour remettre les valeurs
 *     réelles avant enregistrement / export.
 */

export interface CRBOFormData {
  ortho_nom?: string
  ortho_adresse?: string
  ortho_cp?: string
  ortho_ville?: string
  ortho_tel?: string
  ortho_email?: string
  patient_prenom: string
  patient_nom: string
  patient_ddn?: string // ISO yyyy-mm-dd
  patient_classe?: string
  bilan_date?: string
  bilan_type?: string
  medecin_nom?: string
  medecin_tel?: string
  motif?: string
  anamnese?: string
  test_utilise: string | string[]
  resultats_manuels?: string
  notes_analyse?: string
}

export interface ReverseMap {
  // tokens → vraies valeurs
  tokens: Record<string, string>
  // infos non-tokenisées utiles au rendu final
  patient_ddn?: string
}

const TOKEN_PATIENT_PRENOM = '__P_PRENOM__'
const TOKEN_PATIENT_NOM = '__P_NOM__'
const TOKEN_MEDECIN_NOM = '__M_NOM__'
const TOKEN_MEDECIN_TEL = '__M_TEL__'
const TOKEN_ORTHO_NOM = '__O_NOM__'
const TOKEN_ORTHO_EMAIL = '__O_EMAIL__'
const TOKEN_ORTHO_TEL = '__O_TEL__'
const TOKEN_ORTHO_ADRESSE = '__O_ADR__'

/** Liste des remplacements (valeur réelle → token) à appliquer aux textes libres. */
export type ScrubList = Array<[string | undefined, string]>

/** Remplace toutes les occurrences d'une valeur sensible dans un texte libre. */
export function scrubText(text: string | undefined, replacements: ScrubList): string | undefined {
  if (!text) return text
  let out = text
  for (const [value, token] of replacements) {
    if (!value) continue
    const trimmed = value.trim()
    if (trimmed.length < 2) continue
    // regex insensible à la casse, sur mot entier
    const safe = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${safe}\\b`, 'gi')
    out = out.replace(re, token)
  }
  return out
}

/**
 * Construit la liste de scrub depuis les noms du formulaire — utilisable pour
 * anonymiser des inputs additionnels (commentaires qualitatifs ortho, anamnèse
 * éditée par l'ortho, structure bilan précédent…) sans repasser par anonymize().
 * Les tokens sont identiques à ceux d'anonymize() pour que la rehydratation
 * post-IA fonctionne avec la même reverseMap.
 */
export function buildScrubList(data: Pick<CRBOFormData, 'patient_prenom' | 'patient_nom' | 'medecin_nom' | 'ortho_nom'>): ScrubList {
  return [
    [data.patient_prenom, TOKEN_PATIENT_PRENOM],
    [data.patient_nom, TOKEN_PATIENT_NOM],
    [data.medecin_nom, TOKEN_MEDECIN_NOM],
    [data.ortho_nom, TOKEN_ORTHO_NOM],
  ]
}

export function anonymize(data: CRBOFormData): {
  anonymized: CRBOFormData
  reverseMap: ReverseMap
} {
  const tokens: Record<string, string> = {}
  if (data.patient_prenom) tokens[TOKEN_PATIENT_PRENOM] = data.patient_prenom
  if (data.patient_nom) tokens[TOKEN_PATIENT_NOM] = data.patient_nom
  if (data.medecin_nom) tokens[TOKEN_MEDECIN_NOM] = data.medecin_nom
  if (data.medecin_tel) tokens[TOKEN_MEDECIN_TEL] = data.medecin_tel
  if (data.ortho_nom) tokens[TOKEN_ORTHO_NOM] = data.ortho_nom
  if (data.ortho_email) tokens[TOKEN_ORTHO_EMAIL] = data.ortho_email
  if (data.ortho_tel) tokens[TOKEN_ORTHO_TEL] = data.ortho_tel
  if (data.ortho_adresse) tokens[TOKEN_ORTHO_ADRESSE] = data.ortho_adresse

  const scrubList: Array<[string | undefined, string]> = [
    [data.patient_prenom, TOKEN_PATIENT_PRENOM],
    [data.patient_nom, TOKEN_PATIENT_NOM],
    [data.medecin_nom, TOKEN_MEDECIN_NOM],
    [data.ortho_nom, TOKEN_ORTHO_NOM],
  ]

  const anonymized: CRBOFormData = {
    ...data,
    ortho_nom: data.ortho_nom ? TOKEN_ORTHO_NOM : undefined,
    ortho_email: data.ortho_email ? TOKEN_ORTHO_EMAIL : undefined,
    ortho_tel: data.ortho_tel ? TOKEN_ORTHO_TEL : undefined,
    ortho_adresse: data.ortho_adresse ? TOKEN_ORTHO_ADRESSE : undefined,
    patient_prenom: TOKEN_PATIENT_PRENOM,
    patient_nom: TOKEN_PATIENT_NOM,
    // DDN conservée en clair pour permettre le calcul d'âge côté prompt,
    // mais elle n'est plus liée à un nom identifiant.
    medecin_nom: data.medecin_nom ? TOKEN_MEDECIN_NOM : undefined,
    medecin_tel: data.medecin_tel ? TOKEN_MEDECIN_TEL : undefined,
    motif: scrubText(data.motif, scrubList),
    anamnese: scrubText(data.anamnese, scrubList),
    resultats_manuels: scrubText(data.resultats_manuels, scrubList),
    notes_analyse: scrubText(data.notes_analyse, scrubList),
  }

  const reverseMap: ReverseMap = {
    tokens,
    patient_ddn: data.patient_ddn,
  }

  return { anonymized, reverseMap }
}

/**
 * Applique scrubText à toutes les chaînes d'un objet (récursivement).
 * Utile pour anonymiser des structures imbriquées (CRBOStructure du bilan
 * précédent, par exemple) sans avoir à connaître la forme exacte.
 */
export function scrubObjectStrings<T>(obj: T, scrubList: ScrubList): T {
  if (obj == null) return obj
  if (typeof obj === 'string') return (scrubText(obj, scrubList) ?? obj) as unknown as T
  if (Array.isArray(obj)) return obj.map((item) => scrubObjectStrings(item, scrubList)) as unknown as T
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = scrubObjectStrings(v, scrubList)
    }
    return out as T
  }
  return obj
}

/** Remplace les tokens par les vraies valeurs dans un string. */
function rehydrateString(text: string, tokens: Record<string, string>): string {
  let out = text
  for (const [token, value] of Object.entries(tokens)) {
    out = out.split(token).join(value)
  }
  return out
}

/** Réhydrate récursivement tous les strings d'un objet avec les vraies valeurs. */
export function rehydrate<T>(obj: T, reverseMap: ReverseMap): T {
  const tokens = reverseMap.tokens
  if (obj == null) return obj
  if (typeof obj === 'string') return rehydrateString(obj, tokens) as unknown as T
  if (Array.isArray(obj)) return obj.map(item => rehydrate(item, reverseMap)) as unknown as T
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = rehydrate(v, reverseMap)
    }
    return out as T
  }
  return obj
}
