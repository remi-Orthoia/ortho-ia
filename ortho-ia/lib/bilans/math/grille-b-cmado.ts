import type { GrilleBilan, Niveau } from './types'

/**
 * Grille B-CMado — Profil du Calcul et des Mathématiques (adolescent, collège).
 *
 * ⚠️ Version transitoire : la matrice complète par niveau collège (6e → 3e)
 * avec critères graduels sera ajoutée dans un commit suivant. Pour l'instant
 * on garde une SECTION UNIQUE avec un seul niveau "tous niveaux" et chaque
 * test a un seul critère portant le libellé du test.
 *
 * Source : docs/Bilans Sources/Profil B-CMado.xlsx
 */

const NIVEAU_UNIQUE: Niveau[] = [
  { id: 'tous', label: 'tous niveaux' },
]

/** Petit helper : pour une sous-épreuve "mono", on génère 1 critère unique
 *  portant le même libellé que la sous-épreuve (placé au niveau unique). */
function mono(label: string, id = 'global') {
  return [{ id, niveauId: 'tous', label }]
}

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
      niveaux: NIVEAU_UNIQUE,
      epreuves: [
        {
          id: 'classifications', label: 'Classifications',
          sousEpreuves: [
            { id: 'set',         label: 'SET',         criteres: mono('SET') },
            { id: '10-cartes',   label: '10 cartes',   criteres: mono('10 cartes') },
            { id: 'mots',        label: 'mots',        criteres: mono('mots') },
            { id: 'telephonie',  label: 'téléphonie',  criteres: mono('téléphonie') },
          ],
        },
        {
          id: 'combinatoire', label: 'Combinatoire',
          sousEpreuves: [
            { id: 'jetons-3c',         label: 'jetons 3C',          criteres: mono('jetons 3C') },
            { id: 'tab-cart-complet',  label: 'tab. cart. complet', criteres: mono('tab. cart. complet') },
          ],
        },
        {
          id: 'seriation', label: 'Sériation',
          sousEpreuves: [
            { id: 'entiers',  label: 'entiers',  criteres: mono('entiers') },
            { id: 'decimaux', label: 'décimaux', criteres: mono('décimaux') },
          ],
        },
        {
          id: 'inclusion', label: 'Inclusion',
          sousEpreuves: [
            { id: '2-niveaux', label: '2 niveaux', criteres: mono('2 niveaux') },
            { id: '3-niveaux', label: '3 niveaux', criteres: mono('3 niveaux') },
          ],
        },
        {
          id: 'conservation', label: 'Conservation',
          sousEpreuves: [
            { id: 'qte-discontinues',    label: 'Qté discontinues',    criteres: mono('Qté discontinues') },
            { id: 'qte-continue',        label: 'Qté continue',        criteres: mono('Qté continue') },
            { id: 'conservation-justif', label: 'avec justification',  criteres: mono('avec justification') },
            { id: 'liquides-longueurs',  label: 'liquides-longueurs',  criteres: mono('liquides-longueurs') },
            { id: 'volumes',             label: 'volumes',             criteres: mono('volumes') },
          ],
        },
        {
          id: 'chaine-numerique', label: 'Chaîne numérique',
          sousEpreuves: [
            { id: 'figures',      label: 'figures',      criteres: mono('figures') },
            { id: 'diaporama-1',  label: 'diaporama 1',  criteres: mono('diaporama 1') },
            { id: 'diaporama-2',  label: 'diaporama 2',  criteres: mono('diaporama 2') },
          ],
        },
        {
          id: 'numerosite', label: 'Numérosité',
          sousEpreuves: [
            { id: 'echelles-1-zareki', label: 'échelles 1 Zareki', criteres: mono('échelles 1 Zareki') },
            { id: 'echelles-2-zareki', label: 'échelles 2 Zareki', criteres: mono('échelles 2 Zareki') },
            { id: 'echelles-3',        label: 'échelles 3',        criteres: mono('échelles 3') },
            { id: 'voc-estim-evac',    label: 'Voc. Estim. EVAC',  criteres: mono('Voc. Estim. EVAC') },
          ],
        },
        {
          id: 'numeration-entiere',  label: 'Numération entière',
          sousEpreuves: [{ id: 'global', label: 'numération entière', criteres: mono('numération entière') }],
        },
        {
          id: 'numeration-decimale', label: 'Numération décimale',
          sousEpreuves: [{ id: 'global', label: 'numération décimale', criteres: mono('numération décimale') }],
        },
        {
          id: 'fractions', label: 'Fractions',
          sousEpreuves: [{ id: 'global', label: 'fractions', criteres: mono('fractions') }],
        },
        {
          id: 'transcodage', label: 'Transcodage',
          sousEpreuves: [
            { id: 'lecture',  label: 'lecture',  criteres: mono('lecture') },
            { id: 'ecriture', label: 'écriture', criteres: mono('écriture') },
            { id: 'sens',     label: 'sens',     criteres: mono('sens') },
          ],
        },
        {
          id: 'faits-numeriques', label: 'Faits numériques',
          sousEpreuves: [{ id: 'global', label: 'faits numériques', criteres: mono('faits numériques') }],
        },
        {
          id: 'techniques-operatoires', label: 'Techniques opératoires',
          sousEpreuves: [{ id: 'global', label: 'techniques opératoires', criteres: mono('techniques opératoires') }],
        },
        {
          id: 'problemes-schematises', label: 'Problèmes — schématisés',
          sousEpreuves: [{ id: 'global', label: 'schématisés', criteres: mono('schématisés') }],
        },
        {
          id: 'problemes-classiques', label: 'Problèmes — classiques',
          sousEpreuves: [{ id: 'global', label: 'classiques', criteres: mono('classiques') }],
        },
        {
          id: 'proportions-continu', label: 'Proportions continu',
          sousEpreuves: [{ id: 'global', label: 'proportions continu', criteres: mono('proportions continu') }],
        },
        {
          id: 'proportions-discontinu', label: 'Proportions discontinu',
          sousEpreuves: [{ id: 'global', label: 'proportions discontinu', criteres: mono('proportions discontinu') }],
        },
      ],
    },
  ],
}
