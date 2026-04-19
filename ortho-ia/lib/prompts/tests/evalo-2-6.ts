import type { TestModule } from './types'

export const evalo26: TestModule = {
  nom: 'EVALO 2-6',
  editeur: 'Ortho Édition',
  auteurs: 'Coquet, Ferrand, Tardif',
  annee: 2009,
  domaines: [
    'Langage oral',
    'Communication',
    'Phonologie',
    'Lexique',
    'Morphosyntaxe',
  ],
  regles_specifiques: `### EVALO 2-6
- Batterie destinée aux enfants de 2 ans 3 mois à 6 ans 3 mois.
- Utilise principalement des centiles numériques explicites (pas de quartiles).
- Les valeurs données en P5, P10, P25, P50, P75, P90, P95 sont à utiliser telles quelles.`,
}
