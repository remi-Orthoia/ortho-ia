import type { PastilleEtat, EpreuveState, Epreuve, SousEpreuve, Criterion } from './types'

/**
 * Calcule la couleur d'une épreuve parent à partir des couleurs de ses
 * critères cotés. Règle clinique imposée : "la couleur la plus faible
 * domine" — toute fragilité doit remonter pour ne pas être masquée.
 *
 *   Rouge > Orange > Vert (dominance descendante)
 */
export function computeParentColor(states: PastilleEtat[]): PastilleEtat {
  const cotees = states.filter((s) => s !== 'gris')
  if (cotees.length === 0) return 'gris'
  if (cotees.some((s) => s === 'rouge')) return 'rouge'
  if (cotees.some((s) => s === 'orange')) return 'orange'
  return 'vert'
}

/** Cycle d'état lors d'un clic sur une pastille : gris → vert → orange → rouge → gris. */
export function cyclePastille(current: PastilleEtat): PastilleEtat {
  switch (current) {
    case 'gris':   return 'vert'
    case 'vert':   return 'orange'
    case 'orange': return 'rouge'
    case 'rouge':  return 'gris'
  }
}

/** Clé canonique d'une cellule (critère) : "sousEpreuveId:criterionId". */
export function cellKey(sousEpreuveId: string, criterionId: string): string {
  return `${sousEpreuveId}:${criterionId}`
}

/** Couleur globale d'une épreuve : agrège tous ses critères cotés. */
export function epreuveColorFromState(
  epreuve: Epreuve,
  state: EpreuveState | undefined,
): PastilleEtat {
  if (!state) return 'gris'
  const colors: PastilleEtat[] = []
  for (const se of epreuve.sousEpreuves) {
    for (const cr of se.criteres) {
      const c = state.cells[cellKey(se.id, cr.id)]
      if (c) colors.push(c)
    }
  }
  return computeParentColor(colors)
}

/** Couleur agrégée d'une sous-épreuve sur tous ses critères. */
export function sousEpreuveColorFromState(
  sousEpreuve: SousEpreuve,
  state: EpreuveState | undefined,
): PastilleEtat {
  if (!state) return 'gris'
  const colors: PastilleEtat[] = []
  for (const cr of sousEpreuve.criteres) {
    const c = state.cells[cellKey(sousEpreuve.id, cr.id)]
    if (c) colors.push(c)
  }
  return computeParentColor(colors)
}

/** Nombre de critères cotés (non gris) d'une épreuve. */
export function countCotees(
  epreuve: Epreuve,
  state: EpreuveState | undefined,
): number {
  if (!state) return 0
  let n = 0
  for (const se of epreuve.sousEpreuves) {
    for (const cr of se.criteres) {
      const c = state.cells[cellKey(se.id, cr.id)]
      if (c && c !== 'gris') n++
    }
  }
  return n
}

/** Liste des critères cotés d'une épreuve avec leur label. */
export function listCotees(
  epreuve: Epreuve,
  state: EpreuveState | undefined,
): Array<{ sousEpreuve: SousEpreuve; criterion: Criterion; color: PastilleEtat }> {
  const out: Array<{ sousEpreuve: SousEpreuve; criterion: Criterion; color: PastilleEtat }> = []
  if (!state) return out
  for (const se of epreuve.sousEpreuves) {
    for (const cr of se.criteres) {
      const c = state.cells[cellKey(se.id, cr.id)]
      if (c && c !== 'gris') {
        out.push({ sousEpreuve: se, criterion: cr, color: c })
      }
    }
  }
  return out
}
