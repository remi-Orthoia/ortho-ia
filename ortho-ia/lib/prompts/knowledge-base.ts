/**
 * Knowledge base clinique — vérité diagnostique + style Laurie pour la rédaction
 * du CRBO. Source unique du contexte injecté dans le prompt système quand on
 * connaît le profil clinique de la passation (phase synthèse principalement).
 *
 * Structure :
 *   - profils_exalang / profils_examath : règles diagnostiques par profil
 *   - style_laurie : capture du style de rédaction validé (Laurie Berrio)
 *   - seuils : grille 6 zones officielle (étalonnage Happy Scribe)
 *   - marqueurs : indices cliniques transverses (compensation / alerte)
 *
 * Le contenu est destiné à être enrichi au fur et à mesure que Laurie /
 * d'autres orthos beta envoient des cas annotés. Voir KNOWLEDGE_BASE_TODO.md
 * pour la liste des zones à compléter.
 */

// ══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════

export const KNOWLEDGE_BASE = {

  // ══════════════════════════════════════
  // RÈGLES DIAGNOSTIQUES PAR PROFIL
  // ══════════════════════════════════════
  profils_exalang: {

    dyslexie_phonologique: {
      criteres: 'P≤10 lecture non-mots (voie d\'assemblage atteinte) + lecture mots dans la norme ou proche',
      severite: {
        legere: 'P10-16',
        moderee: 'P5-9',
        severe: 'P2-4',
        tres_severe: '<P2',
      },
      formulation_diagnostic:
        'trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [sévérité], à prédominance phonologique',
      points_forts_typiques: [
        'voie d\'adressage préservée',
        'compréhension orale fonctionnelle',
      ],
      observations_types:
        'Les erreurs portent principalement sur les mots nouveaux et pseudo-mots, avec un décodage lent et coûteux. La voie d\'adressage reste fonctionnelle pour les mots connus.',
    },

    dyslexie_adressage: {
      criteres: 'P≤10 lecture mots irréguliers + P≥25 lecture non-mots (voie d\'assemblage préservée)',
      severite: {
        legere: 'P10-16',
        moderee: 'P5-9',
        severe: 'P2-4',
        tres_severe: '<P2',
      },
      formulation_diagnostic:
        'trouble spécifique des apprentissages en langage écrit, forme [sévérité], touchant principalement la voie d\'adressage',
      points_forts_typiques: [
        'voie d\'assemblage / décodage phonologique préservé',
      ],
      observations_types:
        'Les erreurs portent sur les mots irréguliers avec régularisations caractéristiques. Le décodage phonologique est fonctionnel.',
    },

    dyslexie_mixte: {
      criteres: 'P≤10 lecture mots ET P≤10 lecture non-mots — les deux voies atteintes',
      severite: {
        legere: 'P10-16',
        moderee: 'P5-9',
        severe: 'P2-4',
        tres_severe: '<P2',
      },
      formulation_diagnostic:
        'trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [sévérité], touchant les deux voies de lecture',
      observations_types:
        'L\'ensemble du système de lecture est atteint, avec des difficultés tant sur les mots connus que sur les mots nouveaux.',
    },

    profil_normal: {
      criteres: 'Tous les scores ≥P25',
      formulation_diagnostic:
        'Le bilan ne met pas en évidence de trouble spécifique du langage écrit à ce jour.',
      observations_types:
        'L\'ensemble des compétences évaluées se situe dans la norme attendue pour l\'âge.',
    },

    tdl: {
      criteres:
        'Déficits en langage oral (compréhension + expression) + P≤10 sur plusieurs épreuves orales — sans déficit cognitif global ni cause sensorielle',
      severite: {
        legere: 'P10-16',
        moderee: 'P5-9',
        severe: 'P2-4',
        tres_severe: '<P2',
      },
      formulation_diagnostic:
        'trouble développemental du langage (TDL), de sévérité [légère / modérée / sévère]',
      observations_types:
        'Les difficultés portent sur plusieurs versants du langage oral (lexique, morphosyntaxe, phonologie), avec un retentissement marqué sur la communication quotidienne.',
    },

    dyslexie_compensee: {
      criteres:
        'Antécédents documentés de trouble du langage écrit + scores actuels remontés à P25-P50 mais lenteur de lecture marquée et coût attentionnel signalé',
      formulation_diagnostic:
        'trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme compensée',
      observations_types:
        'Les scores se sont normalisés en précision, mais la lecture reste lente et coûteuse. Les aménagements scolaires demeurent indiqués.',
    },
  },

  profils_examath: {

    dyscalculie_developpementale: {
      criteres:
        'P≤10 sur épreuves numériques fondamentales (dénombrement, subitizing, ligne numérique, comparaison de grandeurs)',
      severite: {
        legere: 'P10-16',
        moderee: 'P5-9',
        severe: 'P2-4',
        tres_severe: '<P2',
      },
      formulation_diagnostic:
        'trouble spécifique des apprentissages en mathématiques (communément appelé dyscalculie), de sévérité [légère / modérée / sévère]',
      observations_types:
        'Les compétences numériques fondamentales (sens du nombre, subitizing, ligne numérique mentale) sont atteintes, retentissant sur l\'ensemble des apprentissages mathématiques.',
    },

    difficultes_arithmetiques: {
      criteres:
        'Déficits en calcul et procédures (faits numériques, résolution de problèmes) sans atteinte des compétences numériques fondamentales',
      formulation_diagnostic:
        'difficultés arithmétiques significatives sans atteinte du sens du nombre',
      observations_types:
        'Le sens du nombre est préservé. Les difficultés portent sur la récupération des faits numériques, la mise en œuvre des procédures de calcul et la résolution de problèmes.',
    },

    anxiete_maths: {
      criteres:
        'Scores variables selon la pression temporelle ; performances nettement meilleures sans chronomètre ; évitement signalé en classe',
      formulation_diagnostic:
        'les résultats doivent être interprétés dans un contexte d\'anxiété mathématique',
      observations_types:
        'Les performances sont fortement modulées par la pression temporelle. Hors situation chronométrée, les compétences sous-jacentes apparaissent mieux préservées.',
    },
  },

  // ══════════════════════════════════════
  // STYLE LAURIE — capturé depuis ses CRBOs
  // ══════════════════════════════════════
  style_laurie: {

    formulations_types: [
      'obtient un score situé au centile X, traduisant une fragilité de…',
      'met en évidence une fragilité du traitement phonologique',
      'les résultats objectivent…',
      'de bons points d\'appui',
      'des autocorrections efficaces sont toutefois régulièrement observées, témoignant d\'un contrôle actif',
      'le score obtenu reste préservé dans l\'épreuve étalonnée',
      'cela peut majorer la fatigabilité',
      'mobilisent une part importante des ressources attentionnelles',
      'en situation scolaire, cela peut se traduire par…',
    ],

    // À utiliser DANS LES OBSERVATIONS / commentaires de domaine.
    // (Le mot "dyslexie" reste autorisé dans le champ diagnostic.)
    mots_a_eviter: [
      'dyslexie',
      'dysorthographie',
      'dyscalculie',
      'dysphasie',
      'rééducation',
      'suivi orthophonique',
      'séances',
      'il faudrait',
      'on recommande',
      'pathologique',
      'grave',
      'sévèrement atteint',
    ],

    structure_observations: {
      score_normal:
        '1 phrase courte — ex : « Excellent résultat en X au-dessus de la moyenne attendue pour l\'âge d\'Amaury. »',
      score_limite:
        '2 phrases — description + impact scolaire potentiel.',
      score_deficitaire:
        '3-4 phrases — description qualitative des erreurs + mécanisme explicatif + répercussion scolaire concrète.',
    },

    structure_projet_therapeutique:
      '2 phrases max — « Une prise en soin orthophonique est indiquée afin de [objectifs]. Des aménagements pédagogiques doivent être mis en place afin de limiter l\'impact de [difficultés] en situation scolaire. »',

    style_amenagements:
      'bullet points simples, verbe à l\'infinitif, 1 phrase par item, max 10 items.',

    conclusion:
      'Compte rendu remis en main propre à l\'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).',
  },

  // ══════════════════════════════════════
  // SEUILS CLINIQUES OFFICIELS (grille 6 zones — étalonnage Happy Scribe)
  // ══════════════════════════════════════
  seuils: {
    excellent: { min: 76, label: 'Excellent' },
    moyenne_haute: { min: 51, max: 75, label: 'Moyenne haute' },
    moyenne_basse: { min: 26, max: 50, label: 'Moyenne basse' },
    fragile: { min: 10, max: 25, label: 'Fragilité' },
    deficitaire: { min: 6, max: 9, label: 'Difficulté' },
    tres_deficitaire: { max: 5, label: 'Difficulté sévère', couleur: '#7A1F1F' },
  },

  // ══════════════════════════════════════
  // MARQUEURS CLINIQUES TRANSVERSES
  // ══════════════════════════════════════
  marqueurs: {
    bonne_compensation: [
      'autocorrections efficaces',
      'score préservé mais temps déficitaire',
      'lecture hachée mais compréhension maintenue',
      'stratégie d\'évitement compensatrice (relecture, vérification)',
    ],
    signaux_alerte: [
      'P<2 sur plusieurs épreuves d\'un même domaine',
      'dissociation score/temps marquée',
      'déficits croisés oral + écrit',
      'régression par rapport à un bilan antérieur',
      'fatigabilité majeure signalée par la famille / l\'école',
    ],
  },
} as const

// ══════════════════════════════════════════════════════════════════════════
// PROFILE DETECTION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Famille de tests reconnue. Permet de choisir le set de profils
 * (profils_exalang vs profils_examath) à essayer en priorité.
 */
type TestFamily = 'exalang' | 'examath' | 'autre'

function detectFamily(testType: string): TestFamily {
  const t = testType.toLowerCase()
  if (t.includes('exalang') || t.includes('evaleo') || t.includes('bale') || t.includes('belec') || t.includes('bilo') || t.includes('n-eel') || t.includes('evalo') || t.includes('elo')) {
    return 'exalang'
  }
  if (t.includes('examath')) return 'examath'
  return 'autre'
}

/**
 * Cherche dans le map de scores la valeur dont la clé contient AU MOINS UN
 * des mots-clés (case-insensitive, sans accents). Renvoie le percentile_value
 * trouvé ou null. La recherche est tolérante aux variations de libellés.
 */
function findScore(scores: Record<string, number>, keywords: string[]): number | null {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const normKeywords = keywords.map(norm)
  for (const key of Object.keys(scores)) {
    const n = norm(key)
    if (normKeywords.some((kw) => n.includes(kw))) {
      const v = scores[key]
      if (typeof v === 'number' && !isNaN(v)) return v
    }
  }
  return null
}

/**
 * Cherche les scores typiques langage écrit utiles à la détection de profil
 * dyslexique : lecture de mots, lecture de mots irréguliers, lecture de
 * non-mots, et toutes les épreuves de langage écrit pour détecter la sévérité.
 */
function extractEcritScores(scores: Record<string, number>) {
  // Lecture non-mots : voie d'assemblage. Clés typiques :
  // "Lecture de non-mots", "Logatomes écrits", "Pseudo-mots".
  const nonMots = findScore(scores, ['non-mot', 'non mot', 'logatome', 'pseudo-mot', 'pseudo mot'])

  // Lecture mots irréguliers : voie d'adressage.
  const motsIrreguliers = findScore(scores, ['mot irreg', 'irreg'])

  // Lecture mots (génériques, hors irréguliers et non-mots).
  // Pour éviter de re-matcher non-mots / irréguliers, on filtre côté clé.
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  let motsCourants: number | null = null
  for (const key of Object.keys(scores)) {
    const n = norm(key)
    if (
      n.includes('lecture') &&
      n.includes('mot') &&
      !n.includes('non-mot') && !n.includes('non mot') &&
      !n.includes('logatome') &&
      !n.includes('pseudo') &&
      !n.includes('irreg')
    ) {
      motsCourants = scores[key]
      break
    }
  }

  return { nonMots, motsIrreguliers, motsCourants }
}

/**
 * Détermine la sévérité textuelle (légère / modérée / sévère / très sévère)
 * à partir du percentile le plus faible parmi les voies atteintes.
 */
function severiteFromPercentile(p: number): 'légère' | 'modérée' | 'sévère' | 'très sévère' {
  if (p < 2) return 'très sévère'
  if (p < 5) return 'sévère'
  if (p < 10) return 'modérée'
  return 'légère'
}

/**
 * Score global de fragilité : nombre d'épreuves en zone fragile/difficulté/
 * difficulté sévère sur l'ensemble du bilan. Utile pour signaler un profil
 * massif vs ciblé.
 */
function countAtteintes(scores: Record<string, number>): { fragiles: number; deficitaires: number; total: number } {
  let fragiles = 0
  let deficitaires = 0
  const total = Object.keys(scores).length
  for (const v of Object.values(scores)) {
    if (typeof v !== 'number' || isNaN(v)) continue
    if (v <= 9) deficitaires++
    else if (v <= 25) fragiles++
  }
  return { fragiles, deficitaires, total }
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════════════════

/**
 * Construit un bloc de contexte clinique markdown à injecter dans le prompt
 * système. Pour chaque appel :
 *   1. Détecte la famille du test (exalang / examath / autre)
 *   2. Détecte le profil clinique probable depuis les scores (si fournis)
 *   3. Formate le profil retenu + le style Laurie + les seuils en markdown
 *
 * Si `scores` est vide ou non concluant → renvoie quand même le bloc style
 * Laurie + seuils + marqueurs (utile dès la phase d'extraction).
 *
 * @param testType  Nom du test principal (ex: 'Exalang 8-11', 'Examath')
 * @param scores    Record<epreuve, percentile_value (0-100)> — peut être vide
 */
export function getKnowledgeForTest(
  testType: string,
  scores: Record<string, number> = {},
): string {
  const family = detectFamily(testType)
  const hasScores = Object.keys(scores).length > 0

  // ─── Détection de profil ─────────────────────────────────────────────
  let profilBlock = ''
  if (hasScores) {
    if (family === 'exalang') {
      const { nonMots, motsIrreguliers, motsCourants } = extractEcritScores(scores)
      const allEcritNormaux =
        (nonMots === null || nonMots >= 25) &&
        (motsIrreguliers === null || motsIrreguliers >= 25) &&
        (motsCourants === null || motsCourants >= 25)
      const nonMotsAtteint = nonMots !== null && nonMots <= 10
      const motsCourantsAtteint = motsCourants !== null && motsCourants <= 10
      const motsIrregAtteint = motsIrreguliers !== null && motsIrreguliers <= 10

      // Profil mixte > phonologique > adressage > normal
      if (nonMotsAtteint && (motsCourantsAtteint || motsIrregAtteint)) {
        const pMin = Math.min(
          nonMots,
          motsCourantsAtteint ? motsCourants! : 100,
          motsIrregAtteint ? motsIrreguliers! : 100,
        )
        profilBlock = formatProfil(
          'Dyslexie mixte (voies d\'assemblage ET d\'adressage atteintes)',
          KNOWLEDGE_BASE.profils_exalang.dyslexie_mixte,
          severiteFromPercentile(pMin),
        )
      } else if (nonMotsAtteint && !motsIrregAtteint) {
        profilBlock = formatProfil(
          'Dyslexie phonologique (voie d\'assemblage atteinte, voie d\'adressage préservée)',
          KNOWLEDGE_BASE.profils_exalang.dyslexie_phonologique,
          severiteFromPercentile(nonMots!),
        )
      } else if (motsIrregAtteint && !nonMotsAtteint) {
        profilBlock = formatProfil(
          'Dyslexie de surface (voie d\'adressage atteinte, voie d\'assemblage préservée)',
          KNOWLEDGE_BASE.profils_exalang.dyslexie_adressage,
          severiteFromPercentile(motsIrreguliers!),
        )
      } else if (allEcritNormaux && Object.keys(scores).length >= 4) {
        // Pas d'atteinte écrit ET au moins 4 épreuves testées → profil normal sur le langage écrit.
        // (On exige ≥4 épreuves pour éviter de conclure "normal" sur un bilan partiel.)
        profilBlock = formatProfil(
          'Profil dans la norme (langage écrit)',
          KNOWLEDGE_BASE.profils_exalang.profil_normal,
          null,
        )
      }
    } else if (family === 'examath') {
      // Détection sens-du-nombre vs procédural.
      const sensNombre = findScore(scores, ['denombrement', 'dénombrement', 'subitizing', 'ligne numerique', 'ligne numérique', 'comparaison'])
      const sensAtteint = sensNombre !== null && sensNombre <= 10
      if (sensAtteint) {
        profilBlock = formatProfil(
          'Dyscalculie développementale (sens du nombre atteint)',
          KNOWLEDGE_BASE.profils_examath.dyscalculie_developpementale,
          severiteFromPercentile(sensNombre!),
        )
      } else {
        const calcul = findScore(scores, ['calcul', 'faits numeriques', 'faits numériques', 'procedure', 'procédure', 'probleme', 'problème'])
        if (calcul !== null && calcul <= 10) {
          profilBlock = formatProfil(
            'Difficultés arithmétiques sans atteinte du sens du nombre',
            KNOWLEDGE_BASE.profils_examath.difficultes_arithmetiques,
            null,
          )
        }
      }
    }
  }

  // ─── Marqueurs transverses (alerte / compensation) ───────────────────
  const { fragiles, deficitaires, total } = countAtteintes(scores)
  const marqueursBlock = hasScores
    ? `### Charge clinique observée\n- ${deficitaires} épreuve(s) en zone Difficulté ou pire (sur ${total}).\n- ${fragiles} épreuve(s) en zone Fragilité.\n${
        deficitaires >= 4
          ? '⚠️ Charge déficitaire élevée : profil massif, viser une formulation diagnostique plus marquée et soigner la sévérité.'
          : ''
      }`
    : ''

  // ─── Style Laurie (toujours injecté) ─────────────────────────────────
  const styleBlock = formatStyleLaurie()

  // ─── Compose le bloc final ───────────────────────────────────────────
  const parts = [
    '## CONTEXTE CLINIQUE SPÉCIFIQUE À CE BILAN',
    profilBlock || '_(Pas de profil clinique inféré automatiquement à partir des scores fournis. Suivre les règles diagnostiques générales.)_',
    marqueursBlock,
    '',
    '## STYLE DE RÉDACTION ATTENDU (calibré sur les CRBOs de Laurie Berrio)',
    styleBlock,
  ].filter(Boolean)

  return parts.join('\n\n')
}

// ── Formatters ────────────────────────────────────────────────────────────

function formatProfil(
  titre: string,
  profil: {
    criteres: string
    formulation_diagnostic: string
    observations_types?: string
    points_forts_typiques?: readonly string[]
  },
  severite: 'légère' | 'modérée' | 'sévère' | 'très sévère' | null,
): string {
  const formulation = severite
    ? profil.formulation_diagnostic.replace('[sévérité]', severite)
    : profil.formulation_diagnostic
  const lines = [
    `### Profil clinique probable : ${titre}`,
    `**Critères diagnostiques** : ${profil.criteres}`,
    `**Formulation diagnostique à utiliser** : « ${formulation} »`,
  ]
  if (profil.observations_types) {
    lines.push(`**Observations types (à reformuler, pas à copier)** : ${profil.observations_types}`)
  }
  if (profil.points_forts_typiques && profil.points_forts_typiques.length > 0) {
    lines.push(`**Points forts typiques de ce profil** : ${profil.points_forts_typiques.join(' ; ')}.`)
  }
  return lines.join('\n')
}

function formatStyleLaurie(): string {
  const s = KNOWLEDGE_BASE.style_laurie
  return [
    '### Formulations types à privilégier',
    s.formulations_types.map((f) => `  - « ${f} »`).join('\n'),
    '',
    '### Mots à éviter (dans les observations de domaine — réservés au diagnostic / recommandations)',
    s.mots_a_eviter.map((m) => `  - « ${m} »`).join('\n'),
    '',
    '### Longueur des observations selon la performance',
    `  - Score normal : ${s.structure_observations.score_normal}`,
    `  - Score limite : ${s.structure_observations.score_limite}`,
    `  - Score déficitaire : ${s.structure_observations.score_deficitaire}`,
    '',
    '### Projet thérapeutique (recommandations en format synthétique)',
    `  ${s.structure_projet_therapeutique}`,
    '',
    '### Aménagements scolaires',
    `  ${s.style_amenagements}`,
  ].join('\n')
}

// ══════════════════════════════════════════════════════════════════════════
// HELPERS POUR LE PIPELINE (extraction des scores depuis la structure CRBO)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Convertit la structure habituelle `domains[].epreuves[]` (issue de la phase
 * d'extraction) en un map plat `{ "nom épreuve": percentile_value }`. Pratique
 * pour appeler `getKnowledgeForTest` depuis la route en phase synthèse.
 *
 * Tolérant aux variations de structure : ignore les épreuves sans
 * percentile_value numérique.
 */
export function scoresFromDomains(
  domains: Array<{
    nom?: string
    epreuves?: Array<{ nom?: string; percentile_value?: number | null }>
  }> | null | undefined,
): Record<string, number> {
  const result: Record<string, number> = {}
  if (!Array.isArray(domains)) return result
  for (const d of domains) {
    if (!Array.isArray(d?.epreuves)) continue
    for (const e of d.epreuves) {
      if (typeof e?.nom !== 'string') continue
      if (typeof e?.percentile_value !== 'number' || isNaN(e.percentile_value)) continue
      result[e.nom] = e.percentile_value
    }
  }
  return result
}
