/**
 * Suggestions de bilans complémentaires (chaînage dans un même CRBO).
 *
 * Quand l'orthophoniste sélectionne un test, on lui propose les bilans
 * cliniquement compatibles pour les ajouter au même CRBO. Cas typique :
 *
 *   - MoCA (screening cognitif rapide) → BETL + PREDIMEM (bilans approfondis)
 *   - Examath (cognition mathématique) → Exalang 8-11 (langage écrit) car
 *     30-40 % des dyscalculies sont associées à une dyslexie
 *   - BECD (dysarthrie) → BIA (aphasie), atteintes souvent conjointes en
 *     phase post-AVC
 *
 * Les tests qui ont un **formulaire UI guidé** (cf. components/forms/)
 * peuvent être chaînés dans un même CRBO : chaque formulaire écrit dans
 * son propre slot et les résultats sont agrégés à la génération.
 *
 * Ce mapping NE LIMITE PAS la liberté de l'ortho — elle peut toujours
 * cocher d'autres tests via la grille standard. C'est une suggestion
 * cliniquement pertinente, pas une contrainte.
 */

/** Tests qui disposent d'un composant de saisie spécifique (formulaire guidé).
 *  Doit rester synchronisé avec les composants importés dans nouveau-crbo/page.tsx. */
export const TESTS_WITH_SPECIFIC_FORM = new Set<string>([
  'MoCA',
  'BETL',
  'PREDIMEM',
  'PrediFex',
  'PrediLac',
  'BECD',
  'BIA',
  'Examath',
  'EVALEO 6-15',
  'Exalang 3-6',
  'Exalang 5-8',
  'Exalang Lyfac',
])

/** Suggestions de bilans complémentaires par test "racine". Vide = pas de
 *  suggestion (l'ortho compose librement). Les valeurs sont des libellés
 *  TESTS_OPTIONS exacts. */
export const COMPLEMENTARY_BILANS: Record<string, { tests: string[]; rationale: string }> = {
  // ===== ADULTE / SENIOR — gamme cognitive =====
  MoCA: {
    tests: ['BETL', 'PREDIMEM', 'PrediFex', 'BECD'],
    rationale: 'Après un screening MoCA, approfondir avec les bilans ciblés sur les domaines fragilisés (langage = BETL, mémoire = PREDIMEM, fonctions exécutives = PrediFex, parole = BECD).',
  },
  PREDIMEM: {
    tests: ['MoCA', 'PrediFex', 'PrediLac'],
    rationale: 'Compléter la mémoire (PREDIMEM) par un screening global (MoCA) et les autres composantes cognitives de la gamme PREDI (exécutif, lecture).',
  },
  PrediFex: {
    tests: ['MoCA', 'PREDIMEM', 'PrediLac'],
    rationale: 'Compléter les fonctions exécutives par un screening MoCA et la mémoire/lecture (PREDIMEM, PrediLac).',
  },
  PrediLac: {
    tests: ['MoCA', 'PREDIMEM', 'PrediFex'],
    rationale: 'Compléter la lecture adulte (PrediLac) par un screening MoCA et la gamme PREDI complète.',
  },
  BETL: {
    tests: ['MoCA', 'PREDIMEM'],
    rationale: 'Le BETL gagne à être croisé avec un screening MoCA et la mémoire (PREDIMEM) pour situer le langage dans le tableau cognitif global.',
  },
  BECD: {
    tests: ['MoCA', 'BIA'],
    rationale: 'La dysarthrie (BECD) est souvent associée à une atteinte langagière (BIA) en phase post-AVC, et à un retentissement cognitif global (MoCA).',
  },
  BIA: {
    tests: ['MoCA', 'BECD', 'PrediLac'],
    rationale: 'L\'aphasie (BIA) se croise avec la dysarthrie (BECD), le screening cognitif (MoCA), et la lecture adulte (PrediLac).',
  },

  // ===== ENFANT / ADOLESCENT =====
  Examath: {
    tests: ['Exalang 8-11', 'Exalang 11-15'],
    rationale: 'Dans 30-40 % des dyscalculies, une dyslexie est associée. Croiser systématiquement avec un Exalang adapté à l\'âge.',
  },
  'Exalang 8-11': {
    tests: ['Examath'],
    rationale: 'Si la lecture est touchée, vérifier la cognition mathématique (Examath) — comorbidité dyscalculie + dyslexie fréquente.',
  },
  'Exalang 11-15': {
    tests: ['Examath'],
    rationale: 'Même logique qu\'Exalang 8-11 — croiser dyscalculie + dyslexie.',
  },
  'EVALEO 6-15': {
    tests: ['Examath'],
    rationale: 'EVALEO couvre langage oral et écrit ; ajouter Examath si suspicion de dyscalculie associée.',
  },
  'Exalang 3-6': {
    tests: [],
    rationale: '',
  },
  'Exalang 5-8': {
    tests: [],
    rationale: '',
  },
  'Exalang Lyfac': {
    tests: [],
    rationale: '',
  },
}

/** Retourne les tests complémentaires suggérés pour un test donné, en filtrant
 *  les tests déjà sélectionnés. Renvoie {tests: [], rationale: ''} si rien à
 *  suggérer.
 *
 *  @param rootTest test "racine" actuellement sélectionné
 *  @param alreadySelected tests déjà dans la liste pour ne pas les re-suggérer
 */
export function getComplementarySuggestions(
  rootTest: string,
  alreadySelected: string[],
): { tests: string[]; rationale: string } {
  const entry = COMPLEMENTARY_BILANS[rootTest]
  if (!entry) return { tests: [], rationale: '' }
  const filtered = entry.tests.filter(t => !alreadySelected.includes(t))
  if (filtered.length === 0) return { tests: [], rationale: '' }
  return { tests: filtered, rationale: entry.rationale }
}
