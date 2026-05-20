import type { GrilleBilan, Niveau } from './types'

/**
 * Grille B-CMado — Profil du Calcul et des Mathématiques (adolescent, collège).
 *
 * ⚠️ Version transitoire : la matrice complète par niveau scolaire collège
 * (6ème → 3ème) sera ajoutée dans un commit suivant. Pour l'instant on garde
 * une SECTION UNIQUE avec un seul "niveau" générique pour que le bilan reste
 * utilisable. L'ortho cote chaque test une seule fois (cellule unique par
 * test, sans dimension âge/classe).
 *
 * Source : docs/Bilans Sources/Profil B-CMado.xlsx
 */

const NIVEAUX_CMADO: Niveau[] = [
  // Niveau unique transitoire — sera remplacé par 6ème/5ème/4ème/3ème
  { id: 'tous', label: 'tous niveaux' },
]

export const GRILLE_B_CMADO: GrilleBilan = {
  id: 'b-cmado',
  label: 'B-CMado',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour adolescent (collège). ' +
    'Cotation à 3 niveaux : réussite spontanée, après étayage, échec.',
  sections: [
    {
      id: 'tout',
      label: 'B-CMado — épreuves',
      description: 'Cote chaque test selon la performance du patient.',
      niveaux: NIVEAUX_CMADO,
      epreuves: [
        {
          id: 'classifications',
          label: 'Classifications',
          sousEpreuves: [
            { id: 'set', label: 'SET' },
            { id: '10-cartes', label: '10 cartes' },
            { id: 'mots', label: 'mots' },
            { id: 'telephonie', label: 'téléphonie' },
          ],
        },
        {
          id: 'combinatoire',
          label: 'Combinatoire',
          sousEpreuves: [
            { id: 'jetons-3c', label: 'jetons 3C' },
            { id: 'tab-cart-complet', label: 'tab. cart. complet' },
          ],
        },
        {
          id: 'seriation',
          label: 'Sériation',
          sousEpreuves: [
            { id: 'entiers', label: 'entiers' },
            { id: 'decimaux', label: 'décimaux' },
          ],
        },
        {
          id: 'inclusion',
          label: 'Inclusion',
          sousEpreuves: [
            { id: '2-niveaux', label: '2 niveaux' },
            { id: '3-niveaux', label: '3 niveaux' },
          ],
        },
        {
          id: 'conservation',
          label: 'Conservation',
          sousEpreuves: [
            { id: 'qte-discontinues', label: 'Qté discontinues' },
            { id: 'qte-continue', label: 'Qté continue' },
            { id: 'conservation-justif', label: 'avec justification' },
            { id: 'liquides-longueurs', label: 'liquides-longueurs' },
            { id: 'volumes', label: 'volumes' },
          ],
        },
        {
          id: 'chaine-numerique',
          label: 'Chaîne numérique',
          sousEpreuves: [
            { id: 'figures', label: 'figures' },
            { id: 'diaporama-1', label: 'diaporama 1' },
            { id: 'diaporama-2', label: 'diaporama 2' },
          ],
        },
        {
          id: 'numerosite',
          label: 'Numérosité',
          sousEpreuves: [
            { id: 'echelles-1-zareki', label: 'échelles 1 Zareki' },
            { id: 'echelles-2-zareki', label: 'échelles 2 Zareki' },
            { id: 'echelles-3', label: 'échelles 3' },
            { id: 'voc-estim-evac', label: 'Voc. Estim. EVAC' },
          ],
        },
        {
          id: 'numeration-entiere',
          label: 'Numération entière',
          sousEpreuves: [{ id: 'global', label: 'numération entière' }],
        },
        {
          id: 'numeration-decimale',
          label: 'Numération décimale',
          sousEpreuves: [{ id: 'global', label: 'numération décimale' }],
        },
        {
          id: 'fractions',
          label: 'Fractions',
          sousEpreuves: [{ id: 'global', label: 'fractions' }],
        },
        {
          id: 'transcodage',
          label: 'Transcodage',
          sousEpreuves: [
            { id: 'lecture', label: 'lecture' },
            { id: 'ecriture', label: 'écriture' },
            { id: 'sens', label: 'sens' },
          ],
        },
        {
          id: 'faits-numeriques',
          label: 'Faits numériques',
          sousEpreuves: [{ id: 'global', label: 'faits numériques' }],
        },
        {
          id: 'techniques-operatoires',
          label: 'Techniques opératoires',
          sousEpreuves: [{ id: 'global', label: 'techniques opératoires' }],
        },
        {
          id: 'problemes-schematises',
          label: 'Problèmes — schématisés',
          sousEpreuves: [{ id: 'global', label: 'schématisés' }],
        },
        {
          id: 'problemes-classiques',
          label: 'Problèmes — classiques',
          sousEpreuves: [{ id: 'global', label: 'classiques' }],
        },
        {
          id: 'proportions-continu',
          label: 'Proportions continu',
          sousEpreuves: [{ id: 'global', label: 'proportions continu' }],
        },
        {
          id: 'proportions-discontinu',
          label: 'Proportions discontinu',
          sousEpreuves: [{ id: 'global', label: 'proportions discontinu' }],
        },
      ],
    },
  ],
}
