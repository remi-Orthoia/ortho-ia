import type { GrilleBilan, Niveau } from './types'

/**
 * Grille B-CM — Profil du Calcul et des Mathématiques (enfant, cycle II-III).
 *
 * Structure : 2 sections (développementale par âge / scolaire par classe).
 * Chaque test a ses critères graduels propres, placés au bon niveau (5-10 ans
 * ou GSM-CM2). Le tableau est SPARSE — toutes les intersections (niveau × test)
 * ne sont pas remplies, seules celles définies par le PDF source.
 *
 * Source : docs/Bilans Sources/Profil-B CM.pdf (Elsa DALL'AGNOL, B-LM2,
 * TEDI-MATH, EVAC). Les critères ci-dessous sont une transcription au
 * meilleur de la lecture du PDF — l'ortho peut affiner si besoin.
 */

/** Niveaux par âge — section développementale.
 *  Simplifiés à l'année (au lieu des sous-tranches mensuelles) pour limiter
 *  le nombre de lignes. L'ortho garde la précision via le critère choisi. */
const NIVEAUX_AGE: Niveau[] = [
  { id: 'ans-10', label: '10 ans' },
  { id: 'ans-9',  label: '9 ans'  },
  { id: 'ans-8',  label: '8 ans'  },
  { id: 'ans-7',  label: '7 ans'  },
  { id: 'ans-6',  label: '6 ans'  },
  { id: 'ans-5',  label: '5 ans'  },
]

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
    'Cotation critère par critère à 3 niveaux : réussite spontanée, après étayage, échec.',
  sections: [
    // ========================================================================
    // SECTION 1 — DÉVELOPPEMENTAL (par âge)
    // ========================================================================
    {
      id: 'developpemental',
      label: 'Compétences logiques et habiletés numériques de base',
      description: 'Tests gradués par âge (5 à 10 ans). Coche le critère atteint par le patient.',
      niveaux: NIVEAUX_AGE,
      epreuves: [
        {
          id: 'classifications',
          label: 'Classifications',
          sousEpreuves: [
            {
              id: 'jetons', label: 'jetons',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Classe selon 2 critères' },
                { id: 'c2', niveauId: 'ans-7', label: 'Isole 1 critère' },
                { id: 'c3', niveauId: 'ans-8', label: 'Isole 2 critères' },
              ],
            },
            {
              id: 'cartes', label: 'cartes',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Classe selon 2 critères' },
                { id: 'c2', niveauId: 'ans-6', label: '5 et 6 corrects' },
                { id: 'c3', niveauId: 'ans-8', label: '7 et 8 corrects' },
                { id: 'c4', niveauId: 'ans-8', label: '24 corrects' },
              ],
            },
          ],
        },
        {
          id: 'combinatoire',
          label: 'Combinatoire',
          sousEpreuves: [
            {
              id: 'jetons', label: 'jetons',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Réussite 4' },
                { id: 'c2', niveauId: 'ans-6', label: 'Réussite 5' },
                { id: 'c3', niveauId: 'ans-8', label: '1 critère isolé' },
                { id: 'c4', niveauId: 'ans-8', label: 'Stratégie émergente' },
              ],
            },
            {
              id: 'vetements', label: 'vêtements',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Réussite 30%' },
                { id: 'c2', niveauId: 'ans-7', label: 'Simple' },
                { id: 'c3', niveauId: 'ans-8', label: 'Incomplet' },
                { id: 'c4', niveauId: 'ans-8', label: 'Appariement' },
              ],
            },
          ],
        },
        {
          id: 'seriation',
          label: 'Sériation',
          sousEpreuves: [
            {
              id: 'baguettes', label: 'baguettes',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: '< 6/18' },
                { id: 'c2', niveauId: 'ans-6', label: '14-16/18' },
                { id: 'c3', niveauId: 'ans-7', label: '17-18/18' },
              ],
            },
            {
              id: 'ronds', label: 'ronds',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: '2 ronds corrects' },
                { id: 'c2', niveauId: 'ans-6', label: '3 ronds corrects' },
                { id: 'c3', niveauId: 'ans-7', label: '4 ronds corrects' },
                { id: 'c4', niveauId: 'ans-8', label: '5 désordrés' },
              ],
            },
          ],
        },
        {
          id: 'inclusion',
          label: 'Inclusion',
          sousEpreuves: [
            {
              id: 'inclusion', label: 'inclusion',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Aucune inclusion' },
                { id: 'c2', niveauId: 'ans-7', label: 'Inclusion fleurs' },
                { id: 'c3', niveauId: 'ans-8', label: '1 niveau d\'inclusion' },
                { id: 'c4', niveauId: 'ans-8', label: '2 niveaux d\'inclusion' },
              ],
            },
          ],
        },
        {
          id: 'conservation',
          label: 'Conservations',
          sousEpreuves: [
            {
              id: 'lapins', label: 'lapins',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: 'Non-conservation, écart' },
                { id: 'c2', niveauId: 'ans-6', label: 'Partage sans compter' },
                { id: 'c3', niveauId: 'ans-7', label: 'T (conservation)' },
                { id: 'c4', niveauId: 'ans-8', label: 'Conservation avec décalage' },
              ],
            },
            {
              id: 'baguettes', label: 'baguettes',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: 'Non-identité' },
                { id: 'c2', niveauId: 'ans-6', label: 'Écart d\'identité' },
                { id: 'c3', niveauId: 'ans-7', label: 'Conservation sans justification' },
                { id: 'c4', niveauId: 'ans-8', label: 'Conservation avec justification' },
              ],
            },
          ],
        },
        {
          id: 'chaine-numerique',
          label: 'Chaîne numérique (TEDI-MATH)',
          sousEpreuves: [
            {
              id: 'chaine', label: 'chaîne',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: 'Comptine jusqu\'à 10' },
                { id: 'c2', niveauId: 'ans-6', label: 'Comptine jusqu\'à 30' },
                { id: 'c3', niveauId: 'ans-7', label: 'Comptine fluide' },
                { id: 'c4', niveauId: 'ans-8', label: 'Énumération à rebours' },
              ],
            },
          ],
        },
        {
          id: 'denombrement',
          label: 'Dénombrement (B-LM2)',
          sousEpreuves: [
            {
              id: 'gommettes', label: 'gommettes',
              criteres: [
                { id: 'c1', niveauId: 'ans-5', label: '5-10 gommettes' },
                { id: 'c2', niveauId: 'ans-6', label: '15-20 gommettes' },
                { id: 'c3', niveauId: 'ans-7', label: 'Dénombrement complet' },
              ],
            },
          ],
        },
        {
          id: 'numerosite',
          label: 'Numérosité (B-LM2, TEDI MATH, EVAC)',
          sousEpreuves: [
            {
              id: 'estim-grandeurs', label: 'estim. grandeurs',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Estimation grossière' },
                { id: 'c2', niveauId: 'ans-8', label: 'Estimation fine' },
              ],
            },
            {
              id: 'echelles-1-zareki', label: 'échelles 1 ZAREKI',
              criteres: [
                { id: 'c1', niveauId: 'ans-6', label: 'Échelle 1 réussie' },
              ],
            },
            {
              id: 'echelles-2-zareki', label: 'échelles 2 ZAREKI',
              criteres: [
                { id: 'c1', niveauId: 'ans-7', label: 'Échelle 2 réussie' },
              ],
            },
            {
              id: 'voc-estim-evac', label: 'Voc. Estim. EVAC',
              criteres: [
                { id: 'c1', niveauId: 'ans-8', label: 'Vocabulaire estimatif' },
              ],
            },
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
      description: 'Tests gradués par classe scolaire (GSM à CM2). Coche le critère atteint par le patient.',
      niveaux: NIVEAUX_CLASSE,
      epreuves: [
        {
          id: 'numeration-entiere',
          label: 'Numération entière (B-LM2)',
          sousEpreuves: [
            {
              id: 'numeration', label: 'numération',
              criteres: [
                { id: 'c1', niveauId: 'gsm', label: 'Appariement nb u./jetons' },
                { id: 'c2', niveauId: 'cp',  label: 'Nb à 2 chiffres' },
                { id: 'c3', niveauId: 'ce1', label: 'Nb à 3 chiffres' },
                { id: 'c4', niveauId: 'ce2', label: 'Nb 4-6 chiffres' },
                { id: 'c5', niveauId: 'cm1', label: 'Nb 7 chiffres et +' },
              ],
            },
          ],
        },
        {
          id: 'numeration-decimale',
          label: 'Numération décimale',
          sousEpreuves: [
            {
              id: 'decimaux', label: 'décimaux',
              criteres: [
                { id: 'c1', niveauId: 'gsm', label: 'Chiffres 0-9' },
                { id: 'c2', niveauId: 'cp',  label: 'Dizaine' },
                { id: 'c3', niveauId: 'ce1', label: 'Centaine' },
                { id: 'c4', niveauId: 'ce2', label: 'Milliers' },
                { id: 'c5', niveauId: 'cm2', label: 'Millions' },
              ],
            },
          ],
        },
        {
          id: 'transcodage',
          label: 'Transcodages (E. DALL\'AGNOL)',
          sousEpreuves: [
            {
              id: 'lecture', label: 'lecture nb',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Lecture nb ≤ 100' },
                { id: 'c2', niveauId: 'ce1', label: 'Lecture nb ≤ 1000' },
                { id: 'c3', niveauId: 'cm1', label: 'Lecture grands nb' },
              ],
            },
            {
              id: 'dictee', label: 'dictée nb',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Dictée nb ≤ 100' },
                { id: 'c2', niveauId: 'ce1', label: 'Dictée nb ≤ 1000' },
                { id: 'c3', niveauId: 'cm1', label: 'Dictée grands nb' },
              ],
            },
            {
              id: 'sens-ops', label: 'sens opérations',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Addition' },
                { id: 'c2', niveauId: 'ce1', label: 'Soustraction' },
                { id: 'c3', niveauId: 'ce2', label: 'Multiplication' },
                { id: 'c4', niveauId: 'cm1', label: 'Division' },
              ],
            },
          ],
        },
        {
          id: 'faits-numeriques',
          label: 'Faits numériques (OPERATIONS E. DALL\'AGNOL)',
          sousEpreuves: [
            {
              id: 'addition', label: 'addition',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Tables addition (4/14)' },
                { id: 'c2', niveauId: 'ce1', label: 'Tables addition (12/14)' },
                { id: 'c3', niveauId: 'ce2', label: 'Tables addition (14/14)' },
              ],
            },
            {
              id: 'soustraction', label: 'soustraction',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Tables soustraction acquises' },
                { id: 'c2', niveauId: 'ce1', label: 'Tables soustraction fluides' },
              ],
            },
            {
              id: 'multiplication', label: 'multiplication',
              criteres: [
                { id: 'c1', niveauId: 'ce1', label: 'Tables × débutées' },
                { id: 'c2', niveauId: 'ce2', label: 'Tables × maîtrisées' },
              ],
            },
            {
              id: 'division', label: 'division',
              criteres: [
                { id: 'c1', niveauId: 'ce2', label: 'Tables ÷ débutées' },
                { id: 'c2', niveauId: 'cm1', label: 'Tables ÷ maîtrisées' },
              ],
            },
          ],
        },
        {
          id: 'techniques-operatoires',
          label: 'Techniques opératoires (E. DALL\'AGNOL)',
          sousEpreuves: [
            {
              id: 'addition', label: 'addition posée',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Addition sans retenue' },
                { id: 'c2', niveauId: 'ce1', label: 'Addition avec retenue' },
              ],
            },
            {
              id: 'soustraction', label: 'soustraction posée',
              criteres: [
                { id: 'c1', niveauId: 'ce1', label: 'Soustraction sans retenue' },
                { id: 'c2', niveauId: 'ce2', label: 'Soustraction avec emprunt' },
              ],
            },
            {
              id: 'multiplication', label: 'multiplication posée',
              criteres: [
                { id: 'c1', niveauId: 'ce2', label: 'Multiplication 1 chiffre' },
                { id: 'c2', niveauId: 'cm1', label: 'Multiplication multi-chiffres' },
              ],
            },
            {
              id: 'division', label: 'division posée',
              criteres: [
                { id: 'c1', niveauId: 'ce2', label: 'Division sans reste' },
                { id: 'c2', niveauId: 'cm1', label: 'Division avec reste' },
                { id: 'c3', niveauId: 'cm2', label: 'Division et étapes' },
              ],
            },
          ],
        },
        {
          id: 'problemes',
          label: 'Problèmes',
          sousEpreuves: [
            {
              id: 'cartes', label: 'cartes (Riley-Greeno-Heller)',
              criteres: [
                { id: 'c1', niveauId: 'cp',  label: 'Cartes simples' },
                { id: 'c2', niveauId: 'ce1', label: 'Cartes intermédiaires' },
                { id: 'c3', niveauId: 'ce2', label: 'Cartes complexes' },
              ],
            },
            {
              id: 'schematises', label: 'schématisés (B-LM2)',
              criteres: [
                { id: 'c1', niveauId: 'ce1', label: 'Problèmes schématisés simples' },
                { id: 'c2', niveauId: 'ce2', label: 'Problèmes schématisés à 2 étapes' },
              ],
            },
            {
              id: 'enonces', label: 'énoncés classiques',
              criteres: [
                { id: 'c1', niveauId: 'ce1', label: 'Énoncés simples (addition)' },
                { id: 'c2', niveauId: 'ce2', label: 'Énoncés multi-opérations' },
                { id: 'c3', niveauId: 'cm1', label: 'Problèmes complexes' },
                { id: 'c4', niveauId: 'cm2', label: 'Division et étapes' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
