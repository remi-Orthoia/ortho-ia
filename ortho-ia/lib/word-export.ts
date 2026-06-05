/**
 * Génération du CRBO au format Word (.docx).
 *
 * Module client-only car utilise `document.createElement('canvas')` pour
 * les graphiques à barres et `import('docx')` dynamique (tree-shaking).
 *
 * Design :
 *  - Palette SEUILS unique source de vérité (shading Word + CSS canvas + légende)
 *  - Colonne "Interprétation" systématique dans les tableaux de bilan
 *  - Graphique page 1 : synthèse moyenne par domaine
 *  - Graphique par domaine : une barre par épreuve
 *  - Anamnèse : JAMAIS les notes brutes — marqueur [À COMPLÉTER] si manquante
 */

import type { CRBOStructure } from './prompts'
import { happyNeuronChartToPng, classifyFamily, type ChartGroup, type FamilyKey } from './chart'
import { BILAN_REGISTRY } from './bilan-registry'

// Ordre canonique des familles cliniques — identique à celui rendu par le
// graphique HappyNeuron (page 1 du Word). Les sections narratives du CRBO
// (tableaux par domaine, commentaires) doivent suivre exactement cet ordre
// pour que prose et graphique racontent la même histoire.
const FAMILY_RANK: Record<FamilyKey, number> = { oral: 0, ecrit: 1, sub: 2 }

/**
 * Re-tri défensif des domaines selon les 3 familles cliniques :
 *   1. Langage oral
 *   2. Langage écrit
 *   3. Compétences sous-jacentes
 *
 * Le LLM est explicitement instruit (system-base.ts) de produire `domains[]`
 * dans cet ordre. Ce tri garantit la cohérence même si une ancienne génération
 * ou une saisie manuelle laisse les domaines mélangés. Tri stable : à
 * l'intérieur d'une famille, l'ordre du LLM est préservé.
 */
function sortDomainsByFamily<T extends { nom: string }>(domains: T[]): T[] {
  return [...domains]
    .map((d, idx) => ({ d, idx, rank: FAMILY_RANK[classifyFamily(d.nom)] }))
    .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    .map((x) => x.d)
}

// Re-export pour compat avec les imports existants (CRBOStructuredPreview, etc.)
export { ZONES, zoneFor } from './chart'
export type { ZonePerformance } from './chart'

// --------------------- Palette cohérente seuils cliniques ---------------------
//
// Grille 6 zones imposée par Laurie — refonte 2026-05-ter :
//  - P76-P100        → Excellent           (vert foncé)
//  - P50-P75         → Moyenne haute       (vert clair)
//  - P26-P49         → Moyenne basse       (jaune)
//  - P11-P25         → Zone de fragilité   (orange clair)
//  - P6-P10          → Difficulté          (orange foncé)
//  - P1-P5           → Difficulté sévère   (rouge)
//
// Note importante : il n'y a JAMAIS de "<P5" — Exalang n'affiche jamais de
// bande sous P5. P5 lui-même est inclus dans "Difficulté sévère".
// Bornes INCLUSIVES de part et d'autre (P50 ∈ Moyenne haute, P75 ∈ Moyenne
// haute, P76 ∈ Excellent).
export type SeuilLabel =
  | 'Excellent'
  | 'Moyenne haute'
  | 'Moyenne basse'
  | 'Zone de fragilité'
  | 'Difficulté'
  | 'Difficulté sévère'
  // Labels courts pour la palette EVALEO 7 classes officielles (cf.
  // SEUILS_EVALEO ci-dessous). Le longLabel correspondant intègre la
  // nomenclature complète "Classe X - <Libellé>".
  | 'Classe 1'
  | 'Classe 2'
  | 'Classe 3'
  | 'Classe 4'
  | 'Classe 5'
  | 'Classe 6'
  | 'Classe 7'

export type SeuilClinique = {
  label: SeuilLabel
  /** Label long affiché dans la légende du Word. Identique à `label` depuis
   *  la refonte 2026-05 — conservé pour rétro-compatibilité avec le code
   *  qui le consomme (UI legend, chart). */
  longLabel: string
  min: number
  /** Hex sans # — fond cellule docx + UI chip background. */
  shading: string
  /** Hex avec # — texte canvas/UI. */
  css: string
  /** Couleur du texte dans la cellule (white pour fonds foncés, undefined sinon). */
  textColor?: string
  range: string
}

// Palette imposée Laurie — grille 6 zones refonte 2026-05-ter.
// Exalang n'affiche JAMAIS de bande <P5 — la bande la plus basse est P1-P5.
//
//   Excellent          → #2E7D32 fond vert foncé,    texte blanc (P76-100)
//   Moyenne haute      → #66BB6A fond vert clair                  (P50-P75, Q3 inclus)
//   Moyenne basse      → #FBC02D fond jaune                       (P26-P49)
//   Zone de fragilité  → #FB8C00 fond orange clair                (P11-P25, Q1 inclus)
//   Difficulté         → #E65100 fond orange foncé, texte blanc   (P6-P10)
//   Difficulté sévère  → #D32F2F fond rouge vif,     texte blanc  (P1-P5)
//
// Pour les tableaux Word, on utilise les `shading` (cellule) + `textColor`
// (texte). Pour le graphique chart, voir chart.ts qui a sa propre palette
// pastel pour les bandes de fond.
export const SEUILS: SeuilClinique[] = [
  { label: 'Excellent',          longLabel: 'Excellent',          min: 76, shading: '2E7D32', css: '#1B5E20', textColor: 'FFFFFF', range: 'P76-100' },
  { label: 'Moyenne haute',      longLabel: 'Moyenne haute',      min: 50, shading: '66BB6A', css: '#2E7D32', range: 'P50-P75' },
  { label: 'Moyenne basse',      longLabel: 'Moyenne basse',      min: 26, shading: 'FBC02D', css: '#F57F17', range: 'P26-P49' },
  { label: 'Zone de fragilité',  longLabel: 'Zone de fragilité',  min: 11, shading: 'FB8C00', css: '#E65100', range: 'P11-P25' },
  { label: 'Difficulté',         longLabel: 'Difficulté',         min: 6,  shading: 'E65100', css: '#BF360C', textColor: 'FFFFFF', range: 'P6-P10' },
  { label: 'Difficulté sévère',  longLabel: 'Difficulté sévère',  min: 1,  shading: 'D32F2F', css: '#B71C1C', textColor: 'FFFFFF', range: 'P1-P5' },
]

export function seuilFor(value: number): SeuilClinique {
  for (const s of SEUILS) if (value >= s.min) return s
  return SEUILS[SEUILS.length - 1]
}

// --------------------- Palette EVALEO 6-15 (7 classes officielles) ---------------------
//
// Grille officielle Launay et al. 2018 — voir image livret de cotation.
// Coloration cellule Word + chip preview UI : rouge (1) / orange (2) /
// vert clair (3) / vert moyen (4) / vert foncé (5) / bleu clair (6) /
// bleu foncé (7). Le mapping est :
//
//   Classe 1 (<P7)       → rouge      #D32F2F + texte blanc
//   Classe 2 (P7-P20)    → orange     #F57C00 + texte blanc
//   Classe 3 (P21-P38)   → vert clair #A5D6A7 + texte vert foncé
//   Classe 4 (P39-P62)   → vert moyen #66BB6A + texte blanc
//   Classe 5 (P63-P80)   → vert foncé #2E7D32 + texte blanc
//   Classe 6 (P81-P93)   → bleu clair #4FC3F7 + texte bleu foncé
//   Classe 7 (>P93)      → bleu foncé #0288D1 + texte blanc
//
// Utilisé UNIQUEMENT pour les bilans EVALEO (registry legendType='evaleo')
// afin de garder la cohérence avec la légende affichée en tête du document.
// Tous les autres bilans continuent d'utiliser la palette SEUILS Laurie.
export const SEUILS_EVALEO: SeuilClinique[] = [
  { label: 'Classe 7', longLabel: 'Classe 7 - Très supérieure',        min: 94, shading: '0288D1', css: '#0277BD', textColor: 'FFFFFF', range: '> P93' },
  { label: 'Classe 6', longLabel: 'Classe 6 - Supérieure à la moyenne', min: 81, shading: '4FC3F7', css: '#039BE5',                       range: 'P81 - P93' },
  { label: 'Classe 5', longLabel: 'Classe 5 - Norme',                   min: 63, shading: '2E7D32', css: '#1B5E20', textColor: 'FFFFFF', range: 'P63 - P80' },
  { label: 'Classe 4', longLabel: 'Classe 4 - Norme',                   min: 39, shading: '66BB6A', css: '#2E7D32', textColor: 'FFFFFF', range: 'P39 - P62' },
  { label: 'Classe 3', longLabel: 'Classe 3 - Norme',                   min: 21, shading: 'A5D6A7', css: '#388E3C',                       range: 'P21 - P38' },
  { label: 'Classe 2', longLabel: 'Classe 2 - Fragilité',               min: 7,  shading: 'F57C00', css: '#E65100', textColor: 'FFFFFF', range: 'P7 - P20' },
  { label: 'Classe 1', longLabel: 'Classe 1 - Pathologique',            min: 0,  shading: 'D32F2F', css: '#B71C1C', textColor: 'FFFFFF', range: '< P7' },
]

export function seuilForEvaleo(value: number): SeuilClinique {
  for (const s of SEUILS_EVALEO) if (value >= s.min) return s
  return SEUILS_EVALEO[SEUILS_EVALEO.length - 1]
}

/** Helper : choisit le seuil selon la palette demandee. Generique — toute
 *  future palette de bilan custom peut etre ajoutee ici. */
export function pickSeuil(value: number, palette: 'standard' | 'evaleo' = 'standard'): SeuilClinique {
  return palette === 'evaleo' ? seuilForEvaleo(value) : seuilFor(value)
}

/**
 * Mappe les anciens labels d'interprétation (CRBO legacy en DB) vers les
 * labels de la grille actuelle. Utilisé au rendu pour assurer la cohérence
 * avec la couleur dérivée de `percentile_value`.
 *
 * **Refonte 2026-05-ter (grille Laurie 6 zones)** :
 *   - "Excellent" réintroduit (P76-100).
 *   - "Moyenne haute" couvre désormais P50-P75 (était P≥75).
 *   - "Moyenne basse" réintroduit (P26-P49).
 *   - "Zone de fragilité" passe de P10-25 à P11-P25.
 *   - "Difficulté" passe de P5-9 à P6-P10.
 *   - "Difficulté sévère" passe de <P5 à P1-P5 (Exalang n'affiche jamais <P5).
 *
 * Pour les CRBO legacy, on remappe à la SÉMANTIQUE actuelle. La source de
 * vérité reste `percentile_value` : le Word rendu via `seuilFor(percentile_value)`
 * recalcule toujours la couleur correcte depuis la valeur numérique.
 */
export function normalizeInterpretation(stored: string | undefined): SeuilLabel | undefined {
  if (!stored) return undefined
  switch (stored) {
    // Legacy 4 zones (très anciens CRBO) — heuristique conservative :
    case 'Normal':
    case 'Dans la norme': return 'Moyenne haute'   // P>25 par défaut → Moyenne haute/basse
    case 'Limite basse':
    case 'Fragile': return 'Zone de fragilité'
    case 'Déficitaire': return 'Difficulté'
    case 'Pathologique': return 'Difficulté sévère'
    // Anciens labels longs (CRBO récents avant les refontes)
    case 'Excellent résultat':
      return 'Excellent'
    case 'Résultat dans la moyenne haute':
    case 'Moyenne haute (legacy P51-75)': return 'Moyenne haute'
    case 'Résultat dans la moyenne basse':
    case 'Moyenne basse (legacy P26-50)': return 'Moyenne basse'
    // Refonte 2026-05-bis ("Moyenne" 5-zones) → 2026-05-ter (6 zones avec Moyenne basse + Excellent)
    case 'Moyenne': return 'Moyenne haute'         // par défaut côté haut (P50+)
    case 'Zone de difficulté':
    case 'Fragilité': return 'Zone de fragilité'
    case 'Zone de difficulté sévère':
      return 'Difficulté sévère'
    // Labels courts officiels (passthrough — déjà au nouveau format)
    case 'Excellent':
    case 'Moyenne haute':
    case 'Moyenne basse':
    case 'Zone de fragilité':
    case 'Difficulté':
    case 'Difficulté sévère':
      return stored as SeuilLabel
    default:
      return undefined
  }
}
export const getPercentileColor = (v: number): string => seuilFor(v).shading
export const getPercentileCssColor = (v: number): string => seuilFor(v).css

// ============================================================================
// Helpers UI registry-driven (palette par bilan)
// ----------------------------------------------------------------------------
// Ces helpers sont la source unique de verite pour les VISUALISATIONS HTML
// du CRBO (DomainTable des pages resultats/preview, RenouvellementComparisonTable,
// CRBOPrintableStructure de l'historique). Ils s'alignent sur la logique
// interne de generateCRBOWord (cf. ligne ~442 : `legendType` calcule depuis
// le registry). Sans ces helpers, chaque ecran retombait sur `seuilFor()`
// hardcode = grille Laurie 6 zones, ce qui produit une grille a 6 couleurs
// au lieu des 7 classes officielles EVALEO 6-15 (retour Cindy 2026-06).
// ============================================================================

/** Normalise un testList qui peut etre :
 *  - un vrai array de noms ["EVALEO 6-15", "Exalang 8-11"]
 *  - un array a un seul element ["EVALEO 6-15, Exalang 8-11"] (cas
 *    test_utilise stocke en string comma-separated et wrappe sans split,
 *    cf. preview/[id]/page.tsx)
 *  - vide ou null
 *  Eclate les entrees comma-separated pour que le lookup BILAN_REGISTRY[t]
 *  matche les vrais noms de bilans. */
function normalizeTestList(testList?: string[] | null): string[] {
  if (!testList || testList.length === 0) return []
  return testList.flatMap(t => t.split(',').map(s => s.trim()).filter(Boolean))
}

/** Determine la palette de seuils a utiliser pour un CRBO d'apres la liste
 *  des bilans utilises. 'evaleo' si au moins un test a legendType='evaleo'
 *  dans le registry, 'standard' sinon. */
export function paletteForTestList(testList?: string[] | null): 'standard' | 'evaleo' {
  const tests = normalizeTestList(testList)
  return tests.some(t => BILAN_REGISTRY[t]?.legendType === 'evaleo') ? 'evaleo' : 'standard'
}

/** Helper UI : seuil clinique pour une cellule de tableau (percentile +
 *  interpretation). A utiliser dans tous les composants HTML qui rendent
 *  des cellules colorees de percentile depuis `e.percentile_value`. */
export function seuilForCell(value: number, testList?: string[] | null): SeuilClinique {
  return pickSeuil(value, paletteForTestList(testList))
}

/** Helper UI : shading hex (sans '#') pour une cellule, equivalent du
 *  getPercentileColor mais registry-aware. */
export function getPercentileColorForCell(value: number, testList?: string[] | null): string {
  return seuilForCell(value, testList).shading
}

/** Helper UI : decide si les commentaires d'epreuve hors zone fragile
 *  doivent etre rendus (cf. registry showAllEpreuveComments — EVALEO 6-15).
 *  Aligne avec lib/word-export.ts ligne ~467. */
export function shouldShowAllEpreuveComments(testList?: string[] | null): boolean {
  const tests = normalizeTestList(testList)
  return tests.some(t => BILAN_REGISTRY[t]?.showAllEpreuveComments === true)
}

/**
 * Formate un percentile pour affichage UI/Word/PDF (refonte 2026-05).
 *
 * Règle Laurie : JAMAIS de "Med.", "Q1", "Q3" affichés tels quels. Toujours
 * convertir en notation Px (P25, P50, P75…).
 *
 * Priorité :
 *  1. Si `value` numérique fourni → "Pxx" rond.
 *  2. Sinon parse `raw` :
 *     - "P\d+" passthrough majuscule
 *     - "Q1" → "P25", "Q3" → "P75", "Med"/"Mediane"/"Médiane"/"M" → "P50"
 *  3. Sinon retourne raw tel quel ou "—".
 *
 * À utiliser dans les composants UI qui affichent des percentiles bruts
 * (CRBOStructuredPreview, preview page, print page).
 */
export function formatPercentileForDisplay(
  raw: string | undefined | null,
  value: number | undefined | null,
): string {
  if (typeof value === 'number' && !isNaN(value)) {
    const v = Math.max(0, Math.min(100, Math.round(value)))
    return `P${v}`
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (/^P\d+$/i.test(trimmed)) return trimmed.toUpperCase()
    const lower = trimmed.toLowerCase().replace(/\.$/, '')
    if (lower === 'q1') return 'P25'
    if (lower === 'q3') return 'P75'
    if (lower === 'med' || lower === 'mediane' || lower === 'médiane' || lower === 'm') return 'P50'
  }
  return raw || '—'
}

// --------------------- Payload d'entrée ---------------------

export interface WordExportPayload {
  formData: {
    ortho_nom?: string
    ortho_adresse?: string
    ortho_cp?: string
    ortho_ville?: string
    ortho_tel?: string
    ortho_email?: string
    ortho_adeli_rpps?: string
    patient_prenom: string
    patient_nom: string
    patient_ddn?: string
    patient_classe?: string
    bilan_date?: string
    bilan_type?: string
    medecin_nom?: string
    medecin_tel?: string
    medecin_date_prescription?: string
    motif?: string
    test_utilise: string[] | string
    anamnese?: string
    resultats_manuels?: string
    /**
     * Format du CRBO :
     *  - 'complet' (défaut) : Synthèse et conclusions classique (Points forts /
     *    Difficultés / Diagnostic / Recommandations / Axes / Aménagements).
     *  - 'synthetique' : style Laurie Berrio — DIAGNOSTIC ORTHOPHONIQUE +
     *    PROJET THÉRAPEUTIQUE + Aménagements pédagogiques proposés.
     */
    format_crbo?: 'complet' | 'synthetique'
  }
  structure?: CRBOStructure | null
  fallbackCRBO?: string
  /** Structure du bilan précédent (renouvellement) — pour tableau comparatif Word. */
  previousStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO) pour affichage. */
  previousBilanDate?: string
}

// --------------------- Matching fuzzy épreuves (audit 2026-05-29 #3) ---------------------
//
// Le tableau comparatif renouvellement matchait les épreuves actuelles ↔
// précédentes par `nom.toLowerCase().trim()`. Trop strict en pratique :
// "Lecture de mots" vs "Lecture mots", "Métaphonologie" vs "Metaphonologie",
// "Dictée de pseudo-mots" vs "Dictée de pseudomots" → no match → marqué à
// tort "✦ Nouvelle". On ajoute un matching fuzzy (Levenshtein avec garde-fous)
// qui résout ces faux positifs tout en restant conservateur.

/** Distance de Levenshtein iterative, O(m*n). */
function levenshteinDist(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Retire les diacritiques pour comparaison robuste : "Métaphonologie" →
 *  "metaphonologie". Combine avec lower+trim. */
function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // diacritiques
    .replace(/[''`']/g, "'")            // apostrophes
    .replace(/[-_/]/g, ' ')             // sépare-tirets/slashes
    .replace(/\s+/g, ' ')               // espaces multiples
    .trim()
    .toLowerCase()
}

/** Cherche dans `prevIndex` la meilleure correspondance pour `currentName`.
 *  Stratégie : exact match d'abord, puis fuzzy Levenshtein si pas trouvé
 *  ET si l'écart relatif reste ≤ 25 % de la longueur. */
function findPrevMatch<T>(
  prevIndex: Map<string, T>,
  currentName: string,
): T | undefined {
  const normCurrent = normalizeForMatch(currentName)
  // Exact d'abord (rapide chemin nominal)
  const exact = prevIndex.get(normCurrent)
  if (exact !== undefined) return exact
  // Fuzzy : on parcourt les clés indexées avec contraintes
  if (normCurrent.length < 5) return undefined  // trop court = trop de bruit
  const tolerance = Math.max(2, Math.floor(normCurrent.length * 0.25))
  let bestKey: string | null = null
  let bestDist = tolerance + 1
  // Array.from() au lieu de for...of sur l'iterator — necessaire car le
  // target TS du projet est es3 (cf. tsconfig sans champ target).
  const keys = Array.from(prevIndex.keys())
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key.length < 5) continue
    if (Math.abs(key.length - normCurrent.length) > tolerance) continue
    if (key[0] !== normCurrent[0]) continue   // initiale doit matcher
    const d = levenshteinDist(key, normCurrent)
    if (d < bestDist) {
      bestDist = d
      bestKey = key
      if (d === 0) break
    }
  }
  if (bestKey != null) return prevIndex.get(bestKey)
  return undefined
}

// --------------------- Générateur principal ---------------------

export async function generateCRBOWord(payload: WordExportPayload): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, ShadingType, ImageRun,
    PageOrientation, LevelFormat,
  } = await import('docx')

  // Police choisie par Laurie : Bookman Old Style. Disponible nativement
  // sur Windows et macOS. Sur les rares postes sans la police, Word retombe
  // sur la métrique sérif par défaut (Times New Roman) — pas d'erreur.
  const FONT = 'Bookman Old Style'
  const FONT_SIZE_NORMAL = 22
  const FONT_SIZE_TITLE = 32
  const FONT_SIZE_SECTION = 26
  const COLOR_GREEN = '2E7D32'

  // A4 portrait (11906 DXA) - 720 DXA margins chaque côté = 10466 DXA utilisables.
  // Word vérifie que sum(columnWidths) == table.width au DXA près à l'ouverture ;
  // le moindre écart déclenche "Propriétés des tableaux 1 à N" sur tous les tableaux.
  // dxaCols garantit la somme exacte en faisant absorber l'arrondi par la dernière colonne.
  const TOTAL_DXA = 10466
  const dxaCols = (percents: number[], total: number = TOTAL_DXA): number[] => {
    const cols = percents.slice(0, -1).map((p) => Math.round((total * p) / 100))
    cols.push(total - cols.reduce((a, b) => a + b, 0))
    return cols
  }

  // Affichage centile uniformisé : on convertit Q1/Med/Q3/Med. et toute
  // autre forme en "Pxx" depuis la valeur numérique. Règle clinique Laurie
  // (refonte 2026-05) : JAMAIS de "Med.", "Q1", "Q3" affichés tels quels
  // dans les tableaux / preview / Word / PDF — UNIQUEMENT les valeurs Px
  // numériques (P25, P50, P75…).
  const fmtCentile = (raw: string | undefined | null, value: number | undefined | null): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      const v = Math.max(0, Math.min(100, Math.round(value)))
      return `P${v}`
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      // Déjà au format Pxx → passthrough majuscule
      if (/^P\d+$/i.test(trimmed)) return trimmed.toUpperCase()
      // Q1/Q3/Med./Med → conversion explicite
      const lower = trimmed.toLowerCase().replace(/\.$/, '')
      if (lower === 'q1') return 'P25'
      if (lower === 'q3') return 'P75'
      if (lower === 'med' || lower === 'mediane' || lower === 'médiane' || lower === 'm') return 'P50'
    }
    return raw || '—'
  }

  const { formData, structure, fallbackCRBO = '', previousStructure, previousBilanDate } = payload
  const hasStructure = !!structure && !!structure.domains && structure.domains.length > 0
  const hasPrevious = !!previousStructure && !!previousStructure.domains && previousStructure.domains.length > 0

  // Domaines triés selon l'ordre canonique des familles (Langage oral →
  // Langage écrit → Compétences sous-jacentes), aligné avec le graphique
  // HappyNeuron de la page 1. Voir sortDomainsByFamily ci-dessus.
  //
  // EXCEPTION : si au moins un des tests utilises declare
  // `preserveDomainOrder: true` dans le registry (cf. EVALEO 6-15 dont
  // l'ordre standard mixe LE → sous-jacent → LO morphosyntaxe), on PRESERVE
  // l'ordre des domains[] produits par le LLM tel quel. Mecanisme generique
  // pilote par le registry — pas de hardcoding test-specific ici.
  // testList est declare un peu plus bas (utilise aussi pour la detection
  // MoCA), on le calcule ici de la meme maniere pour eviter le double calcul.
  const _testListForOrder = Array.isArray(formData.test_utilise)
    ? formData.test_utilise
    : (typeof formData.test_utilise === 'string' && formData.test_utilise.trim() ? [formData.test_utilise] : [])
  const preserveOrder = _testListForOrder.some(t => BILAN_REGISTRY[t]?.preserveDomainOrder === true)
  // legendType pilote a la fois la legende des scores rendue au-dessus du
  // bloc BILAN ET la palette de coloration cellule (centile + interpretation)
  // dans les tableaux. Doit etre calcule tot car utilise des le bloc
  // PAGE 1 RENOUVELLEMENT (~ligne 700) pour les cellules comparatives.
  const legendType: 'standard' | 'evaleo' = (() => {
    for (const t of _testListForOrder) {
      if (BILAN_REGISTRY[t]?.legendType === 'evaleo') return 'evaleo'
    }
    return 'standard'
  })()
  // hideEcartTypeColumn : si l'un des tests du bilan l'active (EVALEO 6-15),
  // on retire la colonne É-T du tableau d'épreuves et on redistribue les
  // largeurs sur 4 colonnes (Épreuve / Score / Centile / Interprétation).
  const hideEcartTypeColumn = _testListForOrder.some(
    (t) => BILAN_REGISTRY[t]?.hideEcartTypeColumn === true,
  )
  // hideDomainCommentaire : si l'un des tests du bilan l'active (EVALEO 6-15),
  // on saute le paragraphe `domain.commentaire` entre le tableau et les
  // commentaires par épreuve. Anti-redite ; le prompt instruit déjà l'IA mais
  // celle-ci ne respecte pas toujours (retour Justine 2026-06-03 renouv.).
  const hideDomainCommentaire = _testListForOrder.some(
    (t) => BILAN_REGISTRY[t]?.hideDomainCommentaire === true,
  )
  // showAllEpreuveComments : si l'un des tests du bilan l'active (EVALEO 6-15),
  // les commentaires d'épreuve s'affichent SANS le filtre `percentile_value < 50`
  // par défaut. Tous les commentaires non vides remontent dans le Word, y
  // compris pour les épreuves en norme — utile pour ne pas perdre les
  // annotations type "elle saute des lignes" sur une épreuve en classe 4-5
  // (retour Cindy 2026-06).
  const showAllEpreuveComments = _testListForOrder.some(
    (t) => BILAN_REGISTRY[t]?.showAllEpreuveComments === true,
  )
  const orderedDomains = hasStructure
    ? (preserveOrder ? structure!.domains : sortDomainsByFamily(structure!.domains))
    : []
  const orderedPrevDomains = hasPrevious
    ? (preserveOrder ? previousStructure!.domains : sortDomainsByFamily(previousStructure!.domains))
    : []
  // Style "Laurie Berrio" — restructuration de la synthèse en 3 sections plates
  // (DIAGNOSTIC ORTHOPHONIQUE / PROJET THÉRAPEUTIQUE / Aménagements pédagogiques
  // proposés), sans Points forts / Difficultés / Axes / signature.
  const isSynthetique = formData.format_crbo === 'synthetique'

  // ============ Détection MoCA ============
  //
  // Le MoCA est un screening cognitif /30, pas un bilan percentile-based.
  // Quand c'est le seul test du bilan, on remplace le graphique HappyNeuron et
  // le tableau percentile par un rendu MoCA dédié (4 colonnes Domaine/Score/
  // Max/Interprétation + bandeau Total avec badge sévérité).
  const testList = Array.isArray(formData.test_utilise) ? formData.test_utilise : [formData.test_utilise]
  const isMocaOnly = testList.length === 1 && testList[0] === 'MoCA'

  /** Parse "X/Y" en {score, max}. Tolère espaces. Renvoie null si pas parsable. */
  const parseScoreFraction = (raw: string): { score: number; max: number } | null => {
    if (!raw) return null
    const m = raw.trim().match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/)
    if (!m) return null
    const score = parseInt(m[1], 10)
    const max = parseInt(m[2], 10)
    if (isNaN(score) || isNaN(max) || max <= 0) return null
    return { score, max }
  }

  /**
   * Seuils MoCA officiels (Nasreddine et al. 2005) sur le total /30.
   * À appliquer au TOTAL CORRIGÉ (après +1 si scolarité ≤ 12 ans).
   */
  const mocaSeverity = (total: number): { label: string; shading: string; textColor?: string } => {
    if (total >= 26) return { label: 'Pas d\'atteinte',     shading: '2E7D32', textColor: 'FFFFFF' }
    if (total >= 18) return { label: 'Atteinte légère',     shading: 'FBC02D', textColor: '5D4037' }
    if (total >= 10) return { label: 'Atteinte modérée',    shading: 'E65100', textColor: 'FFFFFF' }
    return                   { label: 'Atteinte sévère',    shading: 'D32F2F', textColor: 'FFFFFF' }
  }

  /**
   * Couleur d'interprétation par domaine MoCA : palette 3 zones sur le ratio
   * score/max — différente des SEUILS percentiles (qui sont une grille 6 zones).
   *   ≥ 80% → préservé (vert)
   *   50-79% → fragilisé (orange)
   *   < 50%  → déficitaire (rouge)
   */
  const mocaDomainSeverity = (pct: number): { label: string; shading: string; textColor?: string } => {
    if (pct >= 80) return { label: 'Préservé',     shading: '2E7D32', textColor: 'FFFFFF' }
    if (pct >= 50) return { label: 'Fragilisé',    shading: 'FB8C00', textColor: 'FFFFFF' }
    return                  { label: 'Déficitaire', shading: 'D32F2F', textColor: 'FFFFFF' }
  }

  // ============ Helpers ============

  const createCell = (text: string, options: { bold?: boolean, dxa: number, shading?: string, alignment?: any, textColor?: string }) => {
    const { bold = false, dxa, shading, alignment = AlignmentType.LEFT, textColor } = options
    return new TableCell({
      width: { size: dxa, type: WidthType.DXA },
      shading: shading ? { type: ShadingType.CLEAR, fill: shading, color: 'auto' } : undefined,
      children: [new Paragraph({
        alignment,
        children: [new TextRun({ text: text || '', bold, size: FONT_SIZE_NORMAL, font: FONT, color: textColor })],
      })],
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        left:   { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        right:  { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
      },
    })
  }

  const createSectionTitle = (text: string, opts: { centered?: boolean; pageBreakBefore?: boolean } = {}) => new Paragraph({
    alignment: opts.centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    // pageBreakBefore: attribut Word natif qui force ce paragraphe à demarrer
    // une nouvelle page. Pas de paragraphe vide intermediaire (contrairement
    // a un new PageBreak() dans children) -> evite les pages blanches qui
    // apparaissaient quand le contenu precedent terminait pile en bas de page.
    pageBreakBefore: opts.pageBreakBefore,
    children: [new TextRun({ text, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: COLOR_GREEN })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: COLOR_GREEN, space: 20, style: BorderStyle.SINGLE, size: 12 } },
  })

  // Graphique HappyNeuron : la logique de rendu est dans lib/chart.ts (partagée
  // avec la page de visualisation pré-Word). Wrapper local pour la signature.
  // ⚠️ NE PAS imposer de width par défaut — sinon computeChartWidth dynamique
  // est court-circuité et le canvas a de l'espace vide à droite sur les bilans
  // peu chargés. On laisse happyNeuronChartToPng calculer la largeur exacte.
  const generateGroupedBarChart = (
    groups: ChartGroup[],
    title: string,
    minHeight = 480,
  ) => happyNeuronChartToPng(groups, title, undefined, minHeight)

  const imageParagraph = (img: { data: ArrayBuffer; width: number; height: number }) => {
    // Cible une largeur d'affichage Word constante (~620 px) pour rester dans
    // les marges A4 quel que soit la taille du canvas source. Le ratio est
    // préservé via la même division. Word/docx exige des entiers : on round.
    // 620 px ≈ 16,4 cm — rentre confortablement dans la page A4 (16,4 cm utiles
    // avec marges de 720 DXA = 1,27 cm de chaque côté).
    const TARGET_WORD_PX = 620
    const scale = img.width > 0 ? img.width / TARGET_WORD_PX : 1
    const w = Math.round(img.width / scale)        // = TARGET_WORD_PX
    const h = Math.round(img.height / scale)
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new ImageRun({
        // ⚠️ `type: 'png'` est OBLIGATOIRE — sinon docx@9 nomme le fichier
        // `<hash>.undefined` dans word/media/, et [Content_Types].xml ne
        // déclare pas l'extension .undefined → Word affiche "Le document
        // contient des erreurs" à l'ouverture et propose de réparer.
        type: 'png',
        data: img.data,
        transformation: { width: w, height: h },
      })],
    })
  }

  const calculateAge = () => {
    if (!formData.patient_ddn) return ''
    const birth = new Date(formData.patient_ddn)
    if (isNaN(birth.getTime())) return ''
    // Référence = date du bilan saisie dans le formulaire (pas la date du jour).
    // Fallback sur today si bilan_date est absent.
    const ref = formData.bilan_date ? new Date(formData.bilan_date) : new Date()
    if (isNaN(ref.getTime())) return ''
    // DDN postérieure à la date de bilan = saisie incohérente (typo sur l'année
    // par exemple). On retourne vide plutôt qu'un "-3 ans" qui s'imprimerait
    // dans l'en-tête patient du Word.
    if (birth.getTime() > ref.getTime()) return ''
    let years = ref.getFullYear() - birth.getFullYear()
    let months = ref.getMonth() - birth.getMonth()
    if (ref.getDate() < birth.getDate()) months -= 1
    if (months < 0) { years -= 1; months += 12 }
    if (years < 0) return ''
    if (years === 0) return `${Math.max(0, months)} mois`
    return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
  }

  // ============ Construction du document ============

  // Date affichée = date saisie dans le formulaire (bilan_date), formatée FR long
  // ("25 avril 2026"). Fallback sur la date du jour si bilan_date absente.
  const formatFrLong = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const bilanDateFormatted =
    formatFrLong(formData.bilan_date) ||
    new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const ddnFormatted = formData.patient_ddn ? new Date(formData.patient_ddn).toLocaleDateString('fr-FR') : ''
  const testsText = Array.isArray(formData.test_utilise) ? formData.test_utilise.join(', ') : formData.test_utilise

  const children: any[] = []

  // ===== EN-TÊTE ORTHOPHONISTE =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: formData.ortho_nom || '', size: FONT_SIZE_NORMAL, font: FONT, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: 'Orthophoniste', size: FONT_SIZE_NORMAL, font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: formData.ortho_adresse || '', size: FONT_SIZE_NORMAL, font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: `${formData.ortho_cp || ''} ${formData.ortho_ville || ''}`.trim(), size: FONT_SIZE_NORMAL, font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: formData.ortho_tel || '', size: FONT_SIZE_NORMAL, font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: formData.ortho_email || '', size: FONT_SIZE_NORMAL, font: FONT })] }),
  )
  // Ligne supplementaire numero professionnel — rendue uniquement si saisi
  // dans le profil. Les comptes anciens sans le champ n'affichent rien.
  if ((formData.ortho_adeli_rpps || '').trim()) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: formData.ortho_adeli_rpps!.trim(), size: FONT_SIZE_NORMAL, font: FONT })] }),
    )
  }
  children.push(
    new Paragraph({ children: [new TextRun({ text: '' })] }),
  )

  // ===== TITRE =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'COMPTE RENDU DE BILAN ORTHOPHONIQUE', bold: true, size: FONT_SIZE_TITLE, font: FONT })],
      spacing: { before: 200, after: 400 },
    }),
  )

  children.push(createSectionTitle(`Bilan ${formData.bilan_type || ''} du ${bilanDateFormatted}`, { centered: true }))

  // ===== PATIENT =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Patient', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
    (() => {
      const cols = dxaCols([15, 35, 15, 35])
      return new Table({
        width: { size: TOTAL_DXA, type: WidthType.DXA },
        columnWidths: cols,
        rows: [
          new TableRow({ children: [
            createCell('Prénom :', { dxa: cols[0] }),
            createCell(formData.patient_prenom, { bold: true, dxa: cols[1] }),
            createCell('Nom :', { dxa: cols[2] }),
            createCell(formData.patient_nom, { bold: true, dxa: cols[3] }),
          ]}),
          new TableRow({ children: [
            createCell('Âge :', { dxa: cols[0] }),
            createCell(`${calculateAge()}${ddnFormatted ? ` (${ddnFormatted})` : ''}`, { dxa: cols[1] }),
            createCell('Classe :', { dxa: cols[2] }),
            createCell(formData.patient_classe || '', { dxa: cols[3] }),
          ]}),
        ],
      })
    })(),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
  )

  // ===== MÉDECIN =====
  if (formData.medecin_nom || formData.medecin_tel || formData.medecin_date_prescription) {
    // Préfixe "Dr." en dur au rendu Word/PDF. Si l'ortho a déjà saisi
    // "Dr.", "Dr" ou "Docteur" (CRBO legacy ou copie-colle), on évite
    // le doublon. Le nouveau formulaire strip déjà ces préfixes à la
    // saisie (cf. handleMedecinNomChange) — cette logique est ici pour
    // les CRBO antérieurs à la refonte 2026-05.
    const medecinRaw = (formData.medecin_nom || '').trim()
    const medecinAffiche = medecinRaw
      ? (/^(?:dr\.?|docteur)\s+/i.test(medecinRaw) ? medecinRaw : `Dr. ${medecinRaw}`)
      : ''
    // Format date FR : "26/05/2026" depuis "2026-05-26". Tolere absence.
    const datePrescriptionFR = (() => {
      const iso = (formData.medecin_date_prescription || '').trim()
      if (!iso) return ''
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    })()
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Médecin prescripteur', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      (() => {
        const cols = dxaCols([15, 45, 10, 30])
        const rows = [
          new TableRow({ children: [
            createCell('Nom :', { dxa: cols[0] }),
            createCell(medecinAffiche, { dxa: cols[1] }),
            createCell('Tél :', { dxa: cols[2] }),
            createCell(formData.medecin_tel || '', { dxa: cols[3] }),
          ]}),
        ]
        // Ligne supplementaire date de prescription, rendue uniquement si
        // saisie. Les CRBO crees avant 2026-05-26 n'ont pas ce champ → on
        // saute la ligne plutot que d'afficher un "Date :" vide.
        if (datePrescriptionFR) {
          rows.push(new TableRow({ children: [
            createCell('Date prescription :', { dxa: cols[0] }),
            createCell(datePrescriptionFR, { dxa: cols[1] }),
            createCell('', { dxa: cols[2] }),
            createCell('', { dxa: cols[3] }),
          ]}))
        }
        return new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: cols,
          rows,
        })
      })(),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    )
  }

  // ===== MOTIF DE CONSULTATION — SUPPRIMÉ (demande Laurie 2026-05) =====
  // La section "Motif de consultation" / "Objet du bilan" n'est plus
  // rendue dans le CRBO Word/PDF. Le motif reste saisi dans le formulaire
  // et reste utile à l'IA pour informer l'anamnèse rédigée et le
  // diagnostic — mais il n'apparaît plus en section dédiée.
  // Le champ structuré motif_reformule reste produit par la phase 1
  // (extract) et stocké, pour rétro-compat et pour intégration future
  // éventuelle dans l'anamnèse.

  // ===== TESTS =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Tests pratiqués', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
  )
  // Vraie liste a puces Word : 1 bullet par test, l'ortho peut ajouter /
  // retirer / reformater dans Word avec les outils de liste natifs.
  {
    const testArray = Array.isArray(formData.test_utilise)
      ? formData.test_utilise
      : (typeof formData.test_utilise === 'string' && formData.test_utilise.trim()
          ? formData.test_utilise.split(',').map(t => t.trim()).filter(Boolean)
          : [])
    testArray.forEach((t, i) => {
      children.push(new Paragraph({
        numbering: { reference: 'crbo-bullets', level: 0 },
        spacing: { after: i === testArray.length - 1 ? 200 : 60 },
        children: [new TextRun({ text: t, size: FONT_SIZE_NORMAL, font: FONT })],
      }))
    })
  }

  // ===== PAGE 1 RENOUVELLEMENT — Bloc comparatif riche =====
  if (hasStructure && hasPrevious) {
    // Titre section
    children.push(createSectionTitle('🔄 ÉVOLUTION DEPUIS LE DERNIER BILAN'))

    // Sous-titre : dates comparées
    if (previousBilanDate) {
      const prevDate = new Date(previousBilanDate).toLocaleDateString('fr-FR')
      const curDate = bilanDateFormatted || '(actuel)'
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Bilan initial du ${prevDate}  →  Bilan actuel du ${curDate}`, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '666666' })],
        spacing: { after: 200 },
      }))
    }

    // Calcul stats globales d'évolution. Index par cle normalisee (deburred
    // + lower + ponctuation neutralisee) pour que findPrevMatch puisse faire
    // un fuzzy Levenshtein cote lookup. Couvre "Lecture mots" vs "Lecture de
    // mots", "Metaphonologie" vs "Métaphonologie", etc.
    const prevIndex = new Map<string, { percentile: string; value: number; domain: string }>()
    for (const d of orderedPrevDomains) {
      for (const e of d.epreuves) {
        prevIndex.set(normalizeForMatch(e.nom), { percentile: e.percentile, value: e.percentile_value, domain: d.nom })
      }
    }
    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []
    for (const d of orderedDomains) {
      for (const e of d.epreuves) {
        const prev = findPrevMatch(prevIndex, e.nom)
        if (!prev) {
          nouvelles++
          nouvellesList.push(e.nom)
          continue
        }
        const delta = e.percentile_value - prev.value
        if (delta >= 10) { progres++; progresList.push(e.nom) }
        else if (delta <= -10) { regression++; regressionList.push(e.nom) }
        else stable++
      }
    }

    // Badge évolution globale centré
    let badgeText: string, badgeColor: string, badgeBg: string
    if (progres > regression * 2 && progres >= 3) {
      badgeText = `✓ PROGRESSION SIGNIFICATIVE · ${progres} épreuve${progres > 1 ? 's' : ''} en progrès`
      badgeColor = '1B5E20'; badgeBg = 'C8E6C9'
    } else if (regression > progres && regression >= 2) {
      badgeText = `↓ RÉGRESSION OBSERVÉE · ${regression} épreuve${regression > 1 ? 's' : ''} en baisse`
      badgeColor = 'B71C1C'; badgeBg = 'FFCDD2'
    } else {
      badgeText = `≈ PROFIL GLOBALEMENT STABLE · ${progres} progrès · ${stable} stable · ${regression} régression`
      badgeColor = '424242'; badgeBg = 'E0E0E0'
    }
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 },
      children: [new TextRun({
        text: `  ${badgeText}  `,
        bold: true,
        size: FONT_SIZE_NORMAL,
        font: FONT,
        color: badgeColor,
        shading: { type: ShadingType.CLEAR, fill: badgeBg, color: 'auto' },
      } as any)],
    }))

    // Mini-récap : points forts nouveaux + difficultés persistantes
    if (progresList.length > 0) {
      children.push(new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: '🌱 Domaines en progrès :', bold: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '1B5E20' }),
        ],
      }))
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: progresList.slice(0, 8).join(' · '), size: FONT_SIZE_NORMAL - 2, font: FONT, color: '424242' })],
      }))
    }
    if (regressionList.length > 0) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '⚠ Domaines en régression à surveiller :', bold: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: 'B71C1C' }),
        ],
      }))
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: regressionList.slice(0, 8).join(' · '), size: FONT_SIZE_NORMAL - 2, font: FONT, color: '424242' })],
      }))
    }
    if (nouvellesList.length > 0) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '✨ Épreuves ajoutées ce bilan :', bold: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '1565C0' }),
        ],
      }))
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: nouvellesList.slice(0, 8).join(' · '), size: FONT_SIZE_NORMAL - 2, font: FONT, color: '424242' })],
      }))
    }

    // Tableau comparatif détaillé (côte à côte, grouppé par domaine)
    const compCols = dxaCols([40, 22, 22, 16])
    const compRows = [
      new TableRow({ children: [
        createCell('Domaine / Épreuve', { bold: true, dxa: compCols[0], shading: 'E8F5E9' }),
        createCell(previousBilanDate ? new Date(previousBilanDate).toLocaleDateString('fr-FR') : 'Précédent', { bold: true, dxa: compCols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell(bilanDateFormatted || 'Actuel', { bold: true, dxa: compCols[2], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell('Δ Évolution', { bold: true, dxa: compCols[3], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
      ]}),
    ]

    for (const d of orderedDomains) {
      // Row domaine (en-tête de groupe)
      compRows.push(new TableRow({ children: [
        new TableCell({
          columnSpan: 4,
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'F1F8E9', color: 'auto' },
          children: [new Paragraph({
            children: [new TextRun({ text: d.nom, bold: true, size: FONT_SIZE_NORMAL - 1, font: FONT, color: COLOR_GREEN })],
          })],
          borders: {
            top:    { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
            left:   { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
            right:  { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
          },
        }),
      ]}))

      for (const e of d.epreuves) {
        const prev = findPrevMatch(prevIndex, e.nom)
        const prevLabel = prev ? fmtCentile(prev.percentile, prev.value) : '—'
        const curLabel = fmtCentile(e.percentile, e.percentile_value)
        let arrow = '→'
        let arrowLabel = 'Stable'
        let arrowColor = '616161'
        if (prev) {
          const delta = e.percentile_value - prev.value
          if (delta >= 10) { arrow = '↑'; arrowLabel = `+${Math.round(delta)}`; arrowColor = '1B5E20' }
          else if (delta <= -10) { arrow = '↓'; arrowLabel = `${Math.round(delta)}`; arrowColor = 'C62828' }
          else { arrow = '→'; arrowLabel = 'Stable'; arrowColor = '616161' }
        } else {
          arrow = '✦'
          arrowLabel = 'Nouvelle'
          arrowColor = '1565C0'
        }
        compRows.push(new TableRow({ children: [
          createCell(`  ${e.nom}`, { dxa: compCols[0] }), // indentation pour voir que c'est une sous-épreuve du domaine
          createCell(prevLabel, { dxa: compCols[1], alignment: AlignmentType.CENTER, shading: prev ? pickSeuil(prev.value, legendType).shading : 'F5F5F5' }),
          createCell(curLabel, { dxa: compCols[2], alignment: AlignmentType.CENTER, shading: pickSeuil(e.percentile_value, legendType).shading }),
          new TableCell({
            width: { size: compCols[3], type: WidthType.DXA },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: arrow + ' ', bold: true, size: FONT_SIZE_NORMAL + 2, font: FONT, color: arrowColor }),
                new TextRun({ text: arrowLabel, bold: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: arrowColor }),
              ],
            })],
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
              left:   { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
              right:  { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
            },
          }),
        ]}))
      }
    }
    children.push(
      new Table({
        width: { size: TOTAL_DXA, type: WidthType.DXA },
        columnWidths: compCols,
        rows: compRows,
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    )
  }

  // ===== SYNTHÈSE VISUELLE PAGE 1 — vue HappyNeuron groupée =====
  // ⚠️ Skip pour les bilans MoCA : le graphique percentile n'a aucun sens pour
  // un screening cognitif /30. Le tableau MoCA dans la section BILAN suffit.
  if (hasStructure && !isMocaOnly) {
    const groups = orderedDomains.map((d) => ({
      name: d.nom,
      bars: d.epreuves.map((e) => ({ label: e.nom, value: e.percentile_value })),
    })).filter((g) => g.bars.length > 0)
    if (groups.length > 0) {
      // Si la conversion canvas→PNG échoue (env serveur, navigateur exotique),
      // on retombe sur un paragraphe texte plutôt que de produire un ImageRun
      // invalide qui ferait échouer l'ouverture Word entière.
      try {
        const recapChart = await generateGroupedBarChart(
          groups,
          'Profil global — percentiles par épreuve',
          480,
        )
        children.push(
          new Paragraph({ children: [new TextRun({ text: 'Synthèse des résultats', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
          imageParagraph(recapChart),
        )
      } catch (err) {
        console.error('[word-export] Échec génération graphique synthèse:', err)
        children.push(
          new Paragraph({ children: [new TextRun({ text: 'Synthèse des résultats', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: '[Graphique non disponible — voir les tableaux détaillés ci-dessous]', size: FONT_SIZE_NORMAL - 2, font: FONT, color: '888888' })],
            spacing: { after: 200 },
          }),
        )
      }
    }
  }

  // ===== ANAMNÈSE — JAMAIS de notes brutes =====
  // Refonte 2026-05 : SUPPRESSION du surlignage bleu pâle des passages
  // édités par l'ortho dans le Word/PDF. Le highlight bleu reste UNIQUEMENT
  // sur la preview HTML côté client (cf. nouveau-crbo/preview/[id]/page.tsx).
  // Le document exporté est propre, sans trace visuelle des édits.
  // pageBreakBefore: force le titre ANAMNESE a demarrer en haut de la
  // page 2 (sans paragraphe vide intermediaire qui creait des pages blanches).
  children.push(createSectionTitle('ANAMNÈSE', { pageBreakBefore: true }))
  const anamneseText = hasStructure && structure!.anamnese_redigee?.trim()
    ? structure!.anamnese_redigee.trim()
    : "[À COMPLÉTER — anamnèse non reformulée par l'IA. Reprenez les notes brutes et rédigez un paragraphe fluide.]"
  anamneseText.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: line.trim(), size: FONT_SIZE_NORMAL, font: FONT })],
        spacing: { after: 100 },
      }))
    }
  })

  // ===== BILAN =====
  children.push(createSectionTitle('BILAN'))

  // Légende — varie selon le type de bilan.
  // MoCA : pas de légende colorée. Le tableau MoCA est dépouillé (Épreuve /
  // Score / Commentaire), aucune zone d'interprétation type Excellent /
  // Fragilité / Difficulté — incohérent pour un screening cognitif /30.
  // EVALEO 6-15 (legendType='evaleo' dans le registry) : grille officielle
  // 7 classes Launay et al. 2018 + textes intro + resume.
  // Autres tests : 6 zones percentiles (SEUILS, refonte 2026-05-ter).
  // `legendType` est calcule en tete de generateCRBOWord (necessaire avant
  // ce bloc pour la coloration cellule du tableau comparatif renouvellement).

  if (isMocaOnly) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: 'Le MoCA est un outil de dépistage rapide des fonctions cognitives. Il ne pose aucun diagnostic — un bilan neuropsychologique approfondi est nécessaire si une atteinte est mise en évidence.',
          size: 18, font: FONT, italics: true, color: '666666',
        })],
        spacing: { before: 200, after: 200 },
      }),
    )
  } else if (legendType === 'evaleo') {
    // ===== Legende EVALEO 6-15 — grille officielle 7 classes =====
    // Source : grille de cotation officielle (image livret de cotation 2018).
    // Reproduit fidelement : 7 colonnes (rouge/orange/3 verts/2 bleus) +
    // ligne classes (1-7) + ligne % population (7/13/18/24/18/13/7) +
    // ligne centiles (<7 / 7-20 / 21-38 / 39-62 / 63-80 / 81-93 / >93) +
    // bandeau "Normalite — 60% de la population" sur les classes 3-4-5.
    const EVALEO_CLASSES: Array<{ classe: string; pop: string; centiles: string; shading: string; textColor?: string }> = [
      { classe: '1', pop: '7%',  centiles: 'Centiles <7', shading: 'D32F2F', textColor: 'FFFFFF' }, // rouge
      { classe: '2', pop: '13%', centiles: '7-20',        shading: 'F57C00', textColor: 'FFFFFF' }, // orange
      { classe: '3', pop: '18%', centiles: '21-38',       shading: 'A5D6A7' }, // vert clair
      { classe: '4', pop: '24%', centiles: '39-62',       shading: '66BB6A', textColor: 'FFFFFF' }, // vert moyen
      { classe: '5', pop: '18%', centiles: '63-80',       shading: '2E7D32', textColor: 'FFFFFF' }, // vert fonce
      { classe: '6', pop: '13%', centiles: '81-93',       shading: '4FC3F7' }, // bleu clair
      { classe: '7', pop: '7%',  centiles: '>93',         shading: '0288D1', textColor: 'FFFFFF' }, // bleu fonce
    ]
    const eqCols = dxaCols(EVALEO_CLASSES.map(() => 100 / EVALEO_CLASSES.length))
    children.push(
      // Texte d'introduction au-dessus
      new Paragraph({
        children: [new TextRun({
          text: 'Les épreuves sont issues de la batterie EVALEO 6-15 (Launay, Maeder, Roustit, Touzin, 2018). L\'analyse des résultats repose sur un étalonnage en sept classes, correspondant à ce qui est habituellement mis en évidence dans la littérature.',
          size: 18, font: FONT, italics: true, color: '424242',
        })],
        spacing: { before: 200, after: 120 },
      }),
      // Bandeau "Normalite" — span sur les colonnes 3-4-5 (indices 2-4)
      // implementé via une ligne separee avec 3 cellules : vide(1+2),
      // "Normalite"(3+4+5), vide(6+7). columnSpan permet le merge.
      new Table({
        width: { size: TOTAL_DXA, type: WidthType.DXA },
        columnWidths: eqCols,
        rows: [
          new TableRow({ children: [
            new TableCell({ columnSpan: 2, width: { size: eqCols[0] + eqCols[1], type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
            new TableCell({
              columnSpan: 3,
              width: { size: eqCols[2] + eqCols[3] + eqCols[4], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Normalité', bold: true, size: 18, font: FONT, color: '424242' })],
              })],
              borders: {
                top:    { style: BorderStyle.SINGLE, size: 8, color: '424242' },
                left:   { style: BorderStyle.SINGLE, size: 8, color: '424242' },
                right:  { style: BorderStyle.SINGLE, size: 8, color: '424242' },
                bottom: { style: BorderStyle.NONE,   size: 0, color: 'auto' },
              },
            }),
            new TableCell({ columnSpan: 2, width: { size: eqCols[5] + eqCols[6], type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
          ]}),
          // Ligne 1 : numero de classe (1 a 7) sur fond couleur
          new TableRow({ children: EVALEO_CLASSES.map((c, i) =>
            createCell(c.classe, { shading: c.shading, textColor: c.textColor, dxa: eqCols[i], alignment: AlignmentType.CENTER, bold: true }),
          )}),
          // Ligne 2 : pourcentage de population
          new TableRow({ children: EVALEO_CLASSES.map((c, i) =>
            createCell(c.pop, { dxa: eqCols[i], alignment: AlignmentType.CENTER }),
          )}),
          // Ligne 3 : centiles
          new TableRow({ children: EVALEO_CLASSES.map((c, i) =>
            createCell(c.centiles, { dxa: eqCols[i], alignment: AlignmentType.CENTER }),
          )}),
          // Ligne 4 : bandeau "60% de la population" englobant 3-4-5 (toujours
          // span 3 sur 7 colonnes via 3 cellules : vide(1+2), label(3+4+5),
          // vide(6+7)).
          new TableRow({ children: [
            new TableCell({ columnSpan: 2, width: { size: eqCols[0] + eqCols[1], type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
            new TableCell({
              columnSpan: 3,
              width: { size: eqCols[2] + eqCols[3] + eqCols[4], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '60 % de la population', italics: true, size: 16, font: FONT, color: '424242' })],
              })],
              borders: {
                top:    { style: BorderStyle.NONE,   size: 0, color: 'auto' },
                left:   { style: BorderStyle.SINGLE, size: 8, color: '424242' },
                right:  { style: BorderStyle.SINGLE, size: 8, color: '424242' },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: '424242' },
              },
            }),
            new TableCell({ columnSpan: 2, width: { size: eqCols[5] + eqCols[6], type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
          ]}),
        ],
      }),
      // Texte de resume en dessous (5 lignes, listes a puces invisibles)
      new Paragraph({
        children: [new TextRun({ text: 'Classe 1 = zone pathologique', size: 18, font: FONT })],
        spacing: { before: 160, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Classe 2 = zone à risque, « fragilité »', size: 18, font: FONT })],
        spacing: { before: 0, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Classes 3 - 4 - 5 = norme (représentant 60 % de la population)', size: 18, font: FONT })],
        spacing: { before: 0, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Classe 6 = zone supérieure à la moyenne', size: 18, font: FONT })],
        spacing: { before: 0, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Classe 7 = zone très supérieure', size: 18, font: FONT })],
        spacing: { before: 0, after: 200 },
      }),
    )
  } else {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Légende des scores (percentiles) :', size: 18, font: FONT, bold: true })], spacing: { before: 200, after: 100 } }),
      (() => {
        const cols = dxaCols(SEUILS.map(() => 100 / SEUILS.length))
        return new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: cols,
          rows: [new TableRow({
            children: SEUILS.map((s, i) =>
              createCell(`${s.longLabel} (${s.range})`, {
                shading: s.shading,
                dxa: cols[i],
                alignment: AlignmentType.CENTER,
                bold: true,
                textColor: s.textColor,
              }),
            ),
          })],
        })
      })(),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    )
  }

  if (hasStructure && isMocaOnly) {
    // ============ Rendu MoCA dédié ============
    // UN MINI-TABLEAU PAR ÉPREUVE (Visuospatial / Mémoire / …), identique au
    // rendu de la page de prévisualisation (resultats/page.tsx). Chaque mini
    // tableau contient :
    //   - une ligne d'en-tête : nom de l'épreuve + score total /Y
    //   - une ligne par sous-item (alternance, cube, horloge contour, …) avec
    //     son sous-score (X/Y)
    //   - le commentaire clinique éditable est rendu en paragraphe sous le
    //     tableau (lisibilité supérieure à une cellule longue qui se fait
    //     écraser en hauteur sur les ligne sub-items).
    // Aucune coloration "Préservé / Fragilisé / Déficitaire" — la MoCA est
    // un screening, pas un test interprété en zones percentiles.
    // Un bandeau Total /30 + sévérité officielle suit l'ensemble des mini-
    // tableaux (calcul agrégé sur toutes les épreuves).

    const allEpreuves = orderedDomains.flatMap(d => d.epreuves)
    const epreuveCols = dxaCols([70, 30])
    let totalObtenu = 0
    let totalMax = 0

    for (const e of allEpreuves) {
      const parsed = parseScoreFraction(e.score)
      if (parsed) {
        totalObtenu += parsed.score
        totalMax += parsed.max
      }
      const scoreCell = parsed ? `${parsed.score}/${parsed.max}` : e.score

      // Mini-tableau de cette épreuve : en-tête (nom + score) + une ligne par
      // sous-item. Toutes les cellules d'en-tête sont teintées E8F5E9 pour
      // matcher la palette MoCA (vert clair).
      const epreuveRows = [
        new TableRow({ children: [
          createCell(e.nom,   { bold: true, dxa: epreuveCols[0], shading: 'E8F5E9' }),
          createCell(scoreCell, { bold: true, dxa: epreuveCols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        ]}),
      ]
      for (const se of e.sous_epreuves ?? []) {
        epreuveRows.push(new TableRow({ children: [
          createCell(`• ${se.nom}`, { dxa: epreuveCols[0] }),
          createCell(se.score,      { dxa: epreuveCols[1], alignment: AlignmentType.CENTER }),
        ]}))
      }

      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: epreuveCols,
          rows: epreuveRows,
        }),
      )

      // Commentaire clinique : rendu en paragraphes sous le tableau pour qu'il
      // respire (il contient deux paragraphes — clinique + "En clair :" pour
      // le patient — voir prompt MoCA). On parse les marqueurs **gras** en
      // alternance de TextRun, et on coupe sur les lignes vides pour séparer
      // les deux paragraphes.
      const commentaire = (e.commentaire || '').trim()
      if (commentaire) {
        const paragraphs = commentaire.split(/\n\s*\n/)
        paragraphs.forEach((para, pIdx) => {
          const text = para.trim()
          if (!text) return
          const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
          const runs = parts.map((p) =>
            p.startsWith('**') && p.endsWith('**')
              ? new TextRun({ text: p.slice(2, -2), bold: true, size: FONT_SIZE_NORMAL, font: FONT })
              : new TextRun({ text: p, size: FONT_SIZE_NORMAL, font: FONT }),
          )
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            children: runs,
            spacing: {
              before: pIdx === 0 ? 80 : 40,
              after: pIdx === paragraphs.length - 1 ? 200 : 60,
            },
          }))
        })
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 160 } }))
      }
    }

    // Bandeau TOTAL — utilise le total parsé des épreuves, normalisé à /30.
    // Si l'IA a saisi un total cohérent (totalMax === 30) on l'utilise tel
    // quel. Sinon on tente une lecture depuis resultats_manuels (qui contient
    // "TOTAL CORRIGÉ : X/30" écrit par MocaScoresInput).
    let totalForBadge: number | null = null
    if (totalMax === 30) {
      totalForBadge = totalObtenu
    } else if (formData.resultats_manuels) {
      const m = formData.resultats_manuels.match(/TOTAL\s+(?:CORRIG[ÉE]|MoCA)?\s*:?\s*(\d+)\s*\/\s*30/i)
      if (m) totalForBadge = parseInt(m[1], 10)
    }
    if (totalForBadge !== null) {
      const sev = mocaSeverity(totalForBadge)
      const totalCols = dxaCols([55, 20, 25])
      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: totalCols,
          rows: [
            new TableRow({ children: [
              createCell('TOTAL MoCA',           { bold: true, dxa: totalCols[0], shading: 'E8F5E9' }),
              createCell(`${totalForBadge} / 30`, { bold: true, dxa: totalCols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
              createCell(sev.label,               { bold: true, dxa: totalCols[2], shading: sev.shading, textColor: sev.textColor, alignment: AlignmentType.CENTER }),
            ]}),
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
      )
    }

    // En MoCA, les commentaires sont au niveau de chaque épreuve (rendus
    // dans la colonne "Commentaire" du tableau). On NE rend PAS le
    // domain.commentaire global pour éviter de dupliquer une synthèse qui
    // appartient à la section "Hypothèse de diagnostic" en aval.
  } else if (hasStructure) {
    for (const domain of orderedDomains) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: domain.nom, bold: true, size: FONT_SIZE_NORMAL + 2, font: FONT, color: COLOR_GREEN })],
          spacing: { before: 300, after: 120 },
        }),
      )
      // Proportions imposées Laurie : épreuve 45 / score 15 / É-T 12 / centile 13 / interprétation 15
      // Variante EVALEO (hideEcartTypeColumn) : 4 colonnes, on redistribue les 12% de É-T
      // sur Épreuve / Centile / Interprétation.
      const cols = hideEcartTypeColumn
        ? dxaCols([50, 17, 15, 18])
        : dxaCols([45, 15, 12, 13, 15])
      const headerCells = hideEcartTypeColumn
        ? [
            createCell('Épreuve', { bold: true, dxa: cols[0], shading: 'E8F5E9' }),
            createCell('Score', { bold: true, dxa: cols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
            createCell('Centile', { bold: true, dxa: cols[2], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
            createCell('Interprétation', { bold: true, dxa: cols[3], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          ]
        : [
            createCell('Épreuve', { bold: true, dxa: cols[0], shading: 'E8F5E9' }),
            createCell('Score', { bold: true, dxa: cols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
            createCell('É-T', { bold: true, dxa: cols[2], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
            createCell('Centile', { bold: true, dxa: cols[3], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
            createCell('Interprétation', { bold: true, dxa: cols[4], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          ]
      const tableRows = [new TableRow({ children: headerCells })]
      domain.epreuves.forEach((e) => {
        // Palette de coloration cellule : EVALEO (7 classes rouge/orange/
        // verts/bleus) si le test l'impose via registry, sinon defaut Laurie
        // 6 zones. `legendType` est calcule en tete du document.
        const seuil = pickSeuil(e.percentile_value, legendType)
        // Cellules épreuve / score / É-T : pas de fond coloré (sobre).
        // Centile et Interprétation : fond couleur de la zone + texte adapté.
        // Interprétation : si Claude a écrit un label custom dans `e.interpretation`
        // (typiquement pour les bilans qui n'utilisent pas la nomenclature 6 zones
        // Laurie — EVALEO 7 classes, MoCA 3 zones, etc.), on l'affiche tel quel.
        // Sinon fallback sur le label par défaut de la grille 6 zones. La couleur
        // de fond reste pilotée par percentile_value pour cohérence visuelle.
        const interpLabel = (typeof e.interpretation === 'string' && e.interpretation.trim())
          ? e.interpretation.trim()
          : seuil.label
        const rowCells = hideEcartTypeColumn
          ? [
              createCell(e.nom, { dxa: cols[0] }),
              createCell(e.score, { dxa: cols[1], alignment: AlignmentType.CENTER }),
              createCell(fmtCentile(e.percentile, e.percentile_value), { dxa: cols[2], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
              createCell(interpLabel, { dxa: cols[3], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
            ]
          : [
              createCell(e.nom, { dxa: cols[0] }),
              createCell(e.score, { dxa: cols[1], alignment: AlignmentType.CENTER }),
              createCell(e.et ?? '—', { dxa: cols[2], alignment: AlignmentType.CENTER }),
              createCell(fmtCentile(e.percentile, e.percentile_value), { dxa: cols[3], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
              createCell(interpLabel, { dxa: cols[4], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
            ]
        tableRows.push(new TableRow({ children: rowCells }))
      })
      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: cols,
          rows: tableRows,
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
      )

      if (!hideDomainCommentaire && domain.commentaire && domain.commentaire.trim()) {
        // Strip d'éventuels lead-ins parasites générés par l'IA :
        // "**Observations cliniques :**", "Observations cliniques :",
        // "Observation clinique :"… (avec ou sans markdown bold).
        const cleaned = domain.commentaire
          .trim()
          .replace(/^\**\s*observations?\s+cliniques?\s*:\s*\**\s*/i, '')
          .trim()
        children.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: cleaned, size: FONT_SIZE_NORMAL, font: FONT }),
          ],
        }))
      }

      // Paragraphes dédiés par épreuve "en dessous de la médiane" (P < 50)
      // — demande Laurie 2026-05 : pour chaque sous-épreuve dans le rouge
      // (P < 50), afficher un paragraphe spécifique avec le commentaire
      // clinique de l'IA. Format : « **Nom épreuve** — commentaire ».
      // Le commentaire est rempli par l'IA en phase d'extraction quand
      // percentile_value < 50 (cf. system-base.ts).
      //
      // EXCEPTION `showAllEpreuveComments` (EVALEO 6-15) : le filtre P<50 est
      // levé pour ce bilan — toutes les épreuves avec un commentaire non vide
      // remontent, y compris en zone de norme. Cf. retour Cindy 2026-06 sur
      // les observations type "elle saute des lignes" qui se perdaient.
      const epreuvesAvecCommentaire = domain.epreuves.filter(
        (e) => e.commentaire
          && e.commentaire.trim().length > 0
          && (showAllEpreuveComments
            || (typeof e.percentile_value === 'number' && e.percentile_value < 50)),
      )
      for (const e of epreuvesAvecCommentaire) {
        const epCleaned = (e.commentaire || '')
          .trim()
          .replace(/^\**\s*observations?\s+cliniques?\s*:\s*\**\s*/i, '')
          .trim()
        children.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 160 },
          children: [
            new TextRun({ text: `${e.nom} — `, size: FONT_SIZE_NORMAL, font: FONT, bold: true }),
            new TextRun({ text: epCleaned, size: FONT_SIZE_NORMAL, font: FONT }),
          ],
        }))
      }
    }
  } else if (formData.resultats_manuels) {
    // Fallback parsing texte
    const lines = formData.resultats_manuels.split('\n').filter((l) => l.trim())
    if (lines.length > 0) {
      const cols = dxaCols([50, 20, 15, 15])
      const tableRows = [
        new TableRow({ children: [
          createCell('Épreuve', { bold: true, dxa: cols[0], shading: 'E8F5E9' }),
          createCell('Score', { bold: true, dxa: cols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('É-T', { bold: true, dxa: cols[2], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Centile', { bold: true, dxa: cols[3], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        ]}),
      ]
      lines.forEach((line) => {
        const parts = line.split(/[,:]/).map(p => p.trim())
        const epreuve = parts[0] || line
        const score = parts[1] || ''
        const etMatch = line.match(/É-T\s*:\s*([-\d.]+)/i) || line.match(/([-]\d+\.?\d*)/)
        const et = etMatch ? etMatch[1] : ''
        // Centile : on accepte "P25", "centile: 25", ou les quartiles Q1/Med/Q3
        // qu'on reconvertit en P25/P50/P75 pour homogénéité d'affichage.
        let centile = ''
        let pVal = 100
        const pMatch = line.match(/P(\d+)/i) || line.match(/centile\s*:\s*(\d+)/i)
        if (pMatch) {
          pVal = parseInt(pMatch[1], 10)
          centile = `P${pVal}`
        } else {
          const qMatch = line.match(/\b(Q1|Med|Q2|Q3)\b/i)
          if (qMatch) {
            const q = qMatch[1].toUpperCase()
            pVal = q === 'Q1' ? 25 : q === 'Q3' ? 75 : 50
            centile = `P${pVal}`
          }
        }
        const color = getPercentileColor(pVal)
        tableRows.push(new TableRow({ children: [
          createCell(epreuve, { dxa: cols[0] }),
          createCell(score, { dxa: cols[1], alignment: AlignmentType.CENTER }),
          createCell(et, { dxa: cols[2], alignment: AlignmentType.CENTER }),
          createCell(centile, { dxa: cols[3], alignment: AlignmentType.CENTER, shading: color }),
        ]}))
      })
      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: cols,
          rows: tableRows,
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
      )
    }
  }

  // ===== SYNTHÈSE / CONCLUSIONS =====
  // En format Complet : titre "SYNTHÈSE ET CONCLUSIONS" + Points forts /
  // Difficultés / Diagnostic / Recommandations / Axes / Aménagements scolaires.
  // En format Synthétique (Laurie) : pas de titre wrapper — chaque sous-bloc
  // (DIAGNOSTIC ORTHOPHONIQUE / PROJET THÉRAPEUTIQUE / Aménagements pédagogiques
  // proposés) est une section à part entière au même niveau que ANAMNÈSE/BILAN.
  //
  // Le saut de page vers cette section est porte par pageBreakBefore sur le
  // PREMIER paragraphe pousse ici (consume une seule fois via le helper
  // ci-dessous). Pas de paragraphe vide intermediaire -> evite les pages
  // blanches qui apparaissaient quand le tableau Bilan finissait pile en
  // bas de page.
  let synthesePageBreakUsed = false
  const consumeSynthesePageBreak = (): boolean | undefined => {
    if (synthesePageBreakUsed) return undefined
    synthesePageBreakUsed = true
    return true
  }
  if (!isSynthetique) {
    children.push(createSectionTitle('SYNTHÈSE ET CONCLUSIONS', { pageBreakBefore: consumeSynthesePageBreak() }))
  }
  if (hasStructure) {
    const s = structure!
    // Parse un texte avec marqueurs Markdown **gras** en TextRun[] (alternance bold/normal)
    const parseBoldRuns = (text: string) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
      return parts.map((p) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return new TextRun({ text: p.slice(2, -2), bold: true, size: FONT_SIZE_NORMAL, font: FONT })
        }
        return new TextRun({ text: p, size: FONT_SIZE_NORMAL, font: FONT })
      })
    }
    const pushH3 = (title: string) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: FONT_SIZE_NORMAL + 2, font: FONT, color: COLOR_GREEN })],
        spacing: { before: 200, after: 100 },
      }))
    }
    // Rend un contenu texte avec sous-titres H3, inline bold, listes numérotées,
    // et saut de paragraphe sur ligne vide. Le H3 est détecté que le titre soit seul
    // sur sa ligne OU suivi d'un `:` et de contenu inline (split en titre + paragraphe).
    const renderRichContent = (content: string) => {
      const lines = content.split('\n')
      let lastWasEmpty = true // évite un vide en tête
      lines.forEach((line) => {
        const t = line.trim()
        if (!t) {
          if (!lastWasEmpty) {
            children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 60 } }))
            lastWasEmpty = true
          }
          return
        }
        lastWasEmpty = false
        // Liste numérotée : "1. ", "2)  "
        const numMatch = t.match(/^(\d+)[.)]\s+(.+)$/)
        if (numMatch) {
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            indent: { left: 360 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${numMatch[1]}. `, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN }),
              ...parseBoldRuns(numMatch[2]),
            ],
          }))
          return
        }
        // H3 seul sur sa ligne : `**Titre**` (avec `:` optionnel)
        const h3Alone = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
        if (h3Alone) {
          pushH3(h3Alone[1].trim())
          return
        }
        // H3 inline : `**Titre** : suite du paragraphe...` → split
        const h3Inline = t.match(/^\*\*([^*]+)\*\*\s*[:—-]?\s+(.+)$/)
        if (h3Inline) {
          pushH3(h3Inline[1].trim())
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            children: parseBoldRuns(h3Inline[2].trim()),
            spacing: { after: 80 },
          }))
          return
        }
        children.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          children: parseBoldRuns(t),
          spacing: { after: 80 },
        }))
      })
    }
    const pushBlock = (label: string, content: string, opts: { pageBreakBefore?: boolean } = {}) => {
      children.push(new Paragraph({
        pageBreakBefore: opts.pageBreakBefore,
        children: [new TextRun({ text: label, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN })],
        spacing: { before: 240, after: 80 },
      }))
      renderRichContent(content)
    }
    // ===== POINTS FORTS / DIFFICULTÉS IDENTIFIÉES — SUPPRIMÉES (refonte 2026-05) =====
    // Ces deux sections séparées ont été retirées. Le contenu est désormais
    // intégré dans le \`diagnostic\` via la phrase synthèse imposée :
    // "On notera parmi les points d'appui : … Les principaux axes de
    //  fragilité concernent …".
    //
    // Backward-compat : pour les CRBO LEGACY dont le diagnostic ne contient
    // pas encore la phrase synthèse, on continue à rendre les champs s'ils
    // existent (sinon le contenu serait perdu). Pour les CRBO récents
    // (générés post-refonte), les deux champs valent "" et rien n'est rendu.
    // Points forts / Difficultés identifiées : SUPPRIMÉS définitivement
    // (demande Laurie 2026-05). Ces sections ne sont plus jamais rendues —
    // les CRBO legacy qui les contiennent en DB sont ignorés. La synthèse
    // points d'appui / axes de fragilité est désormais intégrée dans le
    // diagnostic via la phrase "On notera parmi les points d'appui : …".

    // ===== DIAGNOSTIC =====
    // Si les champs structurés points_forts/difficultes ne sont pas présents,
    // s.diagnostic peut contenir l'ancien format avec H3 Markdown — pour
    // backward-compat on rend tel quel via renderRichContent. Sinon le
    // diagnostic est juste le verdict ("trouble spécifique des apprentissages
    // en langage écrit (communément appelé dyslexie-dysorthographie), forme...").
    // Synthétique : section à part entière "DIAGNOSTIC ORTHOPHONIQUE".
    if (s.diagnostic?.trim()) {
      if (isSynthetique) {
        children.push(createSectionTitle('DIAGNOSTIC ORTHOPHONIQUE', { pageBreakBefore: consumeSynthesePageBreak() }))
        renderRichContent(s.diagnostic.trim())
      } else if (isMocaOnly) {
        // MoCA = screening, jamais de diagnostic frontal. Le bloc s'intitule
        // "Hypothèse de diagnostic" pour rappeler le statut non-conclusif et
        // protéger l'ortho juridiquement (la MoCA seule n'autorise aucun
        // diagnostic étiologique de démence / MCI / Alzheimer).
        pushBlock('Hypothèse de diagnostic', s.diagnostic.trim(), { pageBreakBefore: consumeSynthesePageBreak() })
      } else {
        pushBlock('Diagnostic', s.diagnostic.trim(), { pageBreakBefore: consumeSynthesePageBreak() })
      }
    }

    // Synthèse d'évolution (renouvellement)
    // Format imposé Laurie 2026-05 : phrase de synthèse introductive (resume,
    // 1-3 phrases) puis 3 listes de bullets — Progrès / Stagnation /
    // Régression — affichées uniquement si non vides.
    if (s.synthese_evolution) {
      children.push(new Paragraph({
        pageBreakBefore: consumeSynthesePageBreak(),
        children: [new TextRun({ text: "Synthèse d'évolution", bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: '6A1B9A' })],
        spacing: { before: 240, after: 80 },
      }))
      renderRichContent(s.synthese_evolution.resume)

      const evolGroups: Array<{ label: string; items?: string[]; color: string }> = [
        { label: 'Progrès',    items: s.synthese_evolution.domaines_progres,    color: '1B5E20' },
        { label: 'Stagnation', items: s.synthese_evolution.domaines_stagnation, color: '616161' },
        { label: 'Régression', items: s.synthese_evolution.domaines_regression, color: 'C62828' },
      ]
      for (const g of evolGroups) {
        if (!g.items?.length) continue
        children.push(new Paragraph({
          children: [new TextRun({ text: g.label, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: g.color })],
          spacing: { before: 140, after: 60 },
        }))
        for (const it of g.items) {
          if (!it || !it.trim()) continue
          children.push(new Paragraph({
            numbering: { reference: 'crbo-bullets', level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: it.trim(), size: FONT_SIZE_NORMAL, font: FONT })],
          }))
        }
      }
    }

    // ===== PROJET THÉRAPEUTIQUE — SUPPRIMÉ (demande Laurie 2026-05) =====
    // La section "Projet thérapeutique" (clé JSON `recommandations`) n'est
    // plus rendue dans le CRBO final, ni en mode Complet ni en mode
    // Synthétique. Le champ reste produit par l'IA pour rétro-compat
    // (DB existante) mais ignoré au rendu.

    // ===== AXES THÉRAPEUTIQUES =====
    // Max 4 axes, 1 ligne chacun. Précédés d'une phrase introductive
    // (demande Laurie 2026-05) — la phrase remplace la section "Projet
    // thérapeutique" supprimée. Affichée en Complet ET en Synthétique.
    {
      const axes = (s.axes_therapeutiques ?? []).filter(a => a && a.trim().length > 0).slice(0, 4)
      if (axes.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: 'Axes thérapeutiques', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN })],
          spacing: { before: 240, after: 100 },
        }))
        children.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [new TextRun({
            text: 'Au regard des éléments mis en évidence, les axes thérapeutiques privilégiés seraient les suivants :',
            size: FONT_SIZE_NORMAL, font: FONT,
          })],
        }))
        axes.forEach((a) => {
          children.push(new Paragraph({
            numbering: { reference: 'crbo-numbered', level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: a.trim(), size: FONT_SIZE_NORMAL, font: FONT }),
            ],
          }))
        })
      }
    }

    // ===== AMÉNAGEMENTS =====
    // Complet : "Aménagements scolaires conseillés", max 6 bullets.
    // Synthétique : "Aménagements pédagogiques proposés", max 10 bullets.
    // Bullets RIGOUREUSEMENT plain text (aucun gras nulle part) — retour
    // utilisateur 2026-05-26 : l'ancien rendu mettait en gras la partie
    // avant ":" quand un bullet contenait un deux-points, mais pas les
    // autres → effet visuel incoherent (un seul bullet en gras au milieu
    // des autres). Solution : aucun gras conditionnel.
    const papLimit = isSynthetique ? 10 : 6
    const paps = (s.pap_suggestions ?? []).filter(p => p && p.trim().length > 0).slice(0, papLimit)
    // Détecte un patient adulte pour adapter le libellé : la section
    // "Aménagements pédagogiques" / "scolaires" ne convient pas à un adulte
    // en bilan neurodégénératif (BETL, GréMots, PREDIMEM, PrediFex, BIA,
    // BECD, PrediLac). On bascule sur "Aménagements de vie quotidienne et
    // de communication" + phrase introductive adaptée. Critère : classe
    // "adulte" OU age >= 18 (déduit de la DDN). Aligné registry famille
    // 'adulte'.
    const isAdultePatient = (() => {
      const classe = (formData.patient_classe || '').toLowerCase().trim()
      if (classe === 'adulte' || classe === 'adultes' || classe === 'senior') return true
      if (formData.patient_ddn) {
        const ddn = new Date(formData.patient_ddn)
        if (!isNaN(ddn.getTime())) {
          const ref = formData.bilan_date ? new Date(formData.bilan_date) : new Date()
          const ageYears = (ref.getTime() - ddn.getTime()) / (365.25 * 24 * 3600 * 1000)
          if (ageYears >= 18) return true
        }
      }
      return false
    })()
    if (paps.length > 0) {
      const legacyRegex = /^\*\*([^*]+)\*\*\s*[—–-]\s*(.+)$/
      const titleSyntheAdulte = 'Aménagements de vie quotidienne et de communication'
      const titleSyntheEnfant = 'Aménagements pédagogiques proposés'
      const titleCompletEnfant = 'Aménagements scolaires conseillés'
      const sectionTitle = isAdultePatient
        ? titleSyntheAdulte
        : (isSynthetique ? titleSyntheEnfant : titleCompletEnfant)
      const introPhraseAdulte = "Des aménagements de vie quotidienne et de communication de ce type pourraient être mis en place pour soutenir l'autonomie et limiter l'impact des troubles dans les interactions familiales, sociales et professionnelles."
      const introPhraseEnfant = "Des aménagements pédagogiques de ce type pourraient être mis en place pour limiter l'impact des troubles en situation scolaire."
      const introPhrase = isAdultePatient ? introPhraseAdulte : introPhraseEnfant
      children.push(new Paragraph({
        children: [new TextRun({
          text: sectionTitle,
          bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN,
        })],
        spacing: { before: 240, after: 100 },
      }))
      // Phrase introductive imposée Laurie (2026-05) avant les bullets ;
      // adaptée à l'adulte si patient_classe='adulte' ou âge ≥ 18 ans.
      children.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { after: 120 },
        children: [new TextRun({
          text: introPhrase,
          size: FONT_SIZE_NORMAL, font: FONT,
        })],
      }))
      for (const p of paps) {
        // Strip d'un eventuel prefixe markdown "**Categorie** — description"
        // (cas legacy ou si l'IA respecte mal le prompt) : on aplatit en
        // "Categorie : description" en texte normal.
        const legacy = p.trim().match(legacyRegex)
        const detail = legacy ? `${legacy[1].trim()} : ${legacy[2].trim()}` : p.trim()
        // Synthetique : si "Categorie : description" (prefixe court sans
        // espace en bout = mot unique), on strip le prefixe pour ne garder
        // que la description (forme synthetique = phrase a l'infinitif).
        let display = detail
        if (isSynthetique) {
          const colonIdx = detail.indexOf(':')
          const head = colonIdx >= 0 ? detail.slice(0, colonIdx).trim() : ''
          const tail = colonIdx >= 0 ? detail.slice(colonIdx + 1).trim() : detail
          const looksLikeCategory = head.length > 0 && head.length <= 30 && !/\s/.test(head.split(' ').slice(-1)[0])
          if (looksLikeCategory) display = tail
        }
        // Plain text, sans gras nulle part, en vraie liste a puces Word
        // native (numbering.reference) pour que l'ortho puisse editer la
        // liste avec les outils Word standards (Tab/Maj+Tab, retour ligne).
        children.push(new Paragraph({
          numbering: { reference: 'crbo-bullets', level: 0 },
          spacing: { after: 50 },
          children: [new TextRun({ text: display, size: FONT_SIZE_NORMAL, font: FONT })],
        }))
      }
    }

    // ===== BILANS COMPLÉMENTAIRES SUGGÉRÉS =====
    // Section CONDITIONNELLE : rendue uniquement si le LLM a identifié au
    // moins une orientation pluridisciplinaire pertinente (TDAH suspecté,
    // empan envers déficitaire, leximétrie sans bilan visuel récent, etc.).
    // Format identique aux aménagements : titre vert + phrase intro + bullets
    // natifs Word (crbo-bullets) au format "Catégorie : justification".
    // Si tableau vide, rien n'est rendu — on évite de surcharger les CRBO
    // sans comorbidité.
    const bilansComp = (s.bilans_complementaires ?? [])
      .filter(b => b && b.trim().length > 0)
      .slice(0, 4)
    if (bilansComp.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: 'Bilans complémentaires suggérés',
          bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN,
        })],
        spacing: { before: 240, after: 100 },
      }))
      children.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { after: 120 },
        children: [new TextRun({
          text: "Au regard du tableau clinique, les bilans complémentaires suivants pourraient être proposés en complément de la prise en charge orthophonique :",
          size: FONT_SIZE_NORMAL, font: FONT,
        })],
      }))
      const legacyRegex = /^\*\*([^*]+)\*\*\s*[—–-]\s*(.+)$/
      for (const b of bilansComp) {
        // Strip eventuel prefixe markdown "**Categorie** — desc" et aplatit
        // en "Categorie : desc" texte normal (parité avec pap_suggestions).
        const legacy = b.trim().match(legacyRegex)
        const display = legacy ? `${legacy[1].trim()} : ${legacy[2].trim()}` : b.trim()
        children.push(new Paragraph({
          numbering: { reference: 'crbo-bullets', level: 0 },
          spacing: { after: 50 },
          children: [new TextRun({ text: display, size: FONT_SIZE_NORMAL, font: FONT })],
        }))
      }
    }
  } else {
    fallbackCRBO.split('\n').forEach((line) => {
      const t = line.trim()
      if (!t) { children.push(new Paragraph({ children: [new TextRun({ text: '' })] })); return }
      const isHeader = /^[A-ZÉÈÀÊÂÎÔÛÇ\s]+:?$/.test(t) && t.length < 50
      children.push(new Paragraph({
        alignment: isHeader ? AlignmentType.LEFT : AlignmentType.BOTH,
        children: [new TextRun({
          text: t,
          size: FONT_SIZE_NORMAL,
          font: FONT,
          bold: isHeader,
          color: isHeader ? COLOR_GREEN : undefined,
        })],
        spacing: { after: isHeader ? 100 : 60 },
      }))
    })
  }

  // ===== SIGNATURE =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: '' })] }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `Fait à ${formData.ortho_ville || ''}, le ${bilanDateFormatted}`, size: FONT_SIZE_NORMAL, font: FONT })],
      spacing: { before: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: formData.ortho_nom || '', size: FONT_SIZE_NORMAL, font: FONT, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Orthophoniste', size: FONT_SIZE_NORMAL, font: FONT })],
    }),
  )

  // ===== LÉGENDE PASSAGES ÉDITÉS — SUPPRIMÉE (refonte 2026-05) =====
  // L'ancienne mini-légende bleue qui signalait au médecin prescripteur les
  // passages relus/édités par l'ortho a été retirée du Word et du PDF. Le
  // surlignage bleu reste UNIQUEMENT sur la preview HTML côté client pour
  // que l'ortho voie ses propres édits — le document exporté est propre.

  // ===== CONCLUSION =====
  // Refonte 2026-06-05 : la conclusion peut contenir 1 ou 2 paragraphes
  // séparés par \n\n. Paragraphe 1 (optionnel) = phrase AMO (nomenclature
  // 8.4 / 9.4 / 11.7). Paragraphe 2 (obligatoire) = formule médico-légale
  // standard. Les bilans adulte n'ont qu'un seul paragraphe (juridique).
  //
  // Stylage :
  //  - AMO : taille normale, gauche, non-italique (lisible par le médecin).
  //  - Formule juridique : italique petit gris centré (règle Laurie : seul
  //    endroit du Word avec italique).
  if (hasStructure && structure!.conclusion?.trim()) {
    const conclusionText = structure!.conclusion.trim()
    const parts = conclusionText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    // Heuristique : si la dernière partie contient "remis en main propre"
    // (formule juridique standard), elle est rendue en italique centré ;
    // les autres parties (typiquement la phrase AMO) en style normal.
    const legalIdx = parts.findIndex((p) => /remis en main propre|servir et faire valoir/i.test(p))
    const legalText = legalIdx >= 0 ? parts[legalIdx] : parts[parts.length - 1]
    const otherParts = parts.filter((_, i) => i !== (legalIdx >= 0 ? legalIdx : parts.length - 1))

    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
    // Paragraphes "normaux" (AMO ou autres mentions cliniques) avant la formule.
    for (const p of otherParts) {
      children.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: p, size: FONT_SIZE_NORMAL, font: FONT })],
      }))
    }
    // Formule médico-légale standard : italique petit gris centré.
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: otherParts.length > 0 ? 300 : 600 },
      children: [new TextRun({
        text: legalText,
        size: 16,
        font: FONT,
        italics: true,
        color: '707070',
      })],
    }))
  }

  // ===== MENTION CONFIDENTIALITE (italique, fin de document) =====
  // Affichee SYSTEMATIQUEMENT sur tous les CRBO (initial, renouvellement,
  // tous bilans confondus). Formulation officielle reprise des CRBO de
  // reference (Justine Peyre, Anne Frouard) — secret medical + diffusion
  // controlee aux seuls responsables legaux et medecin prescripteur.
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 0 },
      children: [new TextRun({
        text: "Document confidentiel soumis au secret médical et légalement réservé en lecture aux seuls responsables légaux et médecin prescripteur, qui en contrôlent la diffusion et l'usage.",
        size: 16,
        font: FONT,
        italics: true,
        color: '707070',
      })],
    }),
  )

  const doc = new Document({
    // Numbering : 2 styles de listes WORD natives (vrais bullets/numerotation).
    // L'ortho peut donc cliquer-pour-editer ses listes dans Word comme une
    // liste classique (Tab/Maj+Tab pour indenter, retour ligne pour ajouter
    // un item, etc.). Auparavant on rendait des "•" comme caractere texte +
    // espace, ce qui empechait Word de reconnaitre le bloc comme une liste.
    numbering: {
      config: [
        {
          reference: 'crbo-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'crbo-numbered',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          // A4 explicite : 11906 × 16838 DXA. Sans size, certaines versions Word
          // interprètent la page comme Letter et déclenchent un avertissement
          // "le document a été enregistré dans un format différent".
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  })

  return await Packer.toBlob(doc)
}

// --------------------- Helper save côté client ---------------------

export async function downloadCRBOWord(payload: WordExportPayload): Promise<void> {
  const blob = await generateCRBOWord(payload)
  const fileSaver = await import('file-saver')
  const saveAs = fileSaver.default || fileSaver.saveAs
  saveAs(blob, buildCRBOFilename(payload.formData))
}

/**
 * Format : `CRBO - NOM Prénom - 25 avril 2026.docx`
 *  - Nom en MAJUSCULES
 *  - Prénom en title-case (gère les composés "Marie-Claire", "Jean Pierre")
 *  - Date du bilan en français long (fallback sur aujourd'hui)
 */
export function buildCRBOFilename(formData: { patient_prenom?: string; patient_nom?: string; bilan_date?: string }): string {
  const nom = (formData.patient_nom || '').trim().toUpperCase()
  const prenom = (formData.patient_prenom || '')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-zà-ÿ])/g, (_m, sep, c) => sep + c.toUpperCase())
  const ref = formData.bilan_date ? new Date(formData.bilan_date) : new Date()
  const dateFr = (isNaN(ref.getTime()) ? new Date() : ref).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return `CRBO - ${nom} ${prenom} - ${dateFr}.docx`
}
