import type { TestModule } from './types'

export const exalang1115: TestModule = {
  nom: 'Exalang 11-15',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2009,
  domaines: [
    'Langage oral',
    'Langage écrit',
    'Mémoire de travail',
    'Raisonnement',
  ],
  epreuves: [
    'Empan auditif',
    'Répétition de logatomes',
    'Fluences',
    'Compréhension orale',
    'Lecture de mots / non-mots',
    'Compréhension écrite',
    'Orthographe (dictée)',
    'Closure',
  ],
  regles_specifiques: `### EXALANG 11-15
- Notation en quartiles identique à Exalang 8-11 : Q1 → P25, Med → P50, Q3 → P75.
- Adapté au collège (6e-3e).
- Ne JAMAIS recalculer un percentile depuis l'É-T.`,
}
