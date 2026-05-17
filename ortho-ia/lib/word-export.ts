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
// Grille 6 zones alignée sur l'étalonnage Happy Scribe :
//  - P > 75            → Excellent résultat                (vert foncé)
//  - P51 à P75         → Résultat dans la moyenne haute    (vert clair)
//  - P26 à P50         → Résultat dans la moyenne basse    (jaune)
//  - P10 à P25 (Q1)    → Zone de fragilité                 (orange clair)
//  - P6 à P9           → Zone de difficulté                (orange foncé)
//  - P ≤ 5             → Zone de difficulté sévère         (marron)
//
// Note : Q1 (P25) reste en zone de fragilité (pas en moyenne basse) — règle
// clinique Laurie déjà appliquée par l'extraction. min=26 pour la moyenne basse.

// Labels COURTS imposés par Laurie pour la colonne Interprétation des
// 6 labels imposés par Laurie (grille révisée 2026-05). Plus de "Excellent" —
// la zone haute commence à "Moyenne haute" qui couvre toute la moitié haute
// (≥ P51). La nomenclature courte est utilisée partout (tableaux + légende +
// chip UI). Pas de version "longue" (les libellés sont déjà des libellés
// finaux, pas des sous-titres).
export type SeuilLabel =
  | 'Moyenne haute'
  | 'Moyenne'
  | 'Moyenne basse'
  | 'Zone de fragilité'
  | 'Difficulté'
  | 'Difficulté sévère'

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

// Palette imposée Laurie (fonds cellules + couleurs texte si fond foncé) :
//   Moyenne haute      → #2E7D32 fond vert foncé,    texte blanc (P ≥ 51, couvre > P75 et P51-P75)
//   Moyenne            → #66BB6A fond vert clair                  (P26-50)
//   Moyenne basse      → #FBC02D fond jaune                       (P10-25, inclut Q1 = P25)
//   Zone de fragilité  → #FB8C00 fond orange                      (P5-9)
//   Difficulté         → #E65100 fond orange foncé,  texte blanc  (P2-4)
//   Difficulté sévère  → #D32F2F fond rouge vif,     texte blanc  (< P2)
//
// Pour les tableaux Word, on utilise les `shading` (cellule) + `textColor`
// (texte). Pour le graphique chart, voir chart.ts qui a sa propre palette
// pastel pour les bandes de fond.
export const SEUILS: SeuilClinique[] = [
  { label: 'Moyenne haute',      longLabel: 'Moyenne haute',     min: 51, shading: '2E7D32', css: '#1B5E20', textColor: 'FFFFFF', range: 'P ≥ 51' },
  { label: 'Moyenne',            longLabel: 'Moyenne',           min: 26, shading: '66BB6A', css: '#2E7D32', range: 'P26-50' },
  { label: 'Moyenne basse',      longLabel: 'Moyenne basse',     min: 10, shading: 'FBC02D', css: '#F57F17', range: 'P10-25' },
  { label: 'Zone de fragilité',  longLabel: 'Zone de fragilité', min: 5,  shading: 'FB8C00', css: '#E65100', range: 'P5-9' },
  { label: 'Difficulté',         longLabel: 'Difficulté',        min: 2,  shading: 'E65100', css: '#BF360C', textColor: 'FFFFFF', range: 'P2-4' },
  { label: 'Difficulté sévère',  longLabel: 'Difficulté sévère', min: 0,  shading: 'D32F2F', css: '#B71C1C', textColor: 'FFFFFF', range: '< P2' },
]

export function seuilFor(value: number): SeuilClinique {
  for (const s of SEUILS) if (value >= s.min) return s
  return SEUILS[SEUILS.length - 1]
}

/**
 * Mappe les anciens labels d'interprétation (CRBO legacy en DB) vers les
 * nouveaux labels de la grille 6 zones révisée (2026-05). Utilisé au rendu
 * pour assurer la cohérence avec la couleur dérivée de percentile_value.
 *
 * **Refonte 2026-05** : la grille a été déplacée d'un cran "vers le haut" :
 *   - L'ancienne zone "Excellent" (P>75) fusionnée dans "Moyenne haute".
 *   - L'ancienne "Moyenne basse" (P26-50) est devenue "Moyenne".
 *   - L'ancienne "Fragilité" (P10-25) est devenue "Moyenne basse".
 *   - L'ancienne "Difficulté" (P6-9) est devenue "Zone de fragilité".
 *   - L'ancienne "Difficulté sévère" (P≤5) éclatée en "Difficulté" (P2-4)
 *     et "Difficulté sévère" (<P2).
 *
 * Pour les CRBO legacy dont l'interpretation stockée date d'avant la refonte,
 * on remappe à la SÉMANTIQUE actuelle (PAS au label littéral) pour ne pas
 * fausser la couleur du Word. La source de vérité reste `percentile_value` :
 * le Word rendu via `seuilFor(percentile_value)` recalcule toujours la
 * couleur correcte depuis la valeur numérique.
 */
export function normalizeInterpretation(stored: string | undefined): SeuilLabel | undefined {
  if (!stored) return undefined
  switch (stored) {
    // Legacy 4 zones (très anciens CRBO) — heuristique conservative :
    case 'Normal':
    case 'Dans la norme': return 'Moyenne'         // P>25 par défaut
    case 'Limite basse':
    case 'Fragile': return 'Moyenne basse'         // ancien P10-25
    case 'Déficitaire': return 'Zone de fragilité' // ancien P6-9
    case 'Pathologique': return 'Difficulté sévère'
    // Anciens labels longs (CRBO récents avant refonte 2026-05)
    case 'Excellent résultat':
    case 'Excellent': return 'Moyenne haute'       // Excellent fusionné dans Moyenne haute
    case 'Résultat dans la moyenne haute':
    case 'Moyenne haute (legacy P51-75)': return 'Moyenne haute'
    case 'Résultat dans la moyenne basse':
    case 'Moyenne basse (legacy P26-50)': return 'Moyenne' // ancienne "Moyenne basse" = nouvelle "Moyenne"
    case 'Zone de difficulté':
    case 'Fragilité': return 'Moyenne basse'       // ancienne Fragilité (P10-25) = nouvelle Moyenne basse
    case 'Zone de difficulté sévère':
      return 'Difficulté sévère'
    // Labels courts officiels (passthrough — déjà au nouveau format)
    case 'Moyenne haute':
    case 'Moyenne':
    case 'Moyenne basse':
    case 'Zone de fragilité':
    case 'Difficulté':
    case 'Difficulté sévère':
      return stored
    default:
      return undefined
  }
}
export const getPercentileColor = (v: number): string => seuilFor(v).shading
export const getPercentileCssColor = (v: number): string => seuilFor(v).css

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
    patient_prenom: string
    patient_nom: string
    patient_ddn?: string
    patient_classe?: string
    bilan_date?: string
    bilan_type?: string
    medecin_nom?: string
    medecin_tel?: string
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

// --------------------- Générateur principal ---------------------

export async function generateCRBOWord(payload: WordExportPayload): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, PageBreak, ShadingType, ImageRun,
    PageOrientation,
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
  const orderedDomains = hasStructure ? sortDomainsByFamily(structure!.domains) : []
  const orderedPrevDomains = hasPrevious ? sortDomainsByFamily(previousStructure!.domains) : []
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

  const createSectionTitle = (text: string, opts: { centered?: boolean } = {}) => new Paragraph({
    alignment: opts.centered ? AlignmentType.CENTER : AlignmentType.LEFT,
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
  if (formData.medecin_nom || formData.medecin_tel) {
    // Préfixe "Dr." en dur au rendu Word/PDF. Si l'ortho a déjà saisi
    // "Dr.", "Dr" ou "Docteur" (CRBO legacy ou copie-colle), on évite
    // le doublon. Le nouveau formulaire strip déjà ces préfixes à la
    // saisie (cf. handleMedecinNomChange) — cette logique est ici pour
    // les CRBO antérieurs à la refonte 2026-05.
    const medecinRaw = (formData.medecin_nom || '').trim()
    const medecinAffiche = medecinRaw
      ? (/^(?:dr\.?|docteur)\s+/i.test(medecinRaw) ? medecinRaw : `Dr. ${medecinRaw}`)
      : ''
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Médecin prescripteur', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      (() => {
        const cols = dxaCols([15, 45, 10, 30])
        return new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: cols,
          rows: [new TableRow({ children: [
            createCell('Nom :', { dxa: cols[0] }),
            createCell(medecinAffiche, { dxa: cols[1] }),
            createCell('Tél :', { dxa: cols[2] }),
            createCell(formData.medecin_tel || '', { dxa: cols[3] }),
          ]})],
        })
      })(),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    )
  }

  // ===== MOTIF =====
  // Si le LLM a reformulé le motif (champ structuré motif_reformule), on l'utilise
  // en priorité — sinon on retombe sur les notes brutes du formulaire (legacy).
  const motifText = (hasStructure && structure!.motif_reformule?.trim())
    ? structure!.motif_reformule.trim()
    : (formData.motif || '')
  // Edit-set précalculé pour appliquer le shading bleu pâle. Construit
  // une seule fois ici car utilisé dans 3+ sections (motif, anamnèse, domaines).
  const editedSetEarly = new Set(structure?.edited_fields ?? [])
  const motifEdited = editedSetEarly.has('motif_reformule')
  if (motifText) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: isSynthetique ? 'Objet du bilan' : 'Motif de consultation',
          size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true,
        })],
        spacing: { before: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.BOTH,
        shading: motifEdited ? { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' } : undefined,
        children: [new TextRun({ text: motifText, size: FONT_SIZE_NORMAL, font: FONT })],
        spacing: { after: 200 },
      }),
    )
  }

  // ===== TESTS =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Tests pratiqués', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `• ${testsText}`, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 200 } }),
  )

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

    // Calcul stats globales d'évolution
    const prevIndex = new Map<string, { percentile: string; value: number; domain: string }>()
    for (const d of orderedPrevDomains) {
      for (const e of d.epreuves) {
        prevIndex.set(e.nom.toLowerCase().trim(), { percentile: e.percentile, value: e.percentile_value, domain: d.nom })
      }
    }
    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []
    for (const d of orderedDomains) {
      for (const e of d.epreuves) {
        const prev = prevIndex.get(e.nom.toLowerCase().trim())
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
        const prev = prevIndex.get(e.nom.toLowerCase().trim())
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
          createCell(prevLabel, { dxa: compCols[1], alignment: AlignmentType.CENTER, shading: prev ? getPercentileColor(prev.value) : 'F5F5F5' }),
          createCell(curLabel, { dxa: compCols[2], alignment: AlignmentType.CENTER, shading: getPercentileColor(e.percentile_value) }),
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

  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ===== ANAMNÈSE — JAMAIS de notes brutes =====
  // Refonte 2026-05 : SUPPRESSION du surlignage bleu pâle des passages
  // édités par l'ortho dans le Word/PDF. Le highlight bleu reste UNIQUEMENT
  // sur la preview HTML côté client (cf. nouveau-crbo/preview/[id]/page.tsx).
  // Le document exporté est propre, sans trace visuelle des édits.
  children.push(createSectionTitle('ANAMNÈSE'))
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
  // Autres tests : 6 zones percentiles (SEUILS).
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
      const cols = dxaCols([45, 15, 12, 13, 15])
      const tableRows = [
        new TableRow({ children: [
          createCell('Épreuve', { bold: true, dxa: cols[0], shading: 'E8F5E9' }),
          createCell('Score', { bold: true, dxa: cols[1], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('É-T', { bold: true, dxa: cols[2], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Centile', { bold: true, dxa: cols[3], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Interprétation', { bold: true, dxa: cols[4], shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        ]}),
      ]
      domain.epreuves.forEach((e) => {
        const seuil = seuilFor(e.percentile_value)
        // Cellules épreuve / score / É-T : pas de fond coloré (sobre).
        // Centile et Interprétation : fond couleur de la zone + texte adapté.
        tableRows.push(new TableRow({ children: [
          createCell(e.nom, { dxa: cols[0] }),
          createCell(e.score, { dxa: cols[1], alignment: AlignmentType.CENTER }),
          createCell(e.et ?? '—', { dxa: cols[2], alignment: AlignmentType.CENTER }),
          createCell(fmtCentile(e.percentile, e.percentile_value), { dxa: cols[3], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
          createCell(seuil.label, { dxa: cols[4], alignment: AlignmentType.CENTER, shading: seuil.shading, textColor: seuil.textColor, bold: true }),
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

      if (domain.commentaire && domain.commentaire.trim()) {
        // Strip d'éventuels lead-ins parasites générés par l'IA :
        // "**Observations cliniques :**", "Observations cliniques :",
        // "Observation clinique :"… (avec ou sans markdown bold).
        const cleaned = domain.commentaire
          .trim()
          .replace(/^\**\s*observations?\s+cliniques?\s*:\s*\**\s*/i, '')
          .trim()
        const domainCommEdited = editedSetEarly.has(`domain_commentaire:${domain.nom}`)
        children.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          shading: domainCommEdited ? { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' } : undefined,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: cleaned, size: FONT_SIZE_NORMAL, font: FONT }),
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

  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ===== SYNTHÈSE / CONCLUSIONS =====
  // En format Complet : titre "SYNTHÈSE ET CONCLUSIONS" + Points forts /
  // Difficultés / Diagnostic / Recommandations / Axes / Aménagements scolaires.
  // En format Synthétique (Laurie) : pas de titre wrapper — chaque sous-bloc
  // (DIAGNOSTIC ORTHOPHONIQUE / PROJET THÉRAPEUTIQUE / Aménagements pédagogiques
  // proposés) est une section à part entière au même niveau que ANAMNÈSE/BILAN.
  if (!isSynthetique) {
    children.push(createSectionTitle('SYNTHÈSE ET CONCLUSIONS'))
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
    const pushBlock = (label: string, content: string) => {
      children.push(new Paragraph({
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
    if (!isSynthetique && s.points_forts?.trim()) {
      pushBlock('Points forts', s.points_forts.trim())
    }
    if (!isSynthetique && s.difficultes_identifiees?.trim()) {
      pushBlock('Difficultés identifiées', s.difficultes_identifiees.trim())
    }

    // ===== DIAGNOSTIC =====
    // Si les champs structurés points_forts/difficultes ne sont pas présents,
    // s.diagnostic peut contenir l'ancien format avec H3 Markdown — pour
    // backward-compat on rend tel quel via renderRichContent. Sinon le
    // diagnostic est juste le verdict ("trouble spécifique des apprentissages
    // en langage écrit (communément appelé dyslexie-dysorthographie), forme...").
    // Synthétique : section à part entière "DIAGNOSTIC ORTHOPHONIQUE".
    if (s.diagnostic?.trim()) {
      if (isSynthetique) {
        children.push(createSectionTitle('DIAGNOSTIC ORTHOPHONIQUE'))
        renderRichContent(s.diagnostic.trim())
      } else if (isMocaOnly) {
        // MoCA = screening, jamais de diagnostic frontal. Le bloc s'intitule
        // "Hypothèse de diagnostic" pour rappeler le statut non-conclusif et
        // protéger l'ortho juridiquement (la MoCA seule n'autorise aucun
        // diagnostic étiologique de démence / MCI / Alzheimer).
        pushBlock('Hypothèse de diagnostic', s.diagnostic.trim())
      } else {
        pushBlock('Diagnostic', s.diagnostic.trim())
      }
    }

    // Synthèse d'évolution (renouvellement)
    if (s.synthese_evolution) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Synthèse d'évolution", bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: '6A1B9A' })],
        spacing: { before: 240, after: 80 },
      }))
      renderRichContent(s.synthese_evolution.resume)
      if (s.synthese_evolution.domaines_progres?.length) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: 'Progrès : ', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: '1B5E20' }),
            new TextRun({ text: s.synthese_evolution.domaines_progres.join(', '), size: FONT_SIZE_NORMAL, font: FONT }),
          ],
          spacing: { after: 40 },
        }))
      }
      if (s.synthese_evolution.domaines_stagnation?.length) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: 'Stagnation : ', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: '616161' }),
            new TextRun({ text: s.synthese_evolution.domaines_stagnation.join(', '), size: FONT_SIZE_NORMAL, font: FONT }),
          ],
          spacing: { after: 40 },
        }))
      }
      if (s.synthese_evolution.domaines_regression?.length) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: 'Régression : ', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: 'C62828' }),
            new TextRun({ text: s.synthese_evolution.domaines_regression.join(', '), size: FONT_SIZE_NORMAL, font: FONT }),
          ],
          spacing: { after: 40 },
        }))
      }
    }

    // ===== PROJET THÉRAPEUTIQUE (anciennement "Recommandations") =====
    // Refonte 2026-05 : la section est désormais TOUJOURS intitulée "Projet
    // thérapeutique" (Complet ET Synthétique), conformément à la convention
    // Laurie. La clé JSON reste \`recommandations\` pour rétro-compat.
    //   Complet : phrase unique imposée Laurie ("Une prise en charge
    //     orthophonique est recommandée, et en parallèle la mise en place ou
    //     le renforcement des aménagements en classe.") sous header H3.
    //   Synthétique : 2 phrases adaptées au profil (soin + aménagements).
    if (s.recommandations?.trim()) {
      if (isSynthetique) {
        children.push(createSectionTitle('PROJET THÉRAPEUTIQUE'))
        renderRichContent(s.recommandations.trim())
      } else {
        pushBlock('Projet thérapeutique', s.recommandations.trim())
      }
    }

    // ===== AXES THÉRAPEUTIQUES =====
    // Nouveau champ structuré (max 4 axes, 1 ligne chacun). Backward-compat :
    // si absent, l'ancien format embarqué dans s.recommandations est déjà
    // rendu ci-dessus.
    // Synthétique : skip — fusionné dans PROJET THÉRAPEUTIQUE.
    if (!isSynthetique) {
      const axes = (s.axes_therapeutiques ?? []).filter(a => a && a.trim().length > 0).slice(0, 4)
      if (axes.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: 'Axes thérapeutiques', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN })],
          spacing: { before: 240, after: 100 },
        }))
        axes.forEach((a, i) => {
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            indent: { left: 360 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN }),
              new TextRun({ text: a.trim(), size: FONT_SIZE_NORMAL, font: FONT }),
            ],
          }))
        })
      }
    }

    // ===== AMÉNAGEMENTS =====
    // Complet : "Aménagements scolaires conseillés", max 6, format
    //   "Catégorie : description" (catégorie en gras).
    // Synthétique : "Aménagements pédagogiques proposés", max 10, bullets simples
    //   (1 phrase à l'infinitif), sans gras, sans préfixe catégorie.
    const papLimit = isSynthetique ? 10 : 6
    const paps = (s.pap_suggestions ?? []).filter(p => p && p.trim().length > 0).slice(0, papLimit)
    if (paps.length > 0) {
      const legacyRegex = /^\*\*([^*]+)\*\*\s*[—–-]\s*(.+)$/
      children.push(new Paragraph({
        children: [new TextRun({
          text: isSynthetique ? 'Aménagements pédagogiques proposés' : 'Aménagements scolaires conseillés',
          bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN,
        })],
        spacing: { before: 240, after: 100 },
      }))
      for (const p of paps) {
        const legacy = p.trim().match(legacyRegex)
        const detail = legacy ? `${legacy[1].trim()} : ${legacy[2].trim()}` : p.trim()
        if (isSynthetique) {
          // Robustesse : si l'IA laisse fuiter "Catégorie : ..." malgré le prompt
          // (cas legacy ou complet réutilisé), on retire le préfixe avant le " : ".
          // Heuristique : un préfixe de 2-30 chars sans verbe → on le strip.
          const colonIdx = detail.indexOf(':')
          const head = colonIdx >= 0 ? detail.slice(0, colonIdx).trim() : ''
          const tail = colonIdx >= 0 ? detail.slice(colonIdx + 1).trim() : detail
          const looksLikeCategory = head.length > 0 && head.length <= 30 && !/\s/.test(head.split(' ').slice(-1)[0])
          const cleanItem = looksLikeCategory ? tail : detail
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            indent: { left: 360 },
            spacing: { after: 50 },
            children: [new TextRun({ text: `• ${cleanItem}`, size: FONT_SIZE_NORMAL, font: FONT })],
          }))
        } else {
          const colonIdx = detail.indexOf(':')
          const runs = colonIdx >= 0
            ? [
                new TextRun({ text: `• ${detail.slice(0, colonIdx + 1)} `, bold: true, size: FONT_SIZE_NORMAL, font: FONT }),
                new TextRun({ text: detail.slice(colonIdx + 1).trimStart(), size: FONT_SIZE_NORMAL, font: FONT }),
              ]
            : [new TextRun({ text: `• ${detail}`, size: FONT_SIZE_NORMAL, font: FONT })]
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH,
            indent: { left: 360 },
            spacing: { after: 50 },
            children: runs,
          }))
        }
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

  // ===== CONCLUSION (mention médico-légale, petit italique, en bas) =====
  // Règle Laurie : c'est le SEUL endroit du Word avec de l'italique.
  if (hasStructure && structure!.conclusion?.trim()) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [new TextRun({
          text: structure!.conclusion.trim(),
          size: 16,
          font: FONT,
          italics: true,
          color: '707070',
        })],
      }),
    )
  }

  const doc = new Document({
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
