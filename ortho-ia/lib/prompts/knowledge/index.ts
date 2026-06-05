/**
 * Knowledge base contextuelle pour la génération de CRBO.
 *
 * Architecture inspirée du Model Context Protocol (MCP) — les fragments de
 * connaissance sont des **ressources** statiques (extraits cliniques, arbres
 * décisionnels, critères diagnostiques, exemples de style), et un sélecteur
 * central pioche les fragments PERTINENTS selon le contexte du CRBO :
 *   - tests sélectionnés
 *   - épreuves détectées dans la structure
 *   - format choisi (complet vs synthétique)
 *   - population cible (enfant / adolescent / adulte / senior)
 *
 * Pourquoi pas un vrai serveur MCP : pour des données STATIQUES qui changent
 * rarement (les critères DSM-5 sont stables, les arbres décisionnels aussi),
 * un protocole runtime de récupération de ressources est overkill. On
 * compile les knowledge fragments dans le bundle et on les injecte
 * directement dans le system prompt.
 *
 * Source officielle : docs/Etudes de cas CRBO/ — 4 CRBO humains de référence
 * (Anne Frouard), 14 PDFs d'explications cliniques (arbres décisionnels,
 * critères DSM-5/sévérité, anamnèses-types, explications par épreuve).
 */

export { DSM5_CRITERIA } from './dsm5-criteria'
export {
  DECISION_TREE_LANGAGE_ECRIT,
  DECISION_TREE_LANGAGE_ORAL,
  DECISION_TREE_COGNITIF_ADULTE,
} from './decision-trees'
export { EFFETS_LECTURE, EFFETS_ORTHOGRAPHE } from './effets-lecture'
export {
  STYLE_ANAMNESE,
  STYLE_DOMAIN_COMMENTAIRE,
  STYLE_DIAGNOSTIC,
  STYLE_PROJET_THERAPEUTIQUE,
  STYLE_OVERALL_STRUCTURE,
  STYLE_MENTION_JURIDIQUE,
  STYLE_DSM5_CHECKBOX,
  STYLE_CLOTURE,
} from './style-examples'
export { EVALEO_METHODOLOGY } from './evaleo-method'
export { BETL_HILLIS_CARAMAZZA } from './betl-hillis-caramazza'
export { ERREURS_EVALEO } from './erreurs-evaleo'
export { ERREURS_BETL } from './erreurs-betl'
export {
  STYLE_ADMINISTRATIF_FR,
  STYLE_ADMINISTRATIF_BE,
  STYLE_ADMINISTRATIF_CH,
  STYLE_ADMINISTRATIF_LU,
  getStyleAdministratifByCountry,
} from './country-administratif'

import { DSM5_CRITERIA } from './dsm5-criteria'
import {
  DECISION_TREE_LANGAGE_ECRIT,
  DECISION_TREE_LANGAGE_ORAL,
  DECISION_TREE_COGNITIF_ADULTE,
} from './decision-trees'
import { EFFETS_LECTURE, EFFETS_ORTHOGRAPHE } from './effets-lecture'
import {
  STYLE_ANAMNESE,
  STYLE_DOMAIN_COMMENTAIRE,
  STYLE_DIAGNOSTIC,
  STYLE_PROJET_THERAPEUTIQUE,
  STYLE_OVERALL_STRUCTURE,
  STYLE_MENTION_JURIDIQUE,
  STYLE_DSM5_CHECKBOX,
  STYLE_CLOTURE,
} from './style-examples'
import { EVALEO_METHODOLOGY } from './evaleo-method'
import { BETL_HILLIS_CARAMAZZA } from './betl-hillis-caramazza'
import { ERREURS_EVALEO } from './erreurs-evaleo'
import { ERREURS_BETL } from './erreurs-betl'
import { getStyleAdministratifByCountry } from './country-administratif'
import type { OrthoCountry } from '../../types'

/** Catégorisation des tests pour le sélecteur de knowledge.
 *  Exalang 5-8 est listé dans les 5 buckets (oral + écrit + lecture +
 *  orthographe) : la batterie couvre les 35 épreuves de langage oral ET écrit
 *  (cf. registry famille 'langage_oral_ecrit'), donc bénéficie des arbres
 *  décisionnels et des effets lecture/orthographe au même titre qu'Exalang
 *  8-11 / 11-15 / EVALEO. */
const LANGAGE_ECRIT_TESTS = new Set([
  'EVALEO 6-15',
  'Exalang 5-8',
  'Exalang 8-11',
  'Exalang 11-15',
  'Exalang Lyfac',
  'BELEC',
  'BALE',
  'BILO',
])
const LANGAGE_ORAL_TESTS = new Set([
  'Exalang 3-6',
  'Exalang 5-8',
  'EVALO 2-6',
  'ELO',
  'N-EEL',
  'BILO',
  'BETL',
  'EVALEO 6-15', // couvre les 2
])
const COGNITIF_ADULTE_TESTS = new Set([
  'MoCA',
  'PREDIMEM',
  'PrediFex',
  'PrediLac',
  'BIA',
  'BECD',
  'BETL',
  'GréMots',
])
const LECTURE_TESTS = new Set([
  'EVALEO 6-15',
  'Exalang 5-8',
  'Exalang 8-11',
  'Exalang 11-15',
  'Exalang Lyfac',
  'BELEC',
  'BALE',
  'PrediLac',
])
const ORTHOGRAPHE_TESTS = LECTURE_TESTS // mêmes batteries couvrent les 2

/** Bilans de cognition mathématique, déclenche le style Elsa DALL'AGNOL
 *  (mention juridique en tête, NGAP au lieu d'AMO chiffré, vision
 *  longitudinale, DSM-5 cochable). */
const MATH_TESTS = new Set([
  'Examath',
  'B-CM',
  'B-CMado',
  'BECD',
])

/** Bilans pédiatriques avec TSA possible (dyslexie / dysorthographie /
 *  dyscalculie), déclenche le tableau DSM-5 cochable A.1 à A.6 dans le
 *  diagnostic. */
const TSA_PEDIATRIQUE_TESTS = new Set([
  'EVALEO 6-15',
  'Exalang 3-6',
  'Exalang 5-8',
  'Exalang 8-11',
  'Exalang 11-15',
  'Exalang Lyfac',
  'BELEC',
  'BALE',
  'EVALO 2-6',
  'ELO',
  'N-EEL',
  'BILO',
  'Examath',
  'B-CM',
  'B-CMado',
])

/** Détecte si la structure CRBO inclut des épreuves de lecture nommées. */
function hasLectureEpreuves(structure: { domains?: Array<{ epreuves?: Array<{ nom: string }> }> } | null | undefined): boolean {
  if (!structure?.domains) return false
  const allEpreuves = structure.domains.flatMap(d => d.epreuves ?? []).map(e => e.nom.toLowerCase())
  return allEpreuves.some(n =>
    n.includes('lecture') ||
    n.includes('pseudo-mot') ||
    n.includes('pseudomot') ||
    n.includes('logatomes') ||
    n.includes('leximétrie') ||
    n.includes('leximetrie') ||
    n.includes('eval2m'),
  )
}

/** Détecte si la structure CRBO inclut des épreuves d'orthographe / dictée. */
function hasOrthographeEpreuves(structure: { domains?: Array<{ epreuves?: Array<{ nom: string }> }> } | null | undefined): boolean {
  if (!structure?.domains) return false
  const allEpreuves = structure.domains.flatMap(d => d.epreuves ?? []).map(e => e.nom.toLowerCase())
  return allEpreuves.some(n =>
    n.includes('dictée') ||
    n.includes('dictee') ||
    n.includes('orthograph') ||
    n.includes('transcription'),
  )
}

/**
 * Sélecteur central : retourne le bloc de knowledge à injecter dans le
 * system prompt selon le contexte du CRBO.
 *
 * @param tests Liste des tests sélectionnés (formData.test_utilise).
 * @param structure Structure CRBO en cours (extracted en phase 1, structure
 *   complète en phase 2/preview) — utilisée pour détecter les épreuves
 *   présentes et déclencher des knowledge spécifiques (effets lecture si
 *   épreuve de lecture présente, etc.).
 * @param phase Phase du flow ('extract' / 'synthesize' / 'full') — certains
 *   knowledge (style, DSM-5) ne sont pertinents qu'en synthèse.
 */
export function buildKnowledgeContext(
  tests: string[],
  structure: { domains?: Array<{ epreuves?: Array<{ nom: string }> }> } | null | undefined,
  phase: 'extract' | 'synthesize' | 'full' = 'full',
  country: OrthoCountry | undefined = 'FR',
): string {
  const fragments: string[] = []

  // En phase d'extraction, on n'a pas besoin du style ni du DSM-5 (l'IA ne
  // produit que les domaines + commentaires bruts, pas le diagnostic). On
  // garde uniquement les arbres décisionnels et les effets/orthographe pour
  // que la classification des épreuves dans domains[] soit correcte.
  const includeStyle = phase !== 'extract'
  const includeDSM5 = phase !== 'extract'

  // Style général + structure-type (toujours utile en synthèse)
  if (includeStyle) {
    fragments.push(STYLE_OVERALL_STRUCTURE)
    fragments.push(STYLE_ANAMNESE)
    fragments.push(STYLE_DOMAIN_COMMENTAIRE)
    fragments.push(STYLE_DIAGNOSTIC)
    fragments.push(STYLE_PROJET_THERAPEUTIQUE)
    fragments.push(STYLE_CLOTURE) // phrase de clôture standard, tous bilans
  }

  // Mentions administratives selon le pays d'exercice de l'orthophoniste
  // (AMO/NGAP pour FR, INAMI/catégorie B2 pour BE, GLN/SLPS pour CH, CNS
  // pour LU). Injecté pour toutes les phases (utile dès l'extraction pour
  // que le motif reformulé utilise déjà le bon vocabulaire).
  fragments.push(getStyleAdministratifByCountry(country))

  // Style Elsa DALL'AGNOL spécifique math, mention juridique + libellé NGAP
  // (le bloc STYLE_PROJET_THERAPEUTIQUE injecté ci-dessus contient déjà la
  // section "Cas particulier des bilans de cognition mathématique" qui rappelle
  // que pour math on utilise NGAP, pas AMO chiffré). Mention juridique en tête
  // de CRBO injectée uniquement pour les bilans math.
  if (includeStyle && tests.some(t => MATH_TESTS.has(t))) {
    fragments.push(STYLE_MENTION_JURIDIQUE)
  }

  // Tableau DSM-5 cochable A.1 à A.6, pour les TSA pédiatriques
  // (dyslexie, dysorthographie, dyscalculie). Référence Elsa DALL'AGNOL,
  // pratique clinique d'ancrage diagnostique rigoureuse.
  if (includeStyle && tests.some(t => TSA_PEDIATRIQUE_TESTS.has(t))) {
    fragments.push(STYLE_DSM5_CHECKBOX)
  }

  // Critères DSM-5 (toujours en synthèse — diagnostic doit être ancré)
  if (includeDSM5) {
    fragments.push(DSM5_CRITERIA)
  }

  // Arbres décisionnels selon les tests sélectionnés
  const hasLE = tests.some(t => LANGAGE_ECRIT_TESTS.has(t))
  const hasLO = tests.some(t => LANGAGE_ORAL_TESTS.has(t))
  const hasCogAdulte = tests.some(t => COGNITIF_ADULTE_TESTS.has(t))

  if (hasLE) fragments.push(DECISION_TREE_LANGAGE_ECRIT)
  if (hasLO) fragments.push(DECISION_TREE_LANGAGE_ORAL)
  if (hasCogAdulte) fragments.push(DECISION_TREE_COGNITIF_ADULTE)

  // Effets lecture / orthographe : déclenchés si un test de lecture/orthographe
  // est présent OU si la structure contient des épreuves correspondantes.
  const hasLectureTest = tests.some(t => LECTURE_TESTS.has(t))
  const hasOrthographeTest = tests.some(t => ORTHOGRAPHE_TESTS.has(t))
  if (hasLectureTest || hasLectureEpreuves(structure)) {
    fragments.push(EFFETS_LECTURE)
  }
  if (hasOrthographeTest || hasOrthographeEpreuves(structure)) {
    fragments.push(EFFETS_ORTHOGRAPHE)
  }

  // EVALEO méthodologie : injecté si EVALEO 6-15 sélectionné. C'est le
  // référentiel le plus complet et le plus à jour pour la rédaction du
  // CRBO langage écrit pédiatrique (demande Laurie : "se baser sur les
  // manuels EVALEO, très complets, en lien avec littérature actuelle").
  // Inclut aussi structure d'écriture du CRBO + acronymes officiels +
  // 7 classes étalonnage + diagnostic juridique formel.
  if (includeStyle && tests.includes('EVALEO 6-15')) {
    fragments.push(EVALEO_METHODOLOGY)
    // Typologie fine des erreurs EVALEO (substitutions acoustiques /
    // visuelles / mixtes / autres, omissions, ajouts, erreurs séquentielles,
    // OL / ODNM / ODM, segmentation, ventilation dictée de phrases en 4 axes).
    // Source : Livret de cotation EVALEO 6-15 + annexe d'exemples 2026.
    // Injecté en synthèse uniquement (en extract on n'a pas encore d'erreurs
    // à qualifier).
    fragments.push(ERREURS_EVALEO)
  }

  // BETL Hillis & Caramazza : injecté si BETL sélectionné. Demande Laurie :
  // "Pour la rédaction des conclusions BETL, se baser surtout sur le schéma
  // d'Hillis et Caramazza présents dans le manuel BETL". Inclut le modèle
  // théorique complet + logique diagnostique en 3 étapes + patterns
  // d'erreurs en dénomination + profils par pathologie.
  if (tests.includes('BETL')) {
    fragments.push(BETL_HILLIS_CARAMAZZA)
    // Typologie fine des erreurs BETL en dénomination (paraphasies
    // lexicales formelles / sémantiques / mixtes, paraphasies segmentales,
    // logatomes, conduites d'approche formelle / sémantique / flexionnelle /
    // combinatoire / constructionnelle, persévérations, dénominations vides,
    // grille discours 5 axes Annexe 2). Source : Manuel BETL Tran 2015 pp.
    // 40-41 + Annexe 2.
    fragments.push(ERREURS_BETL)
  }

  if (fragments.length === 0) return ''

  return `\n\n---\n\n# 📚 BASE DE CONNAISSANCE CLINIQUE\n\nLes blocs ci-dessous sont des extraits de référence pour ancrer la rédaction du CRBO sur les standards officiels et le style des orthophonistes expertes (Anne Frouard / EVALEO 6-15) et les modèles théoriques de référence (Caramazza & Hillis pour la BETL). Tu DOIS t'inspirer de ces extraits pour le ton, la structure, et les formulations diagnostiques — **sans copier-coller verbatim** sauf pour les formules juridiques imposées.\n\n${fragments.join('\n\n')}\n\n---`
}
