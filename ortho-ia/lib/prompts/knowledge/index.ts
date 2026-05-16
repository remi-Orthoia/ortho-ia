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
} from './style-examples'

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
} from './style-examples'

/** Catégorisation des tests pour le sélecteur de knowledge. */
const LANGAGE_ECRIT_TESTS = new Set([
  'EVALEO 6-15',
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
])
const LECTURE_TESTS = new Set([
  'EVALEO 6-15',
  'Exalang 8-11',
  'Exalang 11-15',
  'Exalang Lyfac',
  'BELEC',
  'BALE',
  'PrediLac',
])
const ORTHOGRAPHE_TESTS = LECTURE_TESTS // mêmes batteries couvrent les 2

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

  if (fragments.length === 0) return ''

  return `\n\n---\n\n# 📚 BASE DE CONNAISSANCE CLINIQUE\n\nLes blocs ci-dessous sont des extraits de référence pour ancrer la rédaction du CRBO sur les standards officiels et le style des orthophonistes expertes (Anne Frouard / EVALEO 6-15). Tu DOIS t'inspirer de ces extraits pour le ton, la structure, et les formulations diagnostiques — **sans copier-coller verbatim** sauf pour les formules juridiques imposées.\n\n${fragments.join('\n\n')}\n\n---`
}
