import type { PastilleEtat } from './types'

/**
 * Calcule la couleur d'une épreuve parent à partir des couleurs de ses
 * sous-épreuves. Règle clinique imposée : "la couleur la plus faible domine"
 * — toute fragilité doit remonter en haut de la grille pour ne pas être
 * masquée par une moyenne.
 *
 *   Rouge > Orange > Vert (dominance descendante)
 *
 * - Au moins une rouge       → rouge
 * - Au moins une orange      → orange
 * - Toutes vertes (≥ 1)      → vert
 * - Aucune sous-épreuve cotée → gris (non renseigné, l'épreuve reste neutre
 *   pour ne pas envoyer un signal trompeur dans le CRBO IA)
 *
 * @example
 * computeParentColor([])                                 // 'gris'
 * computeParentColor(['gris', 'gris'])                   // 'gris'
 * computeParentColor(['vert', 'vert'])                   // 'vert'
 * computeParentColor(['vert', 'orange'])                 // 'orange'
 * computeParentColor(['vert', 'rouge'])                  // 'rouge'
 * computeParentColor(['orange', 'orange', 'rouge'])      // 'rouge'
 * computeParentColor(['gris', 'vert', 'orange'])         // 'orange'
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
    case 'gris':
      return 'vert'
    case 'vert':
      return 'orange'
    case 'orange':
      return 'rouge'
    case 'rouge':
      return 'gris'
  }
}
