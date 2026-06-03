/**
 * BILAN_REGISTRY — index master de tous les bilans supportés par ortho.ia.
 *
 * Source unique de vérité pour :
 *   - lister les bilans disponibles (UI : groupements famille, sélection)
 *   - savoir si un bilan a un formulaire structuré ou se contente d'un textarea
 *   - mapper bilan → composant form (chemin) + module prompt (chemin)
 *   - savoir quel schéma de scoring le bilan produit (percentile / MoCA /
 *     pastille qualitative / texte libre)
 *   - choisir le renderer Word approprié (standard / MoCA-dédié / math-dédié)
 *   - choisir la route API de génération (par défaut /api/generate-crbo,
 *     sauf math qui passe par /api/generate-bilan-math)
 *
 * RÈGLE D'ISOLATION (cf. CLAUDE.md) :
 *   Toute modification spécifique à UN bilan doit toucher UNIQUEMENT :
 *     - components/forms/<Nom>ScoresInput.tsx (le form)
 *     - lib/prompts/tests/<nom>.ts (le module prompt)
 *     - lib/bilan-registry.ts (l'entrée correspondante, pour ajouter des
 *       métadonnées)
 *   NE JAMAIS modifier components/, lib/prompts/system-base.ts,
 *   lib/prompts/tool-schema.ts, lib/word-export.ts ou lib/prompts/extraction.ts
 *   pour résoudre un cas particulier d'un bilan unique.
 *
 * HOT SPOTS HÉRITÉS (audit 2026-05-22, à refactorer plus tard) :
 *   1. lib/prompts/tool-schema.ts force le format percentile à TOUS les
 *      bilans (MoCA et B-CM contournent en mettant percentile=""). À
 *      splitter en tool-schema-percentile / tool-schema-moca / tool-schema-math.
 *   2. lib/prompts/system-base.ts contient des règles spécifiques langage
 *      écrit (dyslexie, ordonnancement A/B/C Exalang, classement RAN…)
 *      imposées à tous. À extraire dans lib/prompts/rules/<nom>.ts que
 *      chaque module test inclut explicitement.
 *   3. lib/word-export.ts a 23 occurrences `isMocaOnly` hardcodées. À
 *      sortir vers lib/word/renderers/moca.ts sur le pattern de
 *      lib/bilan-math-word-export.ts.
 *   Le registry ci-dessous expose le champ `wordRenderer` pour permettre
 *   cette migration sans changer la signature.
 */

/** Famille clinique du bilan, utilisée pour les groupements UI (accordéons
 *  par famille dans la grille de sélection des tests). */
export type BilanFamille =
  | 'langage_oral'
  | 'langage_ecrit'
  | 'langage_oral_ecrit'
  | 'math'
  | 'adulte'
  | 'screening'
  | 'transverse'

/** Schéma de cotation produit par le bilan. Pilote le rendu UI, le schéma
 *  JSON Claude et le renderer Word. */
export type ScoreSchema =
  /** Score brut + écart-type + percentile (Exalang, EVALEO, Examath, BETL, BIA, etc.). */
  | 'percentile'
  /** Score brut /max (MoCA = /30 par épreuve + total /30 corrigé). */
  | 'moca'
  /** Cotation qualitative par pastille (B-CM, B-CMado — matrice 2D). */
  | 'pastille'
  /** Saisie texte libre uniquement, pas de scoring structuré (ELO, BALE,
   *  N-EEL, BILO, BELEC, OMF…). */
  | 'free_text'

/** Renderer Word à utiliser. Le standard rend le tableau percentile 5
 *  colonnes (Épreuve/Score/É-T/Centile/Interprétation). Les autres ont
 *  un rendu spécifique. */
export type WordRenderer = 'standard' | 'moca' | 'math'

/** Route API de génération de CRBO pour ce bilan. Si non spécifié, on
 *  utilise /api/generate-crbo (phase 1 extract + phase 2 synthesize SSE). */
export type GenerateRoute = '/api/generate-crbo' | '/api/generate-bilan-math'

/** Props minimales attendues par tout composant FormSaisie. Chaque form
 *  peut accepter des props supplémentaires propres au test mais ces 4 sont
 *  garanties (passées par nouveau-crbo/page.tsx). */
export interface SharedFormProps {
  /** Texte des notes ortho propres au test (champ `comportement_seance`
   *  ou équivalent). */
  notes: string
  onNotesChange: (notes: string) => void
  /** Callback pour pousser le bloc texte des résultats structurés dans
   *  `formData.resultats_manuels` (séparateur "=== <Test> ===" géré par
   *  le form). */
  onResultatsChange: (resultats: string) => void
  /** Remontée d'erreur vers le toast parent. */
  onError: (msg: string) => void
}

export interface BilanEntry {
  /** Nom canonique, doit matcher TESTS_OPTIONS / TESTS_SCREENING_OPTIONS
   *  dans lib/types.ts et la clé `test_utilise` envoyée au backend. */
  nom: string
  /** Libellé court pour affichage UI ; nom complet du test. */
  label?: string
  /** Famille clinique pour groupement UI. */
  famille: BilanFamille
  /** Tranche d'âge cible (informatif, pour aide à la sélection). */
  ageRange?: string
  /** Chemin RELATIF du composant FormSaisie spécifique au bilan, depuis
   *  la racine repo. `null` = pas de formulaire dédié, l'ortho saisit en
   *  texte libre dans le champ `resultats_manuels` générique.
   *  NB : on stocke un chemin string plutôt qu'un import direct pour ne
   *  pas casser le tree-shaking et ne pas créer de dépendance circulaire
   *  registry → form (un form n'a pas à savoir qu'il est dans le registry). */
  formPath: string | null
  /** Chemin RELATIF du module prompt spécifique au bilan. */
  promptPath: string
  /** Schéma de scoring produit. */
  scoreSchema: ScoreSchema
  /** Renderer Word à utiliser. */
  wordRenderer: WordRenderer
  /** Route API de génération. */
  generateRoute: GenerateRoute
  /** Bilan de screening (rapide, indicatif, pas de diagnostic frontal) ?
   *  Affiché dans la section "Screening préalable" du form. */
  isScreening?: boolean
  /** Bilan désactivé temporairement (présent en code mais pas proposé à
   *  la sélection). Utilisé pour Exalang 5-8 (form retiré 2026-05-21). */
  hiddenInUI?: boolean
  /** Bilan verrouillé pendant la beta (visible en UI, non sélectionnable,
   *  affiché grisé avec badge "Bientôt"). On le débloque au fur et à mesure
   *  que la qualité des CRBO générés est validée sur ce bilan.
   *  Validés au 2026-06-03 : Exalang (toutes versions), EVALEO 6-15, B-CMado, PREDIMEM, PrediFex. */
  betaDisabled?: boolean
  /** Si true, le rendu Word PRÉSERVE l'ordre des `domains[]` produits par le
   *  LLM au lieu d'appliquer le re-tri défensif par famille
   *  (oral → écrit → sous-jacent) de `sortDomainsByFamily()`. Pertinent pour
   *  EVALEO 6-15 dont l'ordre standard officiel est : Lecture identification
   *  → Lecture compréhension → Écriture → Production orthographe → Récit
   *  écrit → Inhibition/Visuo-attentionnel → Mémoire CT verbale →
   *  Morphosyntaxe orale → Phonologie/Métaphonologie → Lexique →
   *  Récit oral → Pragmatique → Gnosies/Praxies/Raisonnement
   *  (mix langage écrit en premier, sous-jacents au milieu, langage oral à
   *  la fin — incompatible avec le tri défensif générique). */
  preserveDomainOrder?: boolean
  /** Type de légende des scores à rendre dans le Word avant le bloc BILAN.
   *  - 'standard' (défaut) : 6 zones Laurie (Excellent / Moyenne haute / ...
   *    / Difficulté sévère) — palette Exalang générique.
   *  - 'evaleo' : grille officielle EVALEO 6-15 en 7 classes avec libellé
   *    "Normalité" englobant les classes 3-4-5, palette rouge/orange/verts/
   *    bleus + texte intro Launay et al. + résumé des 7 classes en dessous.
   *  Le drapeau pilote `buildLegendBlock()` de lib/word-export.ts. */
  legendType?: 'standard' | 'evaleo'
  /** Si true, le tableau d'épreuves rendu dans le Word n'inclut PAS la
   *  colonne "É-T" (écart-type). EVALEO 6-15 ne présente pas l'écart-type
   *  dans les CRBO de référence (Justine Peyre, Anne Frouard) — l'analyse
   *  est portée par la classe sept-classes et le centile. La colonne devient
   *  4 colonnes (Épreuve / Score / Centile / Interprétation) au lieu de 5,
   *  avec redistribution des largeurs. Piloté par lib/word-export.ts. */
  hideEcartTypeColumn?: boolean
  /** Si true, le rendu Word SAUTE le paragraphe `domain.commentaire` rendu
   *  entre le tableau d'épreuves et les commentaires par épreuve. EVALEO ne
   *  doit PAS l'afficher (retour Justine Peyre, Anne Frouard) : le commentaire
   *  de domaine produit une REDITE avec les commentaires par épreuve qui
   *  suivent (typiquement la même observation reformulée). Le prompt EVALEO
   *  instruit l'IA de retourner `commentaire = ""`, mais cette garde côté
   *  renderer protège contre les ratés de l'IA (notamment renouvellement où
   *  le LLM tend à re-rédiger une synthèse de domaine). Piloté par
   *  lib/word-export.ts. */
  hideDomainCommentaire?: boolean
}

// ============================================================================
// Entrées : 1 par bilan supporté
// ============================================================================
//
// Quand tu ajoutes un nouveau bilan :
//   1. Crée components/forms/<Nom>ScoresInput.tsx (ou bilans/<nom>/Form.tsx)
//   2. Crée lib/prompts/tests/<nom>.ts
//   3. Ajoute une entrée ici
//   4. (si scoring custom) ajoute lib/word/renderers/<nom>.ts ou route API dédiée
//   AUCUNE autre modification ne devrait être nécessaire.

export const BILAN_REGISTRY: Record<string, BilanEntry> = {
  // ===== Screening =====
  'MoCA': {
    nom: 'MoCA',
    betaDisabled: true,
    label: 'MoCA — Montreal Cognitive Assessment',
    famille: 'screening',
    ageRange: 'adulte / senior',
    formPath: 'components/forms/MocaScoresInput.tsx',
    promptPath: 'lib/prompts/tests/moca.ts',
    scoreSchema: 'moca',
    wordRenderer: 'moca',
    generateRoute: '/api/generate-crbo',
    isScreening: true,
  },

  // ===== Adulte / Aphasie / Gériatrie =====
  'BETL': {
    nom: 'BETL',
    betaDisabled: true,
    label: 'BETL — Bilan Évaluation Trouble Lexical',
    famille: 'adulte',
    ageRange: 'adulte',
    formPath: 'components/forms/BetlScoresInput.tsx',
    promptPath: 'lib/prompts/tests/betl.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'PREDIMEM': {
    nom: 'PREDIMEM',
    famille: 'adulte',
    formPath: 'components/forms/PredimemScoresInput.tsx',
    promptPath: 'lib/prompts/tests/predimem.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'PrediFex': {
    nom: 'PrediFex',
    famille: 'adulte',
    formPath: 'components/forms/PrediFexScoresInput.tsx',
    promptPath: 'lib/prompts/tests/predifex.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'PrediLac': {
    nom: 'PrediLac',
    betaDisabled: true,
    famille: 'adulte',
    formPath: 'components/forms/PrediLacScoresInput.tsx',
    promptPath: 'lib/prompts/tests/predilac.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'BECD': {
    nom: 'BECD',
    betaDisabled: true,
    label: 'BECD — Batterie d\'Évaluation Cognitive de la Démence',
    famille: 'adulte',
    formPath: 'components/forms/BecdScoresInput.tsx',
    promptPath: 'lib/prompts/tests/becd.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'BIA': {
    nom: 'BIA',
    betaDisabled: true,
    label: 'BIA — Bilan Informatisé Aphasie',
    famille: 'adulte',
    formPath: 'components/forms/BiaScoresInput.tsx',
    promptPath: 'lib/prompts/tests/bia.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },

  // ===== Langage écrit / mixte (enfant + ado) =====
  'EVALEO 6-15': {
    nom: 'EVALEO 6-15',
    famille: 'langage_oral_ecrit',
    ageRange: '6-15 ans',
    formPath: 'components/forms/Evaleo615ScoresInput.tsx',
    promptPath: 'lib/prompts/tests/evaleo-6-15.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
    // Ordre EVALEO officiel (cf. exemples Justine Peyre) : LE → sous-jacent →
    // LO morphosyntaxe → LO autres. Incompatible avec le tri defensif
    // oral → écrit → sub generic.
    preserveDomainOrder: true,
    // Legende des scores : grille officielle EVALEO 6-15 en 7 classes
    // (Pathologique / Fragilite / 3 x Norme / Superieure a la moyenne /
    // Tres superieure), pas la grille Exalang generique.
    legendType: 'evaleo',
    // EVALEO ne presente pas l'ecart-type dans les CRBO de reference
    // (Justine Peyre, Anne Frouard) — la lecture clinique passe par la
    // classe sept-classes et le centile.
    hideEcartTypeColumn: true,
    // EVALEO retire le paragraphe de synthese domaine entre tableau et
    // commentaires par epreuve (redite verbeuse — cf. b90c700 mai 2026 + retour
    // Justine 2026-06-03 ou la synthese reapparait sur les renouvellements
    // malgre l'instruction prompt). Garde defensive cote renderer.
    hideDomainCommentaire: true,
  },
  'Exalang 3-6': {
    nom: 'Exalang 3-6',
    famille: 'langage_oral_ecrit',
    ageRange: '3-6 ans',
    formPath: 'components/forms/Exalang36ScoresInput.tsx',
    promptPath: 'lib/prompts/tests/exalang-3-6.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'Exalang 5-8': {
    nom: 'Exalang 5-8',
    famille: 'langage_oral_ecrit',
    ageRange: '5-8 ans',
    // Composant existe (Exalang58ScoresInput.tsx) mais retiré du registry
    // actif 2026-05-21 sur demande utilisateur : revient à textarea libre.
    formPath: null,
    promptPath: 'lib/prompts/tests/exalang-5-8.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'Exalang 8-11': {
    nom: 'Exalang 8-11',
    famille: 'langage_oral_ecrit',
    ageRange: '8-11 ans',
    formPath: null,
    promptPath: 'lib/prompts/tests/exalang-8-11.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'Exalang 11-15': {
    nom: 'Exalang 11-15',
    famille: 'langage_oral_ecrit',
    ageRange: '11-15 ans',
    formPath: null,
    promptPath: 'lib/prompts/tests/exalang-11-15.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'Exalang Lyfac': {
    nom: 'Exalang Lyfac',
    famille: 'langage_oral_ecrit',
    ageRange: 'lycée / fac',
    formPath: 'components/forms/ExalangLyfacScoresInput.tsx',
    promptPath: 'lib/prompts/tests/exalang-lyfac.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },

  // ===== Langage oral seul =====
  'EVALO 2-6': {
    nom: 'EVALO 2-6',
    betaDisabled: true,
    famille: 'langage_oral',
    ageRange: '2-6 ans',
    formPath: 'components/forms/Evalo26ScoresInput.tsx',
    promptPath: 'lib/prompts/tests/evalo-2-6.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'ELO': {
    nom: 'ELO',
    betaDisabled: true,
    famille: 'langage_oral',
    formPath: null,
    promptPath: 'lib/prompts/tests/elo.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'BALE': {
    nom: 'BALE',
    betaDisabled: true,
    famille: 'langage_oral',
    formPath: null,
    promptPath: 'lib/prompts/tests/bale.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'N-EEL': {
    nom: 'N-EEL',
    betaDisabled: true,
    famille: 'langage_oral',
    formPath: null,
    promptPath: 'lib/prompts/tests/n-eel.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'BILO': {
    nom: 'BILO',
    betaDisabled: true,
    famille: 'langage_oral',
    formPath: null,
    promptPath: 'lib/prompts/tests/bilo.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'BELEC': {
    nom: 'BELEC',
    betaDisabled: true,
    famille: 'langage_ecrit',
    formPath: null,
    promptPath: 'lib/prompts/tests/belec.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },

  // ===== Maths (cognition mathématique, parcours dédié hors flux CRBO standard) =====
  'B-CM': {
    nom: 'B-CM',
    betaDisabled: true,
    label: 'B-CM — Bilan de Cognition Mathématique enfant',
    famille: 'math',
    ageRange: 'cycles II-III',
    formPath: 'components/bilans/math/BilanMathForm.tsx',
    promptPath: 'lib/prompts/bilan-math-crbo.ts',
    scoreSchema: 'pastille',
    wordRenderer: 'math',
    generateRoute: '/api/generate-bilan-math',
  },
  'B-CMado': {
    nom: 'B-CMado',
    label: 'B-CMado — Bilan de Cognition Mathématique ado',
    famille: 'math',
    ageRange: 'collège',
    formPath: 'components/bilans/math/BilanMathForm.tsx',
    promptPath: 'lib/prompts/bilan-math-crbo.ts',
    scoreSchema: 'pastille',
    wordRenderer: 'math',
    generateRoute: '/api/generate-bilan-math',
  },

  // ===== Transverse =====
  'Examath': {
    nom: 'Examath',
    betaDisabled: true,
    famille: 'transverse',
    ageRange: '8-15 ans',
    formPath: 'components/forms/ExamathScoresInput.tsx',
    promptPath: 'lib/prompts/tests/examath.ts',
    scoreSchema: 'percentile',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
  'OMF / Déglutition': {
    nom: 'OMF / Déglutition',
    betaDisabled: true,
    famille: 'transverse',
    formPath: null,
    promptPath: 'lib/prompts/tests/omf-deglutition.ts',
    scoreSchema: 'free_text',
    wordRenderer: 'standard',
    generateRoute: '/api/generate-crbo',
  },
}

// ============================================================================
// Helpers de lecture
// ============================================================================

/** Retourne l'entrée si elle existe ET n'est pas cachée, sinon undefined. */
export function getBilan(nom: string): BilanEntry | undefined {
  const entry = BILAN_REGISTRY[nom]
  if (!entry || entry.hiddenInUI) return undefined
  return entry
}

/** Vrai si le bilan est verrouillé en beta (visible mais non sélectionnable).
 *  Les bilans inconnus du registry (ex: "Autre") sont aussi considérés
 *  bloqués pendant la beta pour éviter les saisies hors périmètre validé. */
export function isBetaDisabled(nom: string): boolean {
  const entry = BILAN_REGISTRY[nom]
  if (!entry) return true
  return entry.betaDisabled === true
}

/** Vrai si ce bilan a un formulaire structuré dédié. */
export function hasDedicatedForm(nom: string): boolean {
  return !!BILAN_REGISTRY[nom]?.formPath
}

/** Retourne le schéma de cotation d'un bilan (defaut 'free_text' si inconnu). */
export function getScoreSchema(nom: string): ScoreSchema {
  return BILAN_REGISTRY[nom]?.scoreSchema ?? 'free_text'
}

/** Vrai si le bilan utilise une route API alternative (pas /api/generate-crbo). */
export function hasCustomGenerateRoute(nom: string): boolean {
  const r = BILAN_REGISTRY[nom]?.generateRoute
  return !!r && r !== '/api/generate-crbo'
}

/** Liste tous les bilans visibles (hors hiddenInUI), groupés par famille. */
export function listBilansByFamille(): Record<BilanFamille, BilanEntry[]> {
  const out: Record<BilanFamille, BilanEntry[]> = {
    langage_oral: [],
    langage_ecrit: [],
    langage_oral_ecrit: [],
    math: [],
    adulte: [],
    screening: [],
    transverse: [],
  }
  for (const entry of Object.values(BILAN_REGISTRY)) {
    if (entry.hiddenInUI) continue
    out[entry.famille].push(entry)
  }
  return out
}
