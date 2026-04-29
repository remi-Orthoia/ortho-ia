/**
 * Rendu du graphique HappyNeuron — partagé entre l'export Word et la page de
 * visualisation des résultats. Module client-only (canvas).
 *
 * Hiérarchie visuelle (gauche → droite) :
 *   Famille (Langage oral / Langage écrit / Compétences sous-jacentes)
 *     └── Sous-groupe (= "racine d'épreuve" ex: "Lecture de mots", "Empan auditif")
 *           └── Barre (= modalité ex: "score", "temps", "ratio", "endroit", "envers")
 *
 * Espacements :
 *   - 2 px entre barres d'une même racine (Lecture de mots score/temps/ratio = collées)
 *   - 12 px entre racines d'une même famille
 *   - 24 px + ligne pointillée entre les 3 grandes familles
 *
 * La largeur du canvas est calculée dynamiquement à partir du nombre de barres
 * pour éviter toute coupure à droite. La largeur affichée dans Word est ramenée
 * à TARGET_WORD_WIDTH px par le scaling de imageParagraph.
 */

// --------------------- Palette : zones de performance ---------------------
//
// 6 zones cliniques alignées sur le graphique HappyNeuron officiel.

export type ZoneLabel =
  | 'Excellent résultat'
  | 'Résultat dans la moyenne haute'
  | 'Résultat dans la moyenne basse'
  | 'Zone de fragilité'
  | 'Zone de difficulté'
  | 'Zone de difficulté sévère'

export type ZonePerformance = {
  label: ZoneLabel
  min: number
  css: string
}

/** Couleurs des bandes de fond du graphique (palette pastel imposée Laurie).
 *  La couleur des barres elles-mêmes est plus saturée — voir BAR_FILL_OF_VALUE. */
export const ZONES: ZonePerformance[] = [
  { label: 'Excellent résultat',                min: 76, css: '#C8E6C9' }, // vert clair
  { label: 'Résultat dans la moyenne haute',    min: 51, css: '#DCEDC8' }, // vert très clair
  { label: 'Résultat dans la moyenne basse',    min: 26, css: '#F9FBE7' }, // jaune très clair
  { label: 'Zone de fragilité',                 min: 10, css: '#FFE0B2' }, // orange très clair
  { label: 'Zone de difficulté',                min: 5,  css: '#FFCCBC' }, // orange clair
  { label: 'Zone de difficulté sévère',         min: 0,  css: '#D7CCC8' }, // marron clair
]

/** Couleur de remplissage des barres (palette saturée — même que les fonds
 *  cellules tableaux Word). Plus visible que la palette pastel des bandes. */
const BAR_FILL_OF_VALUE = (value: number): string => {
  if (value >= 76) return '#2E7D32' // vert foncé
  if (value >= 51) return '#66BB6A' // vert clair
  if (value >= 26) return '#D4E157' // jaune-vert
  if (value >= 10) return '#FFA726' // orange
  if (value >= 5)  return '#EF6C00' // orange foncé
  return '#4E342E'                  // marron
}

export function zoneFor(value: number): ZonePerformance {
  for (const z of ZONES) if (value >= z.min) return z
  return ZONES[ZONES.length - 1]
}

// --------------------- Familles cliniques ---------------------

export type FamilyKey = 'oral' | 'ecrit' | 'sub'

export const FAMILY_LABEL: Record<FamilyKey, string> = {
  oral: 'Langage oral',
  ecrit: 'Langage écrit',
  sub: 'Compétences sous-jacentes',
}

const FAMILY_ORDER: FamilyKey[] = ['oral', 'ecrit', 'sub']

export function classifyFamily(domainName: string): FamilyKey {
  const n = (domainName || '').toLowerCase().trim()
  const codeMatch = n.match(/^([abc])\s*[.\d]/i)
  if (codeMatch) {
    const c = codeMatch[1].toLowerCase()
    if (c === 'a') return 'oral'
    if (c === 'b') return 'ecrit'
    if (c === 'c') return 'sub'
  }
  if (/m[ée]moire|empan|boucle\s*phon|d[ée]nomination|denomination|visuo|attention|ran\b|traitement\s*visu|inhibition|flexibilit[ée]|s[ée]quentiel/.test(n)) {
    return 'sub'
  }
  if (/lecture|lex[ie]m[ée]trie|orthograph|dict[ée]e|closure|[ée]crit|non[\s\-]*mots?|graph[èe]m|d[ée]chiffrage/.test(n)) {
    return 'ecrit'
  }
  return 'oral'
}

// --------------------- Données du chart ---------------------

export type ChartBar = { label: string; value: number }
export type ChartGroup = { name: string; bars: ChartBar[] }
export type ChartFamily = { key: FamilyKey; name: string; subgroups: ChartGroup[] }

export function regroupIntoFamilies(groups: ChartGroup[]): ChartFamily[] {
  const buckets: Record<FamilyKey, ChartGroup[]> = { oral: [], ecrit: [], sub: [] }
  for (const g of groups) {
    if (!g.bars || g.bars.length === 0) continue
    buckets[classifyFamily(g.name)].push(g)
  }
  const families: ChartFamily[] = []
  for (const k of FAMILY_ORDER) {
    if (buckets[k].length > 0) {
      families.push({ key: k, name: FAMILY_LABEL[k], subgroups: buckets[k] })
    }
  }
  return families
}

// --------------------- Détection de racine d'épreuve ---------------------

/**
 * Extrait la "racine" d'un label d'épreuve pour permettre de regrouper les
 * modalités d'une même épreuve (score, temps, ratio, etc.).
 *
 * Heuristique :
 *  - "(score)" / "(temps)" en fin → strippés
 *  - " — score" / " - temps" / " – ratio" en fin → strippés (séparateurs typographiques)
 *  - Tail tokens connus sans séparateur ("Empan auditif endroit") → strippés
 *
 * Exemples :
 *   "Lecture de mots — score"  → "Lecture de mots"
 *   "Lecture de mots (ratio)"  → "Lecture de mots"
 *   "Empan auditif endroit"    → "Empan auditif"
 *   "Morphologie dérivation score" → "Morphologie dérivation"
 *   "Boucle phonologique"      → "Boucle phonologique"  (pas de modif)
 *   "Fluence phonémique"       → "Fluence phonémique"   (pas de modif)
 */
export function rootOf(label: string): string {
  if (!label) return ''
  let s = label.trim()
  s = s.replace(/\s*\(\s*[^()]+\s*\)\s*$/, '')                       // "(score)" en fin
  s = s.replace(/\s*[—–\-]\s+[A-Za-zÀ-ÿ '\-]+\s*$/, '')              // " — score" en fin
  const TAIL_TOKENS = /\s+(score|temps|ratio|brut|brute|pondéré|pondérée|note pondérée|endroit|envers|phonologie|lexique|grammatical|grammaticale|réponses|erreurs|mots lus|mots lus correctement|note)\s*$/i
  s = s.replace(TAIL_TOKENS, '')
  return s.trim() || label.trim()
}

/** Découpe une liste de barres en sous-groupes consécutifs partageant la même racine. */
function splitByRoot(bars: ChartBar[]): { root: string; bars: ChartBar[] }[] {
  const out: { root: string; bars: ChartBar[] }[] = []
  for (const b of bars) {
    const r = rootOf(b.label)
    const last = out[out.length - 1]
    if (last && last.root === r) last.bars.push(b)
    else out.push({ root: r, bars: [b] })
  }
  return out
}

// --------------------- Constantes de mise en page ---------------------

const PAD_LEFT = 200             // place pour les labels longs des zones gauche
const PAD_RIGHT = 24
const PAD_TOP_BASE = 84
const PAD_BOTTOM_MIN = 44
const LABEL_FONT_PX = 9          // épreuves (vertical) — spec Laurie 9px
const SUBGROUP_TITLE_FONT_PX = 9 // sous-groupes "A.1 …" en italique #546E7A
const SUBGROUP_TITLE_LINE_H = 12
const SUBGROUP_TITLE_MAX_LINES = 2
const FAMILY_TITLE_FONT_PX = 11  // familles "LANGAGE ORAL" en gras vert
const BAR_VALUE_FONT_PX = 8      // valeur "P5" au sommet de chaque barre
const MIN_CHART_AREA_H = 220

const BAR_W = 18                 // largeur fixe de chaque barre (spec Laurie)
const INTRA_ROOT_GAP = 2         // entre barres d'une même racine
const INTER_ROOT_GAP = 10        // entre sous-groupes (racines distinctes)
const INTER_FAMILY_GAP = 24      // entre familles + ligne pointillée

const BASE_CANVAS_WIDTH = 1600

// --------------------- Helpers ---------------------

function wrapTextByWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (ctx.measureText(trimmed).width <= maxWidth) return [trimmed]

  const tokens = trimmed.split(/\s+/)
  if (tokens.length === 1) return [trimmed]
  const lines: string[] = []
  let current = ''
  for (const tok of tokens) {
    const candidate = current ? `${current} ${tok}` : tok
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = tok
      if (lines.length >= maxLines - 1) {
        const idx = tokens.indexOf(tok)
        const rest = tokens.slice(idx).join(' ')
        lines.push(rest)
        return lines
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

// --------------------- Layout absolu ---------------------

type RootLayout = {
  name: string
  bars: { label: string; value: number; x: number }[]
  startX: number
  endX: number
  centerX: number
}
type FamilyLayout = {
  key: FamilyKey
  name: string
  rootGroups: RootLayout[]
  startX: number
  endX: number
  centerX: number
}
type Layout = {
  families: FamilyLayout[]
  totalBars: number
  contentEndX: number
  /** x des séparateurs pointillés entre familles (au milieu du gap) */
  familySeparators: number[]
}

/**
 * Pré-calcule les positions x absolues de chaque barre, sous-groupe et famille.
 * Le rendu (drawHappyNeuronChart) ne fait plus que parcourir cette structure.
 */
function computeLayout(groups: ChartGroup[]): Layout {
  const families = regroupIntoFamilies(groups)
  // Aplatit chaque famille en root-subgroups (on perd la frontière "domaine"
  // au sein de la famille — l'utilisateur ne demande pas de séparation visuelle
  // entre B.1 Lecture et B.2 Orthographe par exemple).
  const flattened = families.map(f => ({
    key: f.key,
    name: f.name,
    rootRaw: f.subgroups.flatMap(sg => splitByRoot(sg.bars)),
  }))

  let cursorX = PAD_LEFT
  const familyLayouts: FamilyLayout[] = []
  const familySeparators: number[] = []
  let totalBars = 0

  for (let fi = 0; fi < flattened.length; fi++) {
    const f = flattened[fi]
    const familyStartX = cursorX
    const rootLayouts: RootLayout[] = []

    for (let gi = 0; gi < f.rootRaw.length; gi++) {
      const rg = f.rootRaw[gi]
      const groupStartX = cursorX
      const barLayouts: { label: string; value: number; x: number }[] = []
      for (let bi = 0; bi < rg.bars.length; bi++) {
        barLayouts.push({ ...rg.bars[bi], x: cursorX })
        totalBars++
        cursorX += BAR_W
        if (bi < rg.bars.length - 1) cursorX += INTRA_ROOT_GAP
      }
      const groupEndX = cursorX
      rootLayouts.push({
        name: rg.root,
        bars: barLayouts,
        startX: groupStartX,
        endX: groupEndX,
        centerX: (groupStartX + groupEndX) / 2,
      })
      if (gi < f.rootRaw.length - 1) cursorX += INTER_ROOT_GAP
    }

    const familyEndX = cursorX
    familyLayouts.push({
      key: f.key,
      name: f.name,
      rootGroups: rootLayouts,
      startX: familyStartX,
      endX: familyEndX,
      centerX: (familyStartX + familyEndX) / 2,
    })

    if (fi < flattened.length - 1) {
      familySeparators.push(cursorX + INTER_FAMILY_GAP / 2)
      cursorX += INTER_FAMILY_GAP
    }
  }

  return { families: familyLayouts, totalBars, contentEndX: cursorX, familySeparators }
}

// --------------------- Dimensions canvas ---------------------

/**
 * Largeur idéale du canvas pour afficher tous les sous-groupes confortablement.
 * = max(BASE_CANVAS_WIDTH, contenu calculé). Le canvas peut donc être plus
 * large que 1600px sur des bilans très chargés (40+ épreuves).
 */
export function computeChartWidth(groups: ChartGroup[]): number {
  const layout = computeLayout(groups)
  const required = layout.contentEndX + PAD_RIGHT
  return Math.max(BASE_CANVAS_WIDTH, required)
}

/**
 * Hauteur idéale du canvas (titre famille + sous-groupes wrappés + zone barres
 * + labels verticaux complets en bas).
 */
export function computeChartHeight(
  width: number,
  groups: ChartGroup[],
  minHeight = 480,
): number {
  if (typeof document === 'undefined') return minHeight
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return minHeight

  ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
  const allLabels = groups.flatMap(g => g.bars.map(b => b.label))
  const maxLabelW = allLabels.reduce(
    (max, t) => Math.max(max, ctx.measureText(t || '').width),
    0,
  )
  const padBottom = Math.ceil(maxLabelW) + PAD_BOTTOM_MIN

  const layout = computeLayout(groups)
  ctx.font = `bold ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  let maxSubLines = 1
  for (const fam of layout.families) {
    for (const rg of fam.rootGroups) {
      const span = Math.max(40, rg.endX - rg.startX)
      const lines = wrapTextByWords(ctx, rg.name, span - 4, SUBGROUP_TITLE_MAX_LINES)
      if (lines.length > maxSubLines) maxSubLines = lines.length
    }
  }
  const padTop = PAD_TOP_BASE + (maxSubLines - 1) * SUBGROUP_TITLE_LINE_H

  return Math.max(minHeight, padTop + MIN_CHART_AREA_H + padBottom)
}

// --------------------- Rendu canvas ---------------------

export function drawHappyNeuronChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groups: ChartGroup[],
  title: string,
): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Titre
  ctx.fillStyle = '#1B5E20'
  ctx.font = 'bold 17px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(title, 16, 26)

  ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
  const allLabels = groups.flatMap(g => g.bars.map(b => b.label))
  const maxLabelW = allLabels.reduce(
    (max, t) => Math.max(max, ctx.measureText(t || '').width),
    0,
  )
  const padBottom = Math.ceil(maxLabelW) + PAD_BOTTOM_MIN

  const layout = computeLayout(groups)

  // Pré-wrap des titres de sous-groupe pour calculer maxSubLines
  ctx.font = `bold ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  const wrappedSubTitles = layout.families.map(fam =>
    fam.rootGroups.map(rg => {
      const span = Math.max(40, rg.endX - rg.startX)
      return wrapTextByWords(ctx, rg.name, span - 4, SUBGROUP_TITLE_MAX_LINES)
    }),
  )
  const maxSubLines = wrappedSubTitles.reduce(
    (m, fLines) => Math.max(m, fLines.reduce((mm, l) => Math.max(mm, l.length), 1)),
    1,
  )
  const padTop = PAD_TOP_BASE + (maxSubLines - 1) * SUBGROUP_TITLE_LINE_H

  const chartH = Math.max(MIN_CHART_AREA_H, height - padTop - padBottom)
  const yFor = (p: number) => padTop + chartH - (p / 100) * chartH

  // Largeur effective du chart pour les bandes de fond et lignes médianes
  const chartLeftX = PAD_LEFT
  const chartRightX = Math.max(layout.contentEndX, width - PAD_RIGHT)
  const chartW = chartRightX - chartLeftX

  // ===== Bandes de fond colorées (zones de performance) =====
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const y0 = yFor(upper)
    const y1 = yFor(z.min)
    ctx.fillStyle = z.css + '33'
    ctx.fillRect(chartLeftX, y0, chartW, y1 - y0)
  }

  // Lignes horizontales fines entre zones
  ctx.strokeStyle = '#BDBDBD'
  ctx.lineWidth = 0.5
  for (let i = 1; i < ZONES.length; i++) {
    const y = yFor(ZONES[i - 1].min)
    ctx.beginPath(); ctx.moveTo(chartLeftX, y); ctx.lineTo(chartRightX, y); ctx.stroke()
  }
  ctx.strokeRect(chartLeftX, padTop, chartW, chartH)

  // Labels de zone à gauche
  // Labels de zone à gauche — couleur saturée (pas le pastel des bandes)
  // sinon le texte est illisible sur le fond clair de la zone gauche.
  ctx.font = '600 10.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const bandTop = yFor(upper)
    const bandBot = yFor(z.min)
    if (bandBot - bandTop < 12) continue
    const mid = (bandTop + bandBot) / 2
    ctx.fillStyle = BAR_FILL_OF_VALUE(z.min === 0 ? 0 : z.min)
    const lines = wrapTextByWords(ctx, z.label, PAD_LEFT - 16, 2)
    if (lines.length === 1) {
      ctx.fillText(lines[0], PAD_LEFT - 8, mid + 4)
    } else {
      const lineH = 12
      const startY = mid - ((lines.length - 1) * lineH) / 2 + 4
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], PAD_LEFT - 8, startY + li * lineH)
      }
    }
  }

  // ===== Médiane (P50) noire =====
  const yMed = yFor(50)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(chartLeftX, yMed); ctx.lineTo(chartRightX, yMed); ctx.stroke()
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Médiane (P50)', chartLeftX + 4, yMed - 3)

  // ===== Seuil d'alerte P7 rouge =====
  const yAlert = yFor(7)
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(chartLeftX, yAlert); ctx.lineTo(chartRightX, yAlert); ctx.stroke()
  ctx.fillStyle = '#C62828'
  ctx.font = 'bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText("Seuil d'alerte (P7)", chartLeftX + 4, yAlert - 3)

  // ===== Séparateurs verticaux pointillés entre familles =====
  for (const sepX of layout.familySeparators) {
    ctx.strokeStyle = '#90A4AE'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(sepX, padTop); ctx.lineTo(sepX, padTop + chartH); ctx.stroke()
    ctx.setLineDash([])
  }

  // ===== Barres + titres =====
  if (layout.totalBars === 0) return

  for (let fi = 0; fi < layout.families.length; fi++) {
    const fam = layout.families[fi]

    // Titre de famille (au-dessus, gras vert MAJUSCULES)
    ctx.fillStyle = '#1B5E20'
    ctx.font = `bold ${FAMILY_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
    ctx.textAlign = 'center'
    const familyTitleY = padTop - (maxSubLines * SUBGROUP_TITLE_LINE_H) - 8
    ctx.fillText(fam.name.toUpperCase(), fam.centerX, familyTitleY)

    for (let gi = 0; gi < fam.rootGroups.length; gi++) {
      const rg = fam.rootGroups[gi]

      // Titre de sous-groupe (italique #546E7A, 9px — spec Laurie)
      const titleLines = wrappedSubTitles[fi][gi]
      if (titleLines && titleLines.length > 0) {
        ctx.fillStyle = '#546E7A'
        ctx.font = `italic ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.textAlign = 'center'
        const baseY = padTop - 6
        for (let li = 0; li < titleLines.length; li++) {
          const yLine = baseY - (titleLines.length - 1 - li) * SUBGROUP_TITLE_LINE_H
          ctx.fillText(titleLines[li], rg.centerX, yLine)
        }
      }

      // Barres
      for (const b of rg.bars) {
        const v = Math.max(0, Math.min(100, b.value))
        const yTop = yFor(v)
        const h = padTop + chartH - yTop

        // Couleur saturée pour la barre (palette tableau Word, plus visible
        // que les bandes pastel de fond).
        ctx.fillStyle = BAR_FILL_OF_VALUE(v)
        ctx.fillRect(b.x, yTop, BAR_W, h)
        ctx.strokeStyle = '#212121'
        ctx.lineWidth = 1
        ctx.strokeRect(b.x, yTop, BAR_W, h)

        // Valeur P au-dessus (8px noir — spec Laurie)
        ctx.fillStyle = '#000000'
        ctx.font = `${BAR_VALUE_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(`P${Math.round(v)}`, b.x + BAR_W / 2, yTop - 3)

        // Label vertical sous la barre — texte intégral, jamais tronqué
        ctx.save()
        ctx.translate(b.x + BAR_W / 2, padTop + chartH + 8)
        ctx.rotate(-Math.PI / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#37474F'
        ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.fillText(b.label, 0, 4)
        ctx.restore()
      }
    }
  }
}

/**
 * Génère un PNG (ArrayBuffer) du graphique pour embarquer dans le Word.
 * Si `width` est omis, calcule la largeur dynamiquement (≥ BASE_CANVAS_WIDTH).
 */
export async function happyNeuronChartToPng(
  groups: ChartGroup[],
  title: string,
  width?: number,
  minHeight = 480,
): Promise<{ data: ArrayBuffer; width: number; height: number }> {
  const canvas = document.createElement('canvas')
  const finalWidth = width ?? computeChartWidth(groups)
  const height = computeChartHeight(finalWidth, groups, minHeight)
  canvas.width = finalWidth
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  drawHappyNeuronChart(ctx, finalWidth, height, groups, title)
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png')!)
  return { data: await blob.arrayBuffer(), width: finalWidth, height }
}
