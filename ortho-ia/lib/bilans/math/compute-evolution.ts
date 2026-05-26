/**
 * Calcule l'evolution par epreuve entre 2 bilans math (B-CM / B-CMado) en
 * comparant les couleurs agregees (vert / orange / rouge / gris).
 *
 * Utilise par :
 *  - lib/prompts/bilan-math-crbo.ts : pour generer un bloc "## EVOLUTION"
 *    dans le user prompt, qui guide le LLM a formuler les commentaires
 *    d'evolution per-epreuve + diagnostic global.
 *  - lib/bilan-math-word-export.ts : pour rendre le tableau comparatif dans
 *    le Word.
 *  - components/bilans/math/BilanMathWordPreview.tsx : pour rendre le meme
 *    tableau dans la preview ecran.
 *
 * Granularite : niveau EPREUVE MACRO (ex. "Classifications", "Sériation",
 * "Numération"). Pas de comparaison cellule-par-cellule pour garder le
 * tableau lisible (~10-20 lignes max pour un bilan B-CMado complet).
 */

import type {
  BilanMathDraft,
  EpreuveState,
  GrilleBilan,
  PastilleEtat,
} from './types'
import { epreuveColorFromState } from './parent-color'

/** Sens de l'evolution entre 2 couleurs. */
export type EvolutionDirection =
  | 'progres' // amelioration franche (rouge→orange, rouge→vert, orange→vert)
  | 'stable' // meme couleur des 2 cotes (et pas gris)
  | 'regression' // degradation (vert→orange, vert→rouge, orange→rouge)
  | 'nouveau' // pas cote au precedent (gris) mais cote maintenant
  | 'skipped' // cote au precedent mais pas re-propose (gris au current)

/** Une ligne du tableau comparatif. */
export interface EvolutionRow {
  sectionId: string
  sectionLabel: string
  epreuveId: string
  epreuveLabel: string
  previousColor: PastilleEtat
  currentColor: PastilleEtat
  direction: EvolutionDirection
}

/** Ordre des couleurs pour comparaison numerique (0=meilleur, 3=pire). */
const COLOR_RANK: Record<PastilleEtat, number> = {
  gris: -1,
  vert: 0,
  orange: 1,
  rouge: 2,
}

/** Calcule le sens d'evolution entre 2 couleurs. */
function computeDirection(prev: PastilleEtat, curr: PastilleEtat): EvolutionDirection {
  if (prev === 'gris' && curr !== 'gris') return 'nouveau'
  if (prev !== 'gris' && curr === 'gris') return 'skipped'
  if (prev === curr) return 'stable'
  const prevRank = COLOR_RANK[prev]
  const currRank = COLOR_RANK[curr]
  // Rang plus BAS = mieux. Donc current < previous = progres.
  if (currRank < prevRank) return 'progres'
  return 'regression'
}

/**
 * Calcule la liste des evolutions par epreuve. Filtre les lignes ou les 2
 * couleurs sont 'gris' (epreuve jamais cotee ni avant ni maintenant —
 * inutile pour le tableau).
 */
export function computeEvolutionRows(
  grille: GrilleBilan,
  currentEpreuves: Record<string, EpreuveState>,
  previousEpreuves: Record<string, EpreuveState>,
): EvolutionRow[] {
  const rows: EvolutionRow[] = []
  for (const section of grille.sections) {
    for (const ep of section.epreuves) {
      const prevState = previousEpreuves[ep.id]
      const currState = currentEpreuves[ep.id]
      // Si AUCUN des 2 etats n'existe (epreuve jamais cotee), on saute.
      if (!prevState && !currState) continue
      const prevColor: PastilleEtat = prevState ? epreuveColorFromState(ep, prevState) : 'gris'
      const currColor: PastilleEtat = currState ? epreuveColorFromState(ep, currState) : 'gris'
      // Si les 2 sont gris (etats existent mais aucune cellule cotee), on saute.
      if (prevColor === 'gris' && currColor === 'gris') continue
      rows.push({
        sectionId: section.id,
        sectionLabel: section.label,
        epreuveId: ep.id,
        epreuveLabel: ep.label,
        previousColor: prevColor,
        currentColor: currColor,
        direction: computeDirection(prevColor, currColor),
      })
    }
  }
  return rows
}

/** Helper : un libelle court pour chaque couleur (sert dans le tableau). */
export const COLOR_LABEL_FR: Record<PastilleEtat, string> = {
  gris: 'non coté',
  vert: 'réussite spontanée',
  orange: 'réussite après étayage',
  rouge: 'échec',
}

/** Helper : symbole de la direction pour l'affichage. */
export const DIRECTION_SYMBOL: Record<EvolutionDirection, string> = {
  progres: '↑',
  stable: '→',
  regression: '↓',
  nouveau: '✦',
  skipped: '–',
}

/** Helper : libelle texte de la direction. */
export const DIRECTION_LABEL: Record<EvolutionDirection, string> = {
  progres: 'progrès',
  stable: 'stable',
  regression: 'régression',
  nouveau: 'nouvelle épreuve',
  skipped: 'non re-proposée',
}

/** Helper : sythese textuelle d'un set d'evolutions. Sert pour le prompt. */
export function summarizeEvolution(rows: EvolutionRow[]): string {
  const counts: Record<EvolutionDirection, number> = {
    progres: 0, stable: 0, regression: 0, nouveau: 0, skipped: 0,
  }
  for (const r of rows) counts[r.direction]++
  const parts: string[] = []
  if (counts.progres > 0) parts.push(`${counts.progres} épreuve(s) en progrès`)
  if (counts.stable > 0) parts.push(`${counts.stable} stable(s)`)
  if (counts.regression > 0) parts.push(`${counts.regression} en régression`)
  if (counts.nouveau > 0) parts.push(`${counts.nouveau} nouvelle(s) épreuve(s)`)
  return parts.join(', ')
}
