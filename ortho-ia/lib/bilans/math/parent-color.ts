import type { PastilleEtat, EpreuveState, Epreuve, SectionMatrix } from './types'

/**
 * Calcule la couleur d'une épreuve parent à partir des couleurs de ses
 * cellules cotées. Règle clinique imposée : "la couleur la plus faible
 * domine" — toute fragilité doit remonter en haut de la grille pour ne pas
 * être masquée par une moyenne.
 *
 *   Rouge > Orange > Vert (dominance descendante)
 *
 * - Au moins une rouge       → rouge
 * - Au moins une orange      → orange
 * - Toutes vertes (≥ 1)      → vert
 * - Aucune cellule cotée     → gris
 */
export function computeParentColor(states: PastilleEtat[]): PastilleEtat {
  const cotees = states.filter((s) => s !== 'gris')
  if (cotees.length === 0) return 'gris'
  if (cotees.some((s) => s === 'rouge')) return 'rouge'
  if (cotees.some((s) => s === 'orange')) return 'orange'
  return 'vert'
}

/**
 * Cycle d'état lors d'un clic sur une pastille : gris → vert → orange → rouge → gris.
 * Cycle court pour permettre de "retirer" une cotation rapidement sans avoir
 * à atteindre rouge en passant par orange.
 */
export function cyclePastille(current: PastilleEtat): PastilleEtat {
  switch (current) {
    case 'gris':   return 'vert'
    case 'vert':   return 'orange'
    case 'orange': return 'rouge'
    case 'rouge':  return 'gris'
  }
}

/** Clé canonique d'une cellule de la matrice. */
export function cellKey(niveauId: string, sousEpreuveId: string): string {
  return `${niveauId}:${sousEpreuveId}`
}

/**
 * Couleur globale d'une épreuve : agrège toutes ses cellules cotées toutes
 * lignes confondues. Utile pour le résumé (preview, historique, IA).
 */
export function epreuveColorFromState(
  epreuve: Epreuve,
  niveauxIds: string[],
  state: EpreuveState | undefined,
): PastilleEtat {
  if (!state) return 'gris'
  const colors: PastilleEtat[] = []
  for (const niv of niveauxIds) {
    for (const se of epreuve.sousEpreuves) {
      const c = state.cells[cellKey(niv, se.id)]
      if (c) colors.push(c)
    }
  }
  return computeParentColor(colors)
}

/**
 * Couleur agrégée d'une sous-épreuve sur tous les niveaux (le plus défavorable).
 * Permet d'afficher une pastille de synthèse en en-tête de colonne.
 */
export function sousEpreuveColorFromState(
  niveauxIds: string[],
  sousEpreuveId: string,
  state: EpreuveState | undefined,
): PastilleEtat {
  if (!state) return 'gris'
  const colors: PastilleEtat[] = []
  for (const niv of niveauxIds) {
    const c = state.cells[cellKey(niv, sousEpreuveId)]
    if (c) colors.push(c)
  }
  return computeParentColor(colors)
}

/**
 * Nombre de cellules cotées (non grises) d'une épreuve sur tous niveaux.
 * Utile pour les compteurs UI ("3/12 cellules cotées").
 */
export function countCotees(
  epreuve: Epreuve,
  niveauxIds: string[],
  state: EpreuveState | undefined,
): number {
  if (!state) return 0
  let n = 0
  for (const niv of niveauxIds) {
    for (const se of epreuve.sousEpreuves) {
      const c = state.cells[cellKey(niv, se.id)]
      if (c && c !== 'gris') n++
    }
  }
  return n
}

/** Liste des cellules cotées d'une épreuve, au format ((niveauId, sousEpreuveId), couleur). */
export function listCotees(
  epreuve: Epreuve,
  niveauxIds: string[],
  state: EpreuveState | undefined,
): Array<{ niveauId: string; sousEpreuveId: string; color: PastilleEtat }> {
  const out: Array<{ niveauId: string; sousEpreuveId: string; color: PastilleEtat }> = []
  if (!state) return out
  for (const niv of niveauxIds) {
    for (const se of epreuve.sousEpreuves) {
      const c = state.cells[cellKey(niv, se.id)]
      if (c && c !== 'gris') {
        out.push({ niveauId: niv, sousEpreuveId: se.id, color: c })
      }
    }
  }
  return out
}
