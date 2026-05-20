import type { GrilleBilan, Niveau, Criterion } from './types'

/**
 * Grille B-CMado — Profil du Calcul et des Mathématiques (adolescent, collège).
 *
 * Reproduction FIDÈLE du fichier source `Profil B-CMado.xlsx` (équipe Elsa
 * DALL'AGNOL), reconstruite à partir du XML interne après fact-check
 * exhaustif cellule par cellule.
 *
 * Structure :
 *   - 7 niveaux partagés par les 3 grilles : 3 lignes Collège + 2 lignes
 *     Cycle III + 2 lignes Cycle II.
 *   - Grille 1 : compétences logiques et conservation (12 tests, 5 épreuves
 *     macro).
 *   - Grille 2 : chaîne numérique, dénombrement, numérosité — sens du nombre
 *     (8 tests, 3 épreuves macro).
 *   - Grille 3 : numération, transcodage, opérations, problèmes (11 tests,
 *     4 épreuves macro).
 *
 * Fusions verticales mappées 1-à-1 sur les mergeCells du XML Excel.
 */

const NIV: Record<string, Niveau> = {
  coll1: { id: 'coll-1', label: 'Collège', subLabel: '1' },
  coll2: { id: 'coll-2', label: 'Collège', subLabel: '2' },
  coll3: { id: 'coll-3', label: 'Collège', subLabel: '3' },
  cyc31: { id: 'cyc3-1', label: 'Cycle III', subLabel: '1' },
  cyc32: { id: 'cyc3-2', label: 'Cycle III', subLabel: '2' },
  cyc21: { id: 'cyc2-1', label: 'Cycle II', subLabel: '1' },
  cyc22: { id: 'cyc2-2', label: 'Cycle II', subLabel: '2' },
}

const NIVEAUX_ALL = [NIV.coll1, NIV.coll2, NIV.coll3, NIV.cyc31, NIV.cyc32, NIV.cyc21, NIV.cyc22]

const c = (id: string, niveauIds: string[], label: string): Criterion => ({ id, niveauIds, label })

// Raccourcis pour les fusions courantes.
const COLL_ALL = ['coll-1', 'coll-2', 'coll-3']
const COLL_23 = ['coll-2', 'coll-3']
const COLL_12 = ['coll-1', 'coll-2']
const CYC3_ALL = ['cyc3-1', 'cyc3-2']
const CYC2_ALL = ['cyc2-1', 'cyc2-2']
const CYC_ALL = ['cyc3-1', 'cyc3-2', 'cyc2-1', 'cyc2-2']

export const GRILLE_B_CMADO: GrilleBilan = {
  id: 'b-cmado',
  label: 'B-CMado',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour adolescent (collège). ' +
    'Cotation critère par critère à 3 niveaux : réussite spontanée, après étayage, échec.',
  sections: [
    // ========================================================================
    // GRILLE 1 — Classifications, Combinatoire, Sériation, Inclusion, Conservation
    // ========================================================================
    {
      id: 'grille-1',
      label: 'Classifications, Combinatoire, Sériation, Inclusion, Conservation',
      description: 'Compétences logiques.',
      niveaux: NIVEAUX_ALL,
      mergeNiveauxByLabel: true,
      cycleBackgrounds: true,
      epreuves: [
        {
          id: 'classifications', label: 'CLASSIFICATIONS',
          sousEpreuves: [
            {
              id: 'set', label: 'SET',
              criteres: [
                c('c1', ['cyc3-1'], 'isole 4C'),
                c('c2', ['cyc3-2'], 'isole 3C'),
                c('c3', ['cyc2-1'], 'isole 2C'),
                c('c4', ['cyc2-2'], 'isole 1C'),
              ],
            },
            {
              id: '10-cartes', label: '10 cartes',
              criteres: [
                c('c1', ['coll-3'], 'isole 4C'),
                c('c2', ['cyc3-1'], 'isole 3C'),
                c('c3', ['cyc3-2'], 'isole 2C'),
                c('c4', ['cyc2-1'], 'isole 1C'),
              ],
            },
            {
              id: 'mots', label: 'mots',
              criteres: [
                c('c1', COLL_ALL, 'isole 4C'),
                c('c2', ['cyc3-1'], 'isole 3C'),
                c('c3', ['cyc3-2'], 'isole 2C'),
                c('c4', ['cyc2-1'], 'isole 1C'),
              ],
            },
          ],
        },
        {
          id: 'combinatoire', label: 'COMBINATOIRE',
          sousEpreuves: [
            {
              id: 'telephonie', label: 'téléphonie',
              criteres: [
                c('c1', COLL_ALL, 'calcul ou schéma'),
                c('c2', CYC3_ALL, 'complet'),
                c('c3', CYC2_ALL, 'incomplet'),
              ],
            },
            {
              id: 'jetons-3c', label: 'jetons 3C',
              criteres: [
                c('c1', ['coll-3'], 'tab. cart.'),
                c('c2', CYC3_ALL, 'complet'),
                c('c3', CYC2_ALL, 'incomplet'),
              ],
            },
          ],
        },
        {
          id: 'seriation', label: 'SÉRIATION',
          sousEpreuves: [
            {
              id: 'entiers', label: 'entiers',
              criteres: [
                c('c1', CYC3_ALL, '4 nb corrects'),
                c('c2', ['cyc2-1'], '3 nb corrects'),
                c('c3', ['cyc2-2'], '2 nb corrects'),
              ],
            },
            {
              id: 'decimaux', label: 'décimaux',
              criteres: [
                c('c1', ['coll-3'], '4 nb corrects'),
                c('c2', CYC3_ALL, '3 nb corrects'),
              ],
            },
          ],
        },
        {
          id: 'inclusion', label: 'INCLUSION',
          sousEpreuves: [
            {
              id: 'etres-vivants', label: 'êtres vivants',
              criteres: [
                c('c1', COLL_ALL, '3 niveaux'),
                c('c2', CYC3_ALL, '2 niveaux'),
                c('c3', ['cyc2-1'], '1 niveau'),
                c('c4', ['cyc2-2'], 'aucune inc.'),
              ],
            },
            {
              id: 'la-ferme', label: 'la ferme',
              criteres: [
                c('c1', COLL_ALL, 'réussite'),
                c('c2', CYC3_ALL, 'réussite partielle'),
              ],
            },
          ],
        },
        {
          id: 'conservation', label: 'CONSERVATION',
          sousEpreuves: [
            {
              id: 'qte-discontinues', label: 'Qté Discontinues',
              criteres: [
                c('c1', CYC3_ALL, 'Conservation avec justification'),
                c('c2', CYC2_ALL, 'Conservation sans justification'),
              ],
            },
            {
              id: 'qte-continue', label: 'Qté continue',
              criteres: [
                c('c1', COLL_23, 'Conservation des volumes'),
                c('c2', CYC3_ALL, 'Conservation des liquides-longueurs'),
              ],
            },
            {
              id: 'recipient-eau', label: "récipient d'eau",
              criteres: [
                c('c1', ['coll-3'], 'réussite'),
              ],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // GRILLE 2 — Chaîne numérique, Dénombrement, Numérosité (sens du nombre)
    // ========================================================================
    {
      id: 'grille-2',
      label: 'Chaîne numérique, Dénombrement, Numérosité — sens du nombre',
      description: 'Habiletés numériques de base.',
      niveaux: NIVEAUX_ALL,
      mergeNiveauxByLabel: true,
      cycleBackgrounds: true,
      epreuves: [
        {
          id: 'chaine-numerique', label: 'CHAÎNE NUMÉRIQUE',
          sousEpreuves: [
            {
              id: 'chaine', label: 'Chaîne num.',
              criteres: [
                // B16:B17 merged dans le XML — "20/20" couvre Cycle III 1+2
                c('c1', CYC3_ALL, '20/20'),
                // B18:B19 merged — "12/20" couvre Cycle II 1+2
                c('c2', CYC2_ALL, '12/20'),
              ],
            },
          ],
        },
        {
          id: 'denombrement', label: 'DÉNOMBREMENT',
          sousEpreuves: [
            {
              id: 'figures', label: 'figures',
              criteres: [
                c('c1', COLL_ALL, 'réussite avec regroup.'),
                c('c2', CYC3_ALL, 'réussite sans regroup.'),
              ],
            },
          ],
        },
        {
          id: 'numerosite', label: 'NUMÉROSITÉ - SENS DU NOMBRE',
          sousEpreuves: [
            {
              id: 'diaporama-1', label: 'diaporama 1',
              criteres: [
                c('c1', COLL_ALL, '7 ok'),
                c('c2', ['cyc3-1'], '6 ok'),
                c('c3', ['cyc3-2'], '5 ok'),
                // D18:D19 merged — "4 ok" couvre Cycle II 1+2
                c('c4', CYC2_ALL, '4 ok'),
              ],
            },
            {
              id: 'diaporama-2', label: 'diaporama 2',
              criteres: [
                c('c1', COLL_ALL, '15%'),
                c('c2', CYC_ALL, '30%'),
              ],
            },
            {
              id: 'echelles-1-zareki', label: 'échelles 1 Zareki',
              criteres: [
                c('c1', CYC2_ALL, '12/12'),
              ],
            },
            {
              id: 'echelles-2-zareki', label: 'échelles 2 Zareki',
              criteres: [
                c('c1', COLL_23, '9/12'),
                c('c2', CYC3_ALL, '7/12'),
                c('c3', CYC2_ALL, '5/12'),
              ],
            },
            {
              id: 'echelles-3', label: 'échelles 3',
              criteres: [
                c('c1', ['coll-1'], '20/30'),
                c('c2', COLL_23, '15/30'),
              ],
            },
            {
              id: 'voc-estim-evac', label: 'Voc. Estim. EVAC',
              criteres: [
                c('c1', ['coll-1'], '11'),
                c('c2', ['coll-2'], '10'),
                c('c3', ['coll-3'], '9'),
                c('c4', CYC3_ALL, '8'),
                c('c5', ['cyc2-1'], '7.5'),
                c('c6', ['cyc2-2'], '5.5'),
              ],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // GRILLE 3 — Numération, Transcodage, Opérations, Problèmes
    // ========================================================================
    {
      id: 'grille-3',
      label: 'Numération, Transcodage, Opérations, Problèmes',
      description: 'Compétences scolaires.',
      niveaux: NIVEAUX_ALL,
      mergeNiveauxByLabel: true,
      cycleBackgrounds: true,
      epreuves: [
        {
          id: 'numeration', label: 'NUMÉRATION',
          sousEpreuves: [
            {
              id: 'entiere', label: 'entière',
              criteres: [
                c('c1', CYC3_ALL, 'grands nombres'),
                c('c2', CYC2_ALL, 'mille'),
              ],
            },
            {
              id: 'decimale', label: 'décimale',
              criteres: [
                c('c1', CYC3_ALL, 'décimale'),
              ],
            },
            {
              id: 'fractions', label: 'fractions',
              criteres: [
                c('c1', COLL_23, 'calcul'),
                c('c2', CYC3_ALL, 'quantitatif manip'),
              ],
            },
          ],
        },
        {
          id: 'transcodage', label: 'TRANSCODAGE',
          sousEpreuves: [
            {
              id: 'lecture', label: 'lecture',
              criteres: [
                c('c1', CYC3_ALL, 'décimaux/ frac. grands nbres'),
                c('c2', CYC2_ALL, '3 chiffres'),
              ],
            },
            {
              id: 'ecriture', label: 'écriture',
              criteres: [
                c('c1', CYC3_ALL, 'décimaux/ frac. grands nbres'),
                c('c2', CYC2_ALL, '3 chiffres'),
              ],
            },
          ],
        },
        {
          id: 'operations', label: 'OPÉRATIONS',
          sousEpreuves: [
            {
              id: 'sens', label: 'sens',
              criteres: [
                c('c1', ['coll-3'], 'différents sens'),
                c('c2', CYC3_ALL, 'division'),
                c('c3', ['cyc2-1'], 'multiplication'),
                c('c4', ['cyc2-2'], 'add. + sous.'),
              ],
            },
            {
              id: 'faits-numeriques', label: 'faits numériques',
              criteres: [
                c('c1', ['cyc3-1'], 'multi + div'),
                c('c2', ['cyc3-2'], 'soustractions'),
                c('c3', ['cyc2-1'], 'additions'),
              ],
            },
            {
              id: 'techniques', label: 'techniques',
              criteres: [
                c('c1', ['cyc3-1'], 'décimaux'),
                c('c2', ['cyc3-2', 'cyc2-1', 'cyc2-2'], 'entiers'),
              ],
            },
          ],
        },
        {
          id: 'problemes', label: 'PROBLÈMES',
          sousEpreuves: [
            {
              id: 'cartes', label: 'cartes',
              criteres: [
                c('c1', CYC3_ALL, '20/20'),
                c('c2', CYC2_ALL, '14/20'),
              ],
            },
            {
              id: 'schematises', label: 'schématisés',
              criteres: [
                c('c1', COLL_12, 'proportions'),
                c('c2', ['coll-3'], 'étapes continu'),
                c('c3', CYC3_ALL, 'div. + étapes discontinu'),
                c('c4', CYC2_ALL, 'add. + sous. + multi'),
              ],
            },
            {
              id: 'classiques', label: 'classiques',
              criteres: [
                c('c1', COLL_12, 'proportions'),
                c('c2', ['coll-3'], 'chrono. pertur.'),
                c('c3', CYC3_ALL, 'div. + étapes'),
                c('c4', CYC2_ALL, 'add. + sous. + multi'),
              ],
            },
          ],
        },
      ],
    },
  ],
}
