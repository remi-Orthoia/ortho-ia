import type { TestModule } from './types'

export const elo: TestModule = {
  nom: 'ELO',
  editeur: 'ECPA',
  auteurs: 'Khomsi',
  annee: 2001,
  domaines: [
    'Langage oral',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
  ],
  epreuves: [
    'Lexique en réception',
    'Lexique en production',
    'Compréhension morphosyntaxique',
    'Production morphosyntaxique',
    'Répétition de phrases',
    'Phonologie',
  ],
  regles_specifiques: `### ELO (Évaluation du Langage Oral)
- Destiné aux enfants de 3 à 11 ans.
- Fournit des notes étalonnées (centiles) et des É-T.
- Utiliser les centiles fournis directement.`,
}
