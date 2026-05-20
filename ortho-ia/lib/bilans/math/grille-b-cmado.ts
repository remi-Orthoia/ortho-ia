import type { GrilleBilan, Niveau, Criterion } from './types'

/**
 * Grille B-CMado — Profil du Calcul et des Mathématiques (adolescent, collège).
 *
 * Reproduction FIDÈLE du fichier source Excel (Profil B-CMado.xlsx) :
 *   3 sections (Grilles 1, 2 et 3) avec des lignes Collège / Cycle III /
 *   Cycle II. Les critères sont placés au bon niveau avec FUSION verticale
 *   quand ils couvrent plusieurs lignes consécutives.
 *
 * Source : docs/Bilans Sources/Profil B-CMado.xlsx (équipe Elsa DALL'AGNOL).
 * Le contenu suit l'audit cellule par cellule réalisé par Laurie.
 */

// ============================================================================
// Niveaux (lignes) partagés par les 3 sections — chaque section utilise un
// sous-ensemble. Grille 1 et 3 = 6 lignes (pas de coll-3) ; Grille 2 = 7
// lignes (coll-3 utilisé par Voc. Estim. EVAC).
// ============================================================================
const NIV: Record<string, Niveau> = {
  coll1: { id: 'coll-1', label: 'Collège', subLabel: '1' },
  coll2: { id: 'coll-2', label: 'Collège', subLabel: '2' },
  coll3: { id: 'coll-3', label: 'Collège', subLabel: '3' },
  cyc31: { id: 'cyc3-1', label: 'Cycle III', subLabel: '1' },
  cyc32: { id: 'cyc3-2', label: 'Cycle III', subLabel: '2' },
  cyc21: { id: 'cyc2-1', label: 'Cycle II', subLabel: '1' },
  cyc22: { id: 'cyc2-2', label: 'Cycle II', subLabel: '2' },
}

const NIVEAUX_G1 = [NIV.coll1, NIV.coll2, NIV.cyc31, NIV.cyc32, NIV.cyc21, NIV.cyc22]
const NIVEAUX_G2 = [NIV.coll1, NIV.coll2, NIV.coll3, NIV.cyc31, NIV.cyc32, NIV.cyc21, NIV.cyc22]
const NIVEAUX_G3 = [NIV.coll1, NIV.coll2, NIV.cyc31, NIV.cyc32, NIV.cyc21, NIV.cyc22]

const c = (id: string, niveauIds: string[], label: string): Criterion => ({ id, niveauIds, label })

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
      description: 'Compétences logiques — coche le critère atteint par le patient.',
      niveaux: NIVEAUX_G1,
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
                c('c1', ['coll-2'], 'isole 4C'),
                c('c2', ['cyc3-1'], 'isole 3C'),
                c('c3', ['cyc3-2'], 'isole 2C'),
                c('c4', ['cyc2-1'], 'isole 1C'),
              ],
            },
            {
              id: 'mots', label: 'mots',
              criteres: [
                c('c1', ['coll-1'], 'isole 4C'),
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
                c('c1', ['coll-1', 'coll-2'], 'calcul ou schéma'),
                c('c2', ['cyc3-1', 'cyc3-2'], 'complet'),
                c('c3', ['cyc2-1', 'cyc2-2'], 'incomplet'),
              ],
            },
            {
              id: 'jetons-3c', label: 'jetons 3C',
              criteres: [
                c('c1', ['coll-2'], 'tab. cart.'),
                c('c2', ['cyc3-1', 'cyc3-2'], 'complet'),
                c('c3', ['cyc2-1', 'cyc2-2'], 'incomplet'),
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
                c('c1', ['coll-2', 'cyc3-1'], '4 nb corrects'),
                c('c2', ['cyc2-1'], '3 nb corrects'),
                c('c3', ['cyc2-2'], '2 nb corrects'),
              ],
            },
            {
              id: 'decimaux', label: 'décimaux',
              criteres: [
                c('c1', ['coll-1', 'coll-2', 'cyc3-1'], '3 nb corrects'),
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
                c('c1', ['coll-1', 'coll-2'], '3 niveaux'),
                c('c2', ['cyc3-1'], '2 niveaux'),
                c('c3', ['cyc2-1'], '1 niveau'),
                c('c4', ['cyc2-2'], 'aucune inc.'),
              ],
            },
            {
              id: 'la-ferme', label: 'la ferme',
              criteres: [
                c('c1', ['coll-1', 'coll-2'], 'réussite'),
                c('c2', ['cyc3-1', 'cyc3-2'], 'réussite partielle'),
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
                c('c1', ['coll-1', 'coll-2'], 'Conservation des volumes'),
                c('c2', ['cyc3-1', 'cyc3-2'], 'Conservation avec justification'),
                c('c3', ['cyc2-1', 'cyc2-2'], 'Conservation sans justification'),
              ],
            },
            {
              id: 'qte-continue', label: 'Qté continue',
              criteres: [
                c('c1', ['coll-1', 'coll-2', 'cyc3-1', 'cyc3-2'], 'réussite'),
              ],
            },
            {
              id: 'recipient-eau', label: "récipient d'eau",
              criteres: [
                c('c1', ['coll-1', 'coll-2'], 'réussite'),
              ],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // GRILLE 2 — Chaîne numérique, Dénombrement, Numérosité
    // ========================================================================
    {
      id: 'grille-2',
      label: 'Chaîne numérique, Dénombrement, Numérosité — sens du nombre',
      description: 'Habiletés numériques de base.',
      niveaux: NIVEAUX_G2,
      epreuves: [
        {
          id: 'chaine-numerique', label: 'CHAÎNE NUMÉRIQUE',
          sousEpreuves: [
            {
              id: 'chaine', label: 'Chaîne num.',
              criteres: [
                c('c1', ['cyc3-1'], '20/20'),
                c('c2', ['cyc2-1'], '12/20'),
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
                c('c1', ['coll-1'], 'réussite avec regroup.'),
                c('c2', ['cyc3-1'], 'réussite sans regroup.'),
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
                c('c1', ['coll-2'], 'calcul'),
                c('c2', ['cyc3-1'], '6 ok'),
                c('c3', ['cyc3-2'], '5 ok'),
                c('c4', ['cyc2-1'], '4 ok'),
              ],
            },
            {
              id: 'diaporama-2', label: 'diaporama 2',
              criteres: [],
            },
            {
              id: 'echelles-1-zareki', label: 'échelles 1 Zareki',
              criteres: [
                c('c1', ['cyc3-1'], '7/12'),
                c('c2', ['cyc2-1'], '12/12'),
              ],
            },
            {
              id: 'echelles-2-zareki', label: 'échelles 2 Zareki',
              criteres: [
                c('c1', ['cyc2-1'], '5/12'),
              ],
            },
            {
              id: 'echelles-3', label: 'échelles 3',
              criteres: [],
            },
            {
              id: 'voc-estim-evac', label: 'Voc. Estim. EVAC',
              criteres: [
                c('c1', ['coll-1'], '11'),
                c('c2', ['coll-2'], '10'),
                c('c3', ['coll-3'], '9'),
                c('c4', ['cyc3-1'], '8'),
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
      niveaux: NIVEAUX_G3,
      epreuves: [
        {
          id: 'numeration', label: 'NUMÉRATION',
          sousEpreuves: [
            {
              id: 'entiere', label: 'entière',
              criteres: [
                c('c1', ['cyc3-1', 'cyc3-2'], 'grands nombres'),
                c('c2', ['cyc2-1', 'cyc2-2'], 'mille'),
              ],
            },
            {
              id: 'decimale', label: 'décimale',
              criteres: [
                c('c1', ['cyc3-1', 'cyc3-2'], 'décimale'),
              ],
            },
            {
              id: 'fractions', label: 'fractions',
              criteres: [],
            },
          ],
        },
        {
          id: 'transcodage', label: 'TRANSCODAGE',
          sousEpreuves: [
            {
              id: 'lecture', label: 'lecture',
              criteres: [
                c('c1', ['cyc3-1', 'cyc3-2'], 'quantitatif manip'),
                c('c2', ['cyc2-1', 'cyc2-2'], '3 chiffres'),
              ],
            },
            {
              id: 'ecriture', label: 'écriture',
              criteres: [
                c('c1', ['cyc3-1', 'cyc3-2'], 'décimaux / frac. grands nbres'),
                c('c2', ['cyc2-1', 'cyc2-2'], '3 chiffres'),
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
                c('c1', ['coll-2'], 'différents sens'),
                c('c2', ['cyc3-1'], 'décimaux / frac. grands nbres'),
                c('c3', ['cyc2-1'], 'multiplication'),
                c('c4', ['cyc2-2'], 'add. + sous.'),
              ],
            },
            {
              id: 'faits-numeriques', label: 'faits numériques',
              criteres: [
                c('c1', ['cyc3-1'], 'division'),
                c('c2', ['cyc3-2'], 'soustractions'),
                c('c3', ['cyc2-1'], 'additions'),
              ],
            },
            {
              id: 'techniques', label: 'techniques',
              criteres: [
                c('c1', ['cyc3-1'], 'multi + div'),
                c('c2', ['cyc3-2'], 'entiers'),
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
                c('c1', ['coll-1'], 'proportions'),
                c('c2', ['cyc3-1'], 'décimaux'),
                c('c3', ['cyc2-1'], '14/20'),
              ],
            },
            {
              id: 'schematises', label: 'schématisés',
              criteres: [
                c('c1', ['cyc3-1'], '20/20'),
                c('c2', ['cyc2-1'], 'add. + sous. + multi'),
              ],
            },
            {
              id: 'classiques', label: 'classiques',
              criteres: [
                c('c1', ['coll-1'], 'étapes continu'),
                c('c2', ['coll-2'], 'chrono. pertur.'),
                c('c3', ['cyc3-1'], 'div. + étapes discontinu'),
                c('c4', ['cyc3-2'], 'div. + étapes'),
                c('c5', ['cyc2-1'], 'add. + sous. + multi'),
              ],
            },
          ],
        },
      ],
    },
  ],
}
