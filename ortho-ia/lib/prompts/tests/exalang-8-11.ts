import type { TestModule } from './types'

export const exalang811: TestModule = {
  nom: 'Exalang 8-11',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2012,
  domaines: [
    'Langage oral',
    'Langage écrit',
    'Mémoire de travail',
    'Métaphonologie',
  ],
  epreuves: [
    'Empan auditif (endroit / envers)',
    'Répétition de logatomes',
    'Métaphonologie',
    'Fluences (phonétique, sémantique)',
    'Décision lexico-morphologique',
    'Compréhension de phrases',
    'Lecture de mots / non-mots',
    'Leximétrie',
    'Closure de texte',
    'DRA (Dictée de Rédaction Abrégée)',
  ],
  regles_specifiques: `### EXALANG 8-11
- Les résultats sont présentés avec une notation en **quartiles** (Q1, Med, Q3) dans la colonne "Percentiles".
- Conversion obligatoire : Q1 → P25, Med → P50, Q3 → P75.
- Les valeurs explicites P5, P10, P90, P95 sont à utiliser telles quelles.
- Ne JAMAIS recalculer un percentile depuis l'É-T : les normes du test priment sur la distribution gaussienne théorique.
- Exemple typique : "Boucle phonologique : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Normal** (et non "déficitaire" comme suggéré par l'É-T).`,
}
