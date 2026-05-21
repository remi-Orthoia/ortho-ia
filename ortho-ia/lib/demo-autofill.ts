'use client'

/**
 * Auto-remplissage des formulaires de bilan pour le compte démo.
 *
 * Cible : `demo@ortho-ia.fr` (Sophie DEMO). Permet à Rémi de tester la
 * génération de CRBO sur chaque type de bilan en quelques secondes, sans
 * ressaisir patient + anamnèse + cotations.
 *
 * Le bouton DemoAutofillButton est conditionné à l'email de l'utilisateur
 * connecté — invisible pour tous les autres comptes.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type {
  BilanMathDraft,
  EpreuveState,
  GrilleBilan,
  PastilleEtat,
} from '@/lib/bilans/math/types'

export const DEMO_EMAIL = 'demo@ortho-ia.fr'

/** Hook : `true` si l'utilisateur connecté est le compte démo. Auth Supabase
 *  cliente. Première résolution asynchrone (le bouton apparaît ~150ms après
 *  le montage). */
export function useIsDemoUser(): boolean {
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      const email = (user?.email ?? '').toLowerCase().trim()
      setIsDemo(email === DEMO_EMAIL)
    }).catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [])
  return isDemo
}

// ============================================================================
// Patients démo (réalistes mais fictifs — anonymisation interne)
// ============================================================================

export const DEMO_PATIENTS = {
  bcm: {
    prenom: 'Lucas',
    nom: 'DUPONT',
    date_naissance: '2018-04-12',
    classe: 'CE1',
  },
  bcmado: {
    prenom: 'Monica',
    nom: 'LEFEVRE',
    date_naissance: '2013-09-23',
    classe: '5ème',
  },
  langage: {
    prenom: 'Léa',
    nom: 'MARTIN',
    date_naissance: '2015-06-08',
    classe: 'CM2',
  },
} as const

export const DEMO_MOTIF_BCMADO =
  "Monica est adressée pour bilan de cognition mathématique suite à des difficultés importantes signalées en mathématiques par l'équipe pédagogique et la famille. Un trouble spécifique des apprentissages du langage écrit a déjà été diagnostiqué. L'objectif est de déterminer si les difficultés rencontrées sont spécifiques d'un trouble d'apprentissage des mathématiques."

export const DEMO_ANAMNESE_BCMADO =
  "Monica a une grande sœur et une jumelle. Le développement psychomoteur n'a pas posé de problème particulier. Les parents sont séparés, Monica voit son père une à deux fois par mois. Elle est décrite comme une petite fille sensible, têtue et dominatrice. ORL : ablation des végétations. Visuel : verres correcteurs. Rééducations antérieures : 2 ans d'orthophonie pour le langage écrit, orthoptie, aide personnalisée à l'école."

export const DEMO_MOTIF_BCM =
  "Lucas est adressé pour bilan de cognition mathématique devant des difficultés importantes en calcul mental, en numération et en résolution de problèmes signalées par l'enseignante de CE1. L'objectif est de préciser le profil cognitif et de poser une indication de prise en charge si nécessaire."

export const DEMO_ANAMNESE_BCM =
  "Lucas est le cadet d'une fratrie de deux. Grossesse et accouchement sans particularité. Développement psychomoteur dans les normes. Pas d'antécédent ORL notable, pas de port de lunettes. Lucas est suivi en psychomotricité depuis 6 mois pour difficultés grapho-motrices. La famille décrit un enfant attachant, parfois lent, qui se décourage rapidement face aux exercices de mathématiques."

export const DEMO_NOTES_PAR_DOMAINE: Record<string, string> = {
  // Section Logique
  classifications:
    "Sur le matériel concret proposé, l'enfant dégage spontanément les trois critères de classement en se justifiant. C'est le niveau attendu pour l'âge.",
  combinatoire:
    "Sur l'exercice de dessin de jetons combinant formes et couleurs, l'enfant propose un appariement simple. Pas de stratégie systématique.",
  seriation:
    "Le rangement des baguettes est réussi, l'enfant les place spontanément horizontalement. Le questionnaire est réussi sur les 5 premières questions ; la question « impossible » est échouée.",
  inclusion:
    "L'enfant propose une production à deux niveaux mais incomplète : il manque une classe complémentaire dans l'exercice à 2 niveaux (tulipes rouges → tulipes → fleurs).",
  conservation:
    "Conservation des quantités discontinues : utilisation opérationnelle de la mise en terme à terme. Mais lorsqu'une collection est regroupée, l'enfant ne conserve plus. Conservation des longueurs : non conservée dès qu'on déplace les baguettes en T.",
  // Section Numérique
  'chaine-numerique':
    "Chaîne numérique encore en élaboration : sécable mais ni dénombrable ni bi-directionnelle. Les séquences de 0 à 20 ne sont pas automatisées en arrière. Difficulté à changer de direction rapidement.",
  denombrement:
    "Les principes de Gelman sont en place. L'enfant utilise le pointage visuel sur les petites constellations mais se trompe sur 24 jetons disséminés. Sur ma demande, procède au pointage digital et réussit.",
  numerosite:
    "Estimer le nombre sans compter : 8/9. Subitizing : 3 points OK, 4 points 2/4. Comparaison de constellations : petites 9/12, grandes 11/12. Échelles marquées 8/12, non marquées 2,5/12.",
  numeration:
    "L'enfant connaît les termes unité et dizaine et leur position. Mais aucun lien entre matériel et codage : équivalence numérique non comprise, base 10 non maîtrisée. Donne 1 jeton pour symboliser une unité et 1 jeton pour une dizaine en disant « c'est pareil ».",
  transcodage:
    "Lecture réussie jusqu'aux nombres à 3 chiffres. Dictée réussie jusqu'aux nombres à 2 chiffres.",
  'sens-operations':
    "Après étayage et avec l'aide d'une histoire, l'enfant peut expliquer le sens et manipuler l'addition. Soustraction, multiplication et division non maîtrisées.",
  'faits-numeriques':
    "Fluence arithmétique : 23/120, score très inférieur à la norme attendue pour l'âge.",
  'techniques-operatoires': 'Non proposées.',
  problemes: 'Non proposés en raison de la fatigabilité et des résultats des épreuves préalables.',
}

// ============================================================================
// Génération déterministe d'un epreuves state coloré pour la démo
// ============================================================================

/** Mapping d'une couleur démo selon l'index du critère et l'index du niveau.
 *  Donne une grille variée mais reproductible : Vert / Orange / Rouge selon
 *  hash, avec une chance résiduelle de garder gris. */
function demoColorFor(seed: number): PastilleEtat {
  const m = seed % 7
  if (m === 0 || m === 1) return 'vert'
  if (m === 2) return 'gris'
  if (m === 3 || m === 4) return 'orange'
  return 'rouge'
}

/** Construit un draft.epreuves démo : pour chaque épreuve, on remplit
 *  - cells: chaque (sousEpreuve × critère) → une couleur démo
 *  - notes: note préfabriquée si on connaît l'épreuve, sinon vide
 *  - iaText: laissé vide (l'IA générera depuis notes + cells au moment du
 *    "Générer le CRBO"). */
function buildDemoEpreuves(grille: GrilleBilan): Record<string, EpreuveState> {
  const out: Record<string, EpreuveState> = {}
  let seed = 0
  for (const section of grille.sections) {
    for (const ep of section.epreuves) {
      const cells: Record<string, PastilleEtat> = {}
      for (const se of ep.sousEpreuves) {
        for (const cr of se.criteres) {
          cells[`${se.id}:${cr.id}`] = demoColorFor(seed++)
        }
      }
      out[ep.id] = {
        cells,
        notes: DEMO_NOTES_PAR_DOMAINE[ep.id] ?? '',
        iaText: '',
      }
    }
  }
  return out
}

/** Renvoie un BilanMathDraft prêt à servir pour la démo, en fonction de la
 *  grille (B-CM ou B-CMado). */
export function buildDemoMathDraft(grille: GrilleBilan): BilanMathDraft {
  const isAdo = grille.id === 'b-cmado'
  const patient = isAdo ? DEMO_PATIENTS.bcmado : DEMO_PATIENTS.bcm
  return {
    type: grille.id,
    mode: 'initial',
    patient: {
      prenom: patient.prenom,
      nom: patient.nom,
      date_naissance: patient.date_naissance,
      classe: patient.classe,
    },
    motif: isAdo ? DEMO_MOTIF_BCMADO : DEMO_MOTIF_BCM,
    anamnese: isAdo ? DEMO_ANAMNESE_BCMADO : DEMO_ANAMNESE_BCM,
    epreuves: buildDemoEpreuves(grille),
    updatedAt: Date.now(),
  }
}

// ============================================================================
// Fixtures Nouveau CRBO (langage)
// ============================================================================

/** Données à fusionner dans formData de /dashboard/nouveau-crbo pour pré-remplir
 *  patient + motif + anamnèse + 1 test sélectionné (BETL CM2 par défaut). Les
 *  scores chiffrés du test ne sont pas pré-remplis (formulaires spécifiques :
 *  cohérence requise par test). L'ortho remplit ensuite le sous-formulaire ou
 *  passe par resultats_manuels. */
export const DEMO_LANGAGE_FIXTURE = {
  patient_prenom: DEMO_PATIENTS.langage.prenom,
  patient_nom: DEMO_PATIENTS.langage.nom,
  patient_ddn: DEMO_PATIENTS.langage.date_naissance,
  patient_classe: DEMO_PATIENTS.langage.classe,
  motif:
    "Léa est adressée pour bilan orthophonique devant des difficultés en lecture (déchiffrage lent, peu fluent) et en orthographe. Plaintes scolaires depuis le CE1. L'objectif est de qualifier la nature et la sévérité des difficultés et de poser une indication de prise en charge.",
  anamnese:
    "Léa est la cadette d'une fratrie de deux. Grossesse et accouchement sans particularité. Marche acquise à 13 mois, premiers mots à 14 mois, phrases vers 2 ans. Pas d'antécédent ORL notable, pas de port de lunettes. Pas de rééducation antérieure. La famille décrit une enfant volontaire, attentive en classe, parfois lente dans son travail. L'enseignante note un déchiffrage laborieux et beaucoup d'erreurs orthographiques.",
  comportement_seance:
    "Léa s'est montrée coopérative tout au long du bilan. Bonne attention, persévérance face aux épreuves les plus difficiles. Demande des explications quand une consigne lui échappe.",
  test_utilise: ['EVALEO 6-15'] as string[],
  // Résultats fictifs cohérents EVALEO 6-15 niveau CM2 (mixte fragile +
  // moyen). Permet au bouton "Visualiser les résultats" de s'activer
  // directement après l'auto-fill, sans saisie manuelle. Format libre
  // accepté par la phase 1 d'extraction.
  resultats_manuels: [
    '=== EVALEO 6-15 ===',
    '',
    'LANGAGE ÉCRIT',
    'Lecture de mots (Régulier) : 25/40, É-T -1.6, Classe 2 (faible)',
    'Lecture de mots (Irrégulier) : 18/40, É-T -1.8, Classe 2 (faible)',
    'Lecture de pseudomots : 14/40, É-T -2.1, Classe 1 (très faible)',
    'Compréhension écrite : 7/12, É-T -0.6, Classe 4 (moyen)',
    'Dictée de mots : 22/40, É-T -1.5, Classe 2 (faible)',
    'Dictée de phrases : 9/30, É-T -2.0, Classe 1 (très faible)',
    'Production écrite (idées) : 5/10, É-T -0.4, Classe 4 (moyen)',
    'Production écrite (orthographe) : 3/10, É-T -1.7, Classe 2 (faible)',
    '',
    'LANGAGE ORAL',
    'Compréhension orale : 8/10, É-T -0.2, Classe 5 (moyen)',
    'Vocabulaire : 22/30, É-T -0.5, Classe 4 (moyen)',
    'Conscience phonologique : 12/20, É-T -1.4, Classe 2 (faible)',
    '',
    'COMPÉTENCES TRANSVERSES',
    'Mémoire de travail (empan endroit) : 4 items, É-T -1.0, Classe 3',
    'Empan envers : 3 items, É-T -1.2, Classe 3',
    'Fluence visuo-attentionnelle : 18 items/2 min, É-T -1.3, Classe 2',
  ].join('\n'),
  bilan_type: 'initial' as const,
  format_crbo: 'synthetique' as const,
}
