import type { GrilleBilan, Niveau, Criterion } from './types'

/**
 * Grille B-CM — Profil du Calcul et des Mathématiques (enfant, cycle II-III).
 *
 * Reproduction FIDÈLE des deux matrices du PDF source (Elsa DALL'AGNOL,
 * batterie B-LM2 + TEDI-MATH + EVAC + tests cliniques associés). Les critères,
 * les fusions de cellules verticales et les cases grisées correspondent à
 * la grille papier validée par Laurie.
 *
 * Section 1 — Développementale (16 lignes : 10 ans → 5 ans 60-62 mo)
 * Section 2 — Scolaire (6 lignes : CM2 → GSM)
 */

// ============================================================================
// SECTION 1 — NIVEAUX par âge (16 lignes, top-down du PDF)
// ============================================================================
const NIVEAUX_DEV: Niveau[] = [
  { id: 'ans-10',    label: '10 ans' },
  { id: 'ans-9',     label: '9 ans'  },
  { id: 'mo-99-101', label: '8 ans', subLabel: '99-101 mo' },
  { id: 'mo-96-98',  label: '8 ans', subLabel: '96-98 mo'  },
  { id: 'mo-93-95',  label: '8 ans', subLabel: '93-95 mo'  },
  { id: 'mo-90-92',  label: '8 ans', subLabel: '90-92 mo'  },
  { id: 'mo-87-89',  label: '7 ans', subLabel: '87-89 mo'  },
  { id: 'mo-84-86',  label: '7 ans', subLabel: '84-86 mo'  },
  { id: 'mo-81-83',  label: '7 ans', subLabel: '81-83 mo'  },
  { id: 'mo-78-80',  label: '6 ans', subLabel: '78-80 mo'  },
  { id: 'mo-75-77',  label: '6 ans', subLabel: '75-77 mo'  },
  { id: 'mo-72-74',  label: '6 ans', subLabel: '72-74 mo'  },
  { id: 'mo-69-71',  label: '5 ans', subLabel: '69-71 mo'  },
  { id: 'mo-66-68',  label: '5 ans', subLabel: '66-68 mo'  },
  { id: 'mo-63-65',  label: '5 ans', subLabel: '63-65 mo'  },
  { id: 'mo-60-62',  label: '5 ans', subLabel: '60-62 mo'  },
]

const NIVEAUX_SCOLAIRE: Niveau[] = [
  { id: 'cm2', label: 'CM2' },
  { id: 'cm1', label: 'CM1' },
  { id: 'ce2', label: 'CE2' },
  { id: 'ce1', label: 'CE1' },
  { id: 'cp',  label: 'CP'  },
  { id: 'gsm', label: 'GSM' },
]

// Helpers pour écrire les critères de façon compacte.
const c = (id: string, niveauIds: string[], label: string): Criterion => ({ id, niveauIds, label })

export const GRILLE_B_CM: GrilleBilan = {
  id: 'b-cm',
  label: 'B-CM',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour enfant (cycles II et III). ' +
    'Cotation critère par critère à 3 niveaux : réussite spontanée, après étayage, échec.',
  sections: [
    // ========================================================================
    // SECTION 1 — Compétences logiques et habiletés numériques de base
    // ========================================================================
    {
      id: 'developpemental',
      label: 'Compétences logiques et habiletés numériques de base',
      description: 'Tests gradués par âge (5 à 10 ans, par tranche de 3 mois). Coche le critère atteint par le patient.',
      niveaux: NIVEAUX_DEV,
      epreuves: [
        {
          id: 'classification', label: 'CLASSIFICATION B-LM2',
          sousEpreuves: [
            {
              id: 'jetons', label: 'jetons',
              criteres: [
                c('c1', ['mo-96-98', 'mo-93-95'], 'isole 2 critères'),
                c('c2', ['mo-84-86', 'mo-81-83'], 'isole 1 critère'),
                c('c3', ['mo-69-71', 'mo-66-68', 'mo-63-65'], 'classe selon 2 critères'),
              ],
            },
            {
              id: 'cartes', label: 'cartes',
              criteres: [
                c('c1', ['mo-99-101'], 'isole 3c.'),
                c('c2', ['mo-96-98', 'mo-93-95'], 'isole 2 critères'),
                c('c3', ['mo-90-92', 'mo-87-89'], 'isole 1 critère'),
                c('c4', ['mo-69-71', 'mo-66-68', 'mo-63-65'], 'classe selon 2 critères'),
              ],
            },
          ],
        },
        {
          id: 'combinatoire', label: 'COMBINATOIRE B-LM2',
          sousEpreuves: [
            {
              id: 'jetons', label: 'jetons',
              criteres: [
                c('c1', ['mo-99-101'], 'fixe 1c.'),
                c('c2', ['mo-96-98'], 'strat. émerg.'),
                c('c3', ['mo-93-95'], 'incomplet'),
                c('c4', ['mo-90-92', 'mo-87-89'], 'appariement simple'),
              ],
            },
            {
              id: 'vetements', label: 'vêtements',
              criteres: [
                c('c1', ['mo-99-101'], 'nb correct'),
                c('c2', ['mo-96-98'],  'écr. fig. corr.'),
                c('c3', ['mo-93-95'],  'écr. fig. err.'),
                c('c4', ['mo-90-92'],  'nb oral erroné'),
                c('c5', ['mo-87-89'],  "n'écrit pas"),
                c('c6', ['mo-60-62'],  'ne sait pas'),
              ],
            },
          ],
        },
        {
          id: 'diaporama', label: 'DIAPORAMA E. DALL\'AGNOL',
          sousEpreuves: [
            {
              id: 'diaporama-1', label: 'diaporama 1',
              criteres: [
                c('c1', ['mo-81-83'], 'Réussite 5'),
                c('c2', ['mo-78-80'], 'Réussite 4'),
              ],
              niveauxGrises: ['mo-75-77', 'mo-72-74'],
            },
            {
              id: 'diaporama-2', label: 'diaporama 2',
              criteres: [
                c('c1', ['mo-81-83'], 'Réussite 30%'),
              ],
              niveauxGrises: ['mo-78-80', 'mo-75-77', 'mo-72-74'],
            },
          ],
        },
        {
          id: 'seriation', label: 'SÉRIATION B-LM2',
          sousEpreuves: [
            {
              id: 'baguettes', label: 'baguettes',
              criteres: [
                c('c1', ['mo-99-101', 'mo-96-98'], '5 dés. correctes'),
                c('c2', ['mo-87-89', 'mo-84-86'],  '4 dés. correctes'),
                c('c3', ['mo-78-80', 'mo-75-77'],  '3 dés. correctes'),
                c('c4', ['mo-60-62'], '2 dés. corr.'),
              ],
            },
            {
              id: 'ronds', label: 'ronds',
              criteres: [
                c('c1', ['mo-96-98', 'mo-93-95'], '4 ronds corr.'),
                c('c2', ['mo-90-92', 'mo-87-89'], '3 ronds corrects'),
                c('c3', ['mo-66-68', 'mo-63-65'], '2 ronds corrects'),
              ],
            },
          ],
        },
        {
          id: 'inclusion', label: 'INCLUSION B-LM2',
          sousEpreuves: [
            {
              id: 'fleurs', label: 'fleurs',
              criteres: [
                c('c1', ['mo-99-101'], '2 niv. incl. err.'),
                c('c2', ['mo-96-98', 'mo-93-95'], '1 niv. inclusion'),
                c('c3', ['mo-81-83', 'mo-78-80', 'mo-75-77'], 'aucune inclusion'),
              ],
            },
          ],
        },
        {
          id: 'conservations', label: 'CONSERVATIONS B-LM2',
          sousEpreuves: [
            {
              id: 'lapins', label: 'lapins',
              criteres: [
                c('c1', ['mo-99-101'], 'cons. just.'),
                c('c2', ['mo-96-98', 'mo-93-95', 'mo-90-92'], 'conservation sans justification'),
                c('c3', ['mo-87-89', 'mo-84-86'], 'identité collections en t. à t.'),
                c('c4', ['mo-78-80', 'mo-75-77', 'mo-72-74'], 'non identité collections en t. à t.'),
              ],
            },
            {
              id: 'baguettes', label: 'baguettes',
              criteres: [
                c('c1', ['mo-99-101'], 'cons. décalage'),
                c('c2', ['mo-96-98', 'mo-93-95'], 'conservation T'),
                c('c3', ['mo-78-80', 'mo-75-77'], 'conservation écart'),
                c('c4', ['mo-60-62'], 'non cons. écart'),
              ],
            },
          ],
        },
        {
          id: 'chaine-numerique', label: 'CHAÎNE NUM. TEDI-MATH',
          sousEpreuves: [
            {
              id: 'chaine', label: 'chaîne',
              criteres: [
                c('c1', ['mo-99-101'], '12/12'),
                c('c2', ['mo-93-95'],  '12'),
                c('c3', ['mo-87-89'],  '11'),
                c('c4', ['mo-81-83'],  '9'),
                c('c5', ['mo-75-77'],  '8'),
                c('c6', ['mo-69-71', 'mo-66-68', 'mo-63-65'], '6'),
              ],
            },
          ],
        },
        {
          id: 'denombrement', label: 'DÉNOMBREMENT B-LM2',
          sousEpreuves: [
            {
              id: 'gommettes', label: 'gommettes',
              // Critères à valider avec Laurie — placeholders raisonnables.
              criteres: [
                c('c1', ['mo-69-71'], '< 10 gommettes'),
                c('c2', ['mo-78-80'], '~ 15 gommettes'),
                c('c3', ['mo-87-89'], 'dénombrement complet'),
              ],
            },
          ],
        },
        {
          id: 'numerosite', label: 'NUMÉROSITÉ (TEDI MATH, B-LM2, ZAREKI)',
          sousEpreuves: [
            {
              id: 'estim-grandeurs', label: 'estim. grandeurs',
              criteres: [
                c('c1', ['ans-10'], '12/12'),
                c('c2', ['ans-9'],  '5/12 — 4,5/12'),
                c('c3', ['mo-99-101'], '10/12'),
                c('c4', ['mo-93-95', 'mo-90-92'], '18/18'),
                c('c5', ['mo-87-89'], '17/18'),
                c('c6', ['mo-84-86', 'mo-81-83'], '16/18'),
                c('c7', ['mo-78-80'], '14/18'),
                c('c8', ['mo-69-71', 'mo-66-68'], '6/18'),
                c('c9', ['mo-60-62'], '< 6/18'),
              ],
            },
            {
              id: 'echelles-1-zareki', label: 'échelles 1 ZAREKI',
              criteres: [
                c('c1', ['mo-99-101', 'mo-96-98'], '10/12'),
                c('c2', ['mo-93-95', 'mo-90-92', 'mo-87-89'], '8/12'),
                c('c3', ['mo-84-86', 'mo-81-83'], '4/12'),
              ],
              niveauxGrises: [
                'mo-78-80', 'mo-75-77', 'mo-72-74',
                'mo-69-71', 'mo-66-68', 'mo-63-65', 'mo-60-62',
              ],
            },
            {
              id: 'echelles-2-zareki', label: 'échelles 2 ZAREKI',
              criteres: [
                c('c1', ['ans-9'], '5/12 — 4,5/12'),
                c('c2', ['mo-81-83', 'mo-78-80'], '1/12'),
              ],
              niveauxGrises: [
                'mo-75-77', 'mo-72-74',
                'mo-69-71', 'mo-66-68', 'mo-63-65', 'mo-60-62',
              ],
            },
            {
              id: 'utilisation-nb', label: 'utilisation nb (garçons)',
              criteres: [
                c('c1', ['mo-99-101'], '2g 3b'),
                c('c2', ['mo-96-98'], 'parap. cons.'),
                c('c3', ['mo-93-95', 'mo-90-92'], 'chap. cpte / parap. cpte'),
                c('c4', ['mo-84-86', 'mo-81-83'], 'chap. ncp / parap. cpte'),
                c('c5', ['mo-60-62'], 'part sans cpter'),
              ],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // SECTION 2 — Numération, Transcodages, Opérations, Problèmes
    // ========================================================================
    {
      id: 'scolaire',
      label: 'Numération, transcodages, opérations et problèmes',
      description: 'Tests gradués par classe scolaire (GSM à CM2). Coche le critère atteint par le patient.',
      niveaux: NIVEAUX_SCOLAIRE,
      epreuves: [
        {
          id: 'numeration', label: 'NUMÉRATION B-LM2',
          sousEpreuves: [
            {
              id: 'numeration', label: 'numération',
              criteres: [
                c('c1', ['cm2'], 'nombres décimaux'),
                c('c2', ['cm1'], 'millions'),
                c('c3', ['ce2'], 'milliers'),
                c('c4', ['ce1'], 'centaine'),
                c('c5', ['cp'],  'dizaine'),
                c('c6', ['gsm'], 'appariement nb u. / jetons'),
              ],
            },
          ],
        },
        {
          id: 'transcodages', label: "TRANSCODAGES E. DALL'AGNOL",
          sousEpreuves: [
            {
              id: 'lecture', label: 'lecture nb',
              criteres: [
                c('c1', ['cm2'], 'nombres décimaux'),
                c('c2', ['cm1'], 'nombres de 7 chiffres et plus'),
                c('c3', ['ce2'], 'nombres de 4 à 6 chiffres'),
                c('c4', ['ce1'], 'nombres à 3 chiffres'),
                c('c5', ['cp'],  'nombres à 2 chiffres'),
                c('c6', ['gsm'], 'chiffres 0 à 9'),
              ],
            },
            {
              id: 'dictee', label: 'dictée nb',
              criteres: [
                c('c1', ['cm2'], 'nombres décimaux'),
                c('c2', ['cm1'], 'nombres de 7 chiffres et plus'),
                c('c3', ['ce2'], 'nombres de 4 à 6 chiffres'),
                c('c4', ['ce1'], 'nombres à 3 chiffres'),
                c('c5', ['cp'],  'nombres à 2 chiffres'),
                c('c6', ['gsm'], 'chiffres 0 à 9'),
              ],
            },
          ],
        },
        {
          id: 'operations-blm2', label: 'OPÉRATIONS B-LM2',
          sousEpreuves: [
            {
              id: 'sens', label: 'sens opérations',
              criteres: [
                c('c1', ['cm1'], 'division'),
                c('c2', ['ce2'], 'multiplication'),
                c('c3', ['ce1'], 'soustraction'),
                c('c4', ['cp'],  'addition'),
              ],
              niveauxGrises: ['gsm'],
            },
          ],
        },
        {
          id: 'operations-elsa', label: "OPÉRATIONS E. DALL'AGNOL",
          sousEpreuves: [
            {
              id: 'faits-num', label: 'faits numériques',
              criteres: [
                c('c1', ['cm2'], 'division'),
                c('c2', ['cm1'], 'multiplication'),
                c('c3', ['ce2'], 'soustraction'),
                c('c4', ['ce1'], 'addition'),
              ],
              niveauxGrises: ['cp', 'gsm'],
            },
            {
              id: 'techniques', label: 'techniques op.',
              criteres: [
                c('c1', ['cm2'], 'division'),
                c('c2', ['cm1'], 'division'),
                c('c3', ['ce2'], 'multiplication'),
                c('c4', ['ce1'], 'soustraction'),
                c('c5', ['cp'],  'addition'),
              ],
              niveauxGrises: ['gsm'],
            },
          ],
        },
        {
          id: 'problemes-rgh', label: 'PROBLÈMES Riley, Greeno, Heller',
          sousEpreuves: [
            {
              id: 'cartes', label: 'cartes',
              criteres: [
                c('c1', ['ce2'], '14/14'),
                c('c2', ['ce1'], '12/14'),
                c('c3', ['cp'],  '4/14'),
              ],
              // CM2, CM1, GSM → vides (pas grisés)
            },
          ],
        },
        {
          id: 'problemes-blm2', label: 'PROBLÈMES B-LM2',
          sousEpreuves: [
            {
              id: 'schematises', label: 'pb schématisés',
              criteres: [
                c('c1', ['cm1'], 'division et étapes'),
                c('c2', ['ce2'], 'multiplication'),
                c('c3', ['ce1'], 'soustraction'),
                c('c4', ['cp'],  'addition'),
              ],
              niveauxGrises: ['gsm'],
            },
          ],
        },
        {
          id: 'problemes-enonces', label: "PROBLÈMES B-LM2 & E.DALL'AGNOL",
          sousEpreuves: [
            {
              id: 'enonces', label: 'pb énoncés',
              criteres: [
                c('c1', ['cm2'], 'problèmes complexes'),
                c('c2', ['cm1'], 'division et étapes'),
                c('c3', ['ce2'], 'multiplication'),
                c('c4', ['ce1'], 'soustraction'),
                c('c5', ['cp'],  'addition'),
              ],
              niveauxGrises: ['gsm'],
            },
          ],
        },
      ],
    },
  ],
}
