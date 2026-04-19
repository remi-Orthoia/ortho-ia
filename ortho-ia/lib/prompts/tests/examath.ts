import type { TestModule } from './types'

export const examath: TestModule = {
  nom: 'Examath',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Thibault',
  annee: 2015,
  domaines: [
    'Cognition numérique',
    'Calcul',
    'Résolution de problèmes',
  ],
  regles_specifiques: `### EXAMATH
- Batterie spécifique à l'évaluation de la cognition mathématique (dyscalculie).
- Utilise la notation en quartiles comme les autres produits HappyNeuron : Q1 → P25, Med → P50, Q3 → P75.
- Deux versions : Examath 8-15 (primaire + collège) et Examath 5-8.`,
}
