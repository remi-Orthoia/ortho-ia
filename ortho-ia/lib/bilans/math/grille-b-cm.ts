import type { GrilleBilan, Niveau } from './types'

/**
 * Grille B-CM — Profil du Calcul et des Mathématiques (enfant, cycle II-III).
 *
 * Structure matricielle EXACTE tirée du PDF source
 * (docs/Bilans Sources/Profil-B CM.pdf — Elsa DALL'AGNOL, batterie B-LM2 +
 * TEDI-MATH + EVAC + tests cliniques associés).
 *
 * Deux sections (deux sous-matrices) :
 *   1. Section développementale (lignes = âge en mois, 5 ans → 10 ans)
 *      → Compétences logiques (Classification, Combinatoire, Sériation,
 *        Inclusion, Conservation), Chaîne numérique, Dénombrement, Numérosité.
 *   2. Section scolaire (lignes = classes GSM → CM2)
 *      → Numération entière, Numération décimale, Transcodages, Faits
 *        numériques, Techniques opératoires, Problèmes.
 *
 * Règle UX imposée : SEULES les cellules (intersections niveau × test) sont
 * cotables. Les noms d'épreuves macro (en-têtes de colonnes groupées) et les
 * niveaux (en-têtes de lignes) ne le sont jamais.
 *
 * Toute modification de cette grille casse les bilans déjà enregistrés
 * (les IDs servent de clés JSON dans crbos.resultats).
 */

/** Niveaux par âge — section développementale (5 à 10 ans).
 *  Ordre PDF : haut = max (10 ans), bas = min (5 ans 60-62 mo).
 *  En UI on garde ce même ordre top-down pour matcher la grille papier. */
const NIVEAUX_AGE: Niveau[] = [
  { id: 'ans-10',     label: '10 ans' },
  { id: 'ans-9',      label: '9 ans'  },
  { id: 'mo-99-101',  label: '8 ans', subLabel: '99-101 mo' },
  { id: 'mo-96-98',   label: '8 ans', subLabel: '96-98 mo'  },
  { id: 'mo-93-95',   label: '8 ans', subLabel: '93-95 mo'  },
  { id: 'mo-90-92',   label: '8 ans', subLabel: '90-92 mo'  },
  { id: 'mo-87-89',   label: '7 ans', subLabel: '87-89 mo'  },
  { id: 'mo-84-86',   label: '7 ans', subLabel: '84-86 mo'  },
  { id: 'mo-81-83',   label: '7 ans', subLabel: '81-83 mo'  },
  { id: 'mo-78-80',   label: '6 ans', subLabel: '78-80 mo'  },
  { id: 'mo-75-77',   label: '6 ans', subLabel: '75-77 mo'  },
  { id: 'mo-72-74',   label: '6 ans', subLabel: '72-74 mo'  },
  { id: 'mo-69-71',   label: '6 ans', subLabel: '69-71 mo'  },
  { id: 'mo-66-68',   label: '5 ans', subLabel: '66-68 mo'  },
  { id: 'mo-63-65',   label: '5 ans', subLabel: '63-65 mo'  },
  { id: 'mo-60-62',   label: '5 ans', subLabel: '60-62 mo'  },
]

/** Niveaux par classe scolaire — section scolaire.
 *  Ordre PDF : CM2 en haut → GSM en bas. */
const NIVEAUX_CLASSE: Niveau[] = [
  { id: 'cm2', label: 'CM2' },
  { id: 'cm1', label: 'CM1' },
  { id: 'ce2', label: 'CE2' },
  { id: 'ce1', label: 'CE1' },
  { id: 'cp',  label: 'CP'  },
  { id: 'gsm', label: 'GSM' },
]

export const GRILLE_B_CM: GrilleBilan = {
  id: 'b-cm',
  label: 'B-CM',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour enfant (cycles II et III). ' +
    'Cotation cellule par cellule à 3 niveaux : réussite spontanée, après étayage, échec.',
  sections: [
    // ========================================================================
    // SECTION 1 — DÉVELOPPEMENTAL (par âge)
    // ========================================================================
    {
      id: 'developpemental',
      label: 'Compétences logiques et habiletés numériques de base',
      description: 'Tests gradués par âge (5 à 10 ans). Cote chaque test au niveau correspondant à la performance du patient.',
      niveaux: NIVEAUX_AGE,
      epreuves: [
        {
          id: 'classifications',
          label: 'Classifications',
          sousEpreuves: [
            { id: 'jetons', label: 'jetons' },
            { id: 'cartes', label: 'cartes' },
          ],
        },
        {
          id: 'combinatoire',
          label: 'Combinatoire',
          sousEpreuves: [
            { id: 'jetons',    label: 'jetons' },
            { id: 'vetements', label: 'vêtements' },
          ],
        },
        {
          id: 'seriation',
          label: 'Sériation',
          sousEpreuves: [
            { id: 'baguettes', label: 'baguettes' },
            { id: 'ronds',     label: 'ronds' },
          ],
        },
        {
          id: 'inclusion',
          label: 'Inclusion',
          sousEpreuves: [
            { id: 'inclusion', label: 'inclusion' },
          ],
        },
        {
          id: 'conservation',
          label: 'Conservations',
          sousEpreuves: [
            { id: 'lapins',    label: 'lapins' },
            { id: 'baguettes', label: 'baguettes' },
          ],
        },
        {
          id: 'chaine-numerique',
          label: 'Chaîne numérique',
          sousEpreuves: [
            { id: 'chaine', label: 'chaîne (TEDI-MATH)' },
          ],
        },
        {
          id: 'denombrement',
          label: 'Dénombrement',
          sousEpreuves: [
            { id: 'gommettes', label: 'gommettes' },
          ],
        },
        {
          id: 'numerosite',
          label: 'Numérosité',
          sousEpreuves: [
            { id: 'estim-grandeurs',   label: 'estim. grandeurs' },
            { id: 'echelles-1-zareki', label: 'échelles 1 ZAREKI' },
            { id: 'echelles-2-zareki', label: 'échelles 2 ZAREKI' },
            { id: 'voc-estim-evac',    label: 'Voc. Estim. EVAC' },
          ],
        },
      ],
    },

    // ========================================================================
    // SECTION 2 — SCOLAIRE (par classe)
    // ========================================================================
    {
      id: 'scolaire',
      label: 'Numération, opérations et résolution de problèmes',
      description: 'Tests gradués par classe scolaire (GSM à CM2). Cote chaque test au niveau correspondant à la performance du patient.',
      niveaux: NIVEAUX_CLASSE,
      epreuves: [
        {
          id: 'numeration-entiere',
          label: 'Numération entière',
          sousEpreuves: [
            { id: 'appariement', label: 'appariement nb u./jetons' },
            { id: '2-chiffres',  label: 'nb à 2 chiffres' },
            { id: '3-chiffres',  label: 'nb à 3 chiffres' },
            { id: '4-6-chiffres', label: 'nb 4-6 chiffres' },
            { id: '7-chiffres',   label: 'nb 7 chiffres et +' },
          ],
        },
        {
          id: 'numeration-decimale',
          label: 'Numération décimale',
          sousEpreuves: [
            { id: 'dixiemes',  label: 'dixièmes' },
            { id: 'centiemes', label: 'centièmes' },
            { id: 'milliemes', label: 'millièmes' },
          ],
        },
        {
          id: 'transcodage',
          label: 'Transcodages',
          sousEpreuves: [
            { id: 'lecture',  label: 'lecture nb' },
            { id: 'dictee',   label: 'dictée nb' },
            { id: 'sens-ops', label: 'sens opérations' },
          ],
        },
        {
          id: 'faits-numeriques',
          label: 'Faits numériques',
          sousEpreuves: [
            { id: 'addition',       label: 'addition' },
            { id: 'soustraction',   label: 'soustraction' },
            { id: 'multiplication', label: 'multiplication' },
            { id: 'division',       label: 'division' },
          ],
        },
        {
          id: 'techniques-operatoires',
          label: 'Techniques opératoires',
          sousEpreuves: [
            { id: 'addition',       label: 'addition posée' },
            { id: 'soustraction',   label: 'soustraction posée' },
            { id: 'multiplication', label: 'multiplication posée' },
            { id: 'division',       label: 'division posée' },
          ],
        },
        {
          id: 'problemes',
          label: 'Problèmes',
          sousEpreuves: [
            { id: 'cartes',      label: 'cartes (Riley-Greeno-Heller)' },
            { id: 'schematises', label: 'schématisés (B-LM2)' },
            { id: 'enonces',     label: 'énoncés classiques' },
          ],
        },
      ],
    },
  ],
}
