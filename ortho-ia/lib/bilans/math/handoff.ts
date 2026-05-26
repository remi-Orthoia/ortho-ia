/**
 * Handoff Nouveau CRBO -> bilan math (B-CM / B-CMado).
 *
 * Quand l'ortho clique sur "B-CM" ou "B-CMado" depuis l'étape 4 de
 * /dashboard/nouveau-crbo, on persiste en localStorage le patient + anamnèse +
 * motif déjà saisis aux étapes 1-3 pour éviter de redemander ces informations
 * dans le parcours math dédié. La clé est consommée une seule fois
 * (clearMathBilanHandoff après hydratation) pour ne pas polluer un retour
 * manuel sur le bilan math depuis le dashboard.
 *
 * TTL : 60 minutes. Au-delà on considère le handoff périmé (l'ortho a
 * probablement abandonné le flux).
 */

const HANDOFF_KEY = 'ortho-ia:bilan-math-handoff'
const TTL_MS = 60 * 60 * 1000

export interface MathBilanHandoff {
  /** Type cible — sert juste à filtrer si l'utilisateur clique sur le mauvais
   *  bilan, on n'applique pas le handoff. */
  target: 'b-cm' | 'b-cmado'
  patient: {
    prenom: string
    nom: string
    date_naissance: string
    classe: string
  }
  anamnese: string
  motif: string
  /** Mode bilan (initial / renouvellement) saisi a l'etape 2 du wizard. */
  bilanMode?: 'initial' | 'renouvellement'
  /** Date du bilan (ISO). Utilisee pour le calcul d'age + affichage Word. */
  bilanDate?: string
  /** Medecin prescripteur (etape 2 du wizard). Inclut date de prescription
   *  ajoutee 2026-05-26 comme champ obligatoire du wizard. */
  medecin?: {
    nom: string
    tel: string
    date_prescription?: string
  }
  /** Flag pose par le wizard pour indiquer que le form math vient de recevoir
   *  un contexte complet (patient, medecin, motif, anamnese deja saisis aux
   *  etapes 1-3). Le form masque alors les blocs Patient / Type bilan /
   *  Anamnese pour eviter la duplication de saisie. False ou absent = acces
   *  direct au form (sidebar, URL bookmark) → form complet visible. */
  fromWizard?: boolean
  /** Observations sur le comportement pendant la seance (etape 5 — state of the art). */
  comportementSeance?: string
  /** Duree totale de la seance en minutes (etape 5). */
  dureeSeanceMinutes?: number
  /** Donnees specifiques renouvellement (etape 4 quand bilan_type=renouvellement). */
  renouvellement?: {
    evolutionNotes?: string
    elementsStables?: string
    bilanPrecedentId?: string
    bilanPrecedentDate?: string
    bilanPrecedentAnamnese?: string
  }
  createdAt: number
}

export function saveMathBilanHandoff(data: Omit<MathBilanHandoff, 'createdAt'>): void {
  try {
    const payload: MathBilanHandoff = { ...data, createdAt: Date.now() }
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload))
  } catch {
    // Quota / navigation privée : pas grave, l'ortho ressaisit.
  }
}

export function readMathBilanHandoff(target: MathBilanHandoff['target']): MathBilanHandoff | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MathBilanHandoff
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.target !== target) return null
    if (Date.now() - (parsed.createdAt ?? 0) > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function clearMathBilanHandoff(): void {
  try {
    localStorage.removeItem(HANDOFF_KEY)
  } catch {
    // Ignore
  }
}
