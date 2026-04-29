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
const SUBGROUP_LEVEL_SPACING = SUBGROUP_TITLE_MAX_LINES * SUBGROUP_TITLE_LINE_H + 4
const FAMILY_TITLE_FONT_PX = 11  // familles "LANGAGE ORAL" en gras vert
const BAR_VALUE_FONT_PX = 8      // valeur "P5" au sommet de chaque barre
const MIN_CHART_AREA_H = 220

const BAR_W = 18                 // largeur fixe de chaque barre (spec Laurie)
const INTRA_ROOT_GAP = 2         // entre barres d'une même racine
const INTER_ROOT_GAP = 10        // entre sous-groupes (racines distinctes)
const INTER_FAMILY_GAP = 24      // entre familles + ligne pointillée

// Plus de largeur minimale fixée : computeChartWidth retourne uniquement
// ce qui est nécessaire pour les barres + paddings. Évite l'espace vide
// à droite quand le bilan a peu d'épreuves.

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
 *
 * IMPORTANT — élargissement des familles pour titres longs :
 *   "COMPÉTENCES SOUS-JACENTES" est plus large qu'un sous-groupe de 2-3 barres.
 *   Sans pad, le titre déborde / est tronqué. On mesure chaque titre, et on
 *   pad la famille (left+right symétrique) pour que son span ≥ titre + 14px.
 *   Les barres restent centrées dans leur famille, le canvas s'élargit juste
 *   ce qu'il faut.
 */
const FAMILY_TITLE_HORIZONTAL_PAD = 14

function measureFamilyTitle(name: string): number {
  if (typeof document === 'undefined') {
    // Estimation conservatrice : ~7 px par caractère majuscule pour 11px bold.
    return Math.ceil(name.toUpperCase().length * 7)
  }
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  if (!ctx) return Math.ceil(name.toUpperCase().length * 7)
  ctx.font = `bold ${FAMILY_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  return Math.ceil(ctx.measureText(name.toUpperCase()).width)
}

function computeLayout(groups: ChartGroup[]): Layout {
  const families = regroupIntoFamilies(groups)
  // Aplatit chaque famille en root-subgroups.
  const flattened = families.map(f => ({
    key: f.key,
    name: f.name,
    rootRaw: f.subgroups.flatMap(sg => splitByRoot(sg.bars)),
  }))

  // Pré-calcul des largeurs : contenu de chaque famille (barres + intra-gaps)
  // et largeur du titre famille (mesurée).
  const familyContentWidths = flattened.map(f => {
    const rootSpans = f.rootRaw.map(rg =>
      rg.bars.length * BAR_W + Math.max(0, rg.bars.length - 1) * INTRA_ROOT_GAP,
    )
    const innerGaps = Math.max(0, f.rootRaw.length - 1) * INTER_ROOT_GAP
    return rootSpans.reduce((a, b) => a + b, 0) + innerGaps
  })
  const familyTitleWidths = flattened.map(f => measureFamilyTitle(f.name))
  // Span effectif = max(contenu, titre + pad horizontal).
  const familyTargetSpans = flattened.map((_, fi) =>
    Math.max(familyContentWidths[fi], familyTitleWidths[fi] + FAMILY_TITLE_HORIZONTAL_PAD),
  )

  let cursorX = PAD_LEFT
  const familyLayouts: FamilyLayout[] = []
  const familySeparators: number[] = []
  let totalBars = 0

  for (let fi = 0; fi < flattened.length; fi++) {
    const f = flattened[fi]
    const familyStartX = cursorX
    // Padding gauche pour centrer les barres si la famille est élargie pour le titre.
    const extra = familyTargetSpans[fi] - familyContentWidths[fi]
    const leftPad = Math.floor(extra / 2)
    const rightPad = extra - leftPad
    cursorX += leftPad

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

    cursorX += rightPad
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
 * Largeur exacte du canvas — juste ce qu'il faut pour les barres + paddings,
 * pas de minimum forcé qui créerait de l'espace vide à droite.
 *
 * Sur les bilans peu chargés (5-10 épreuves), le canvas fait ~600-900px.
 * Sur les bilans très chargés (40+ épreuves), il s'étend largement (1500-2000+).
 * Word redimensionne ensuite l'image à TARGET_WORD_PX (620px) pour rester
 * dans les marges A4 — le ratio est préservé.
 */
export function computeChartWidth(groups: ChartGroup[]): number {
  const layout = computeLayout(groups)
  const required = layout.contentEndX + PAD_RIGHT
  // Plancher minuscule pour éviter un canvas dégénéré sur 1-2 épreuves
  // (mais sans imposer 1600 partout — c'est là qu'était le bug d'espace vide).
  return Math.max(640, required)
}

/**
 * Place les titres de sous-groupe en répartissant sur plusieurs niveaux Y
 * pour éviter les chevauchements horizontaux. Retourne pour chaque (fi, gi) :
 *   - lines  : titre wrappé selon la largeur disponible
 *   - level  : 0 = niveau le plus bas (proche des barres), N+ = au-dessus
 *   - widthMax : largeur du plus long line (utilisée pour la détection collision)
 *
 * Algo : balayage gauche→droite, on attribue à chaque titre le plus petit
 * niveau libre (où aucun titre déjà placé ne chevauche horizontalement).
 */
type SubgroupTitlePlacement = { lines: string[]; level: number; widthMax: number }

function placeSubgroupTitles(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): { placements: SubgroupTitlePlacement[][]; maxLines: number; numLevels: number } {
  ctx.font = `italic ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`

  // Wrap initial : autorise le titre à déborder un peu sur les inter-root gaps
  // (span + 0.8 * INTER_ROOT_GAP). Ça réduit le nombre de lignes nécessaires
  // pour les sous-groupes à 1 barre dont le titre mesure 100 px contre 18 px
  // de bar span.
  const placements: SubgroupTitlePlacement[][] = layout.families.map(fam =>
    fam.rootGroups.map(rg => {
      const barSpan = rg.endX - rg.startX
      const allowance = barSpan + INTER_ROOT_GAP * 0.8
      const lines = wrapTextByWords(ctx, rg.name, Math.max(40, allowance) - 2, SUBGROUP_TITLE_MAX_LINES)
      const widths = lines.map(l => ctx.measureText(l).width)
      const widthMax = lines.length > 0 ? Math.max(...widths) : 0
      return { lines, level: 0, widthMax }
    }),
  )

  // Niveaux dynamiques : on garde la position right-edge du dernier titre
  // placé sur chaque niveau. Pour un titre, on prend le plus petit niveau
  // dont right < newLeft (avec une marge de 4 px).
  const levelLastRight: number[] = []
  for (let fi = 0; fi < layout.families.length; fi++) {
    for (let gi = 0; gi < layout.families[fi].rootGroups.length; gi++) {
      const rg = layout.families[fi].rootGroups[gi]
      const p = placements[fi][gi]
      if (p.lines.length === 0) continue
      const left = rg.centerX - p.widthMax / 2
      const right = rg.centerX + p.widthMax / 2
      let level = 0
      while (level < levelLastRight.length && left < levelLastRight[level] + 4) level++
      if (level === levelLastRight.length) levelLastRight.push(right)
      else levelLastRight[level] = right
      p.level = level
    }
  }

  const maxLines = placements.reduce(
    (m, fLines) => Math.max(m, fLines.reduce((mm, p) => Math.max(mm, p.lines.length), 1)),
    1,
  )
  const numLevels = Math.max(1, levelLastRight.length)
  return { placements, maxLines, numLevels }
}

/** Hauteur idéale du canvas (titre famille + sous-groupes staggés + barres + labels verticaux). */
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
  const { maxLines, numLevels } = placeSubgroupTitles(ctx, layout)
  const padTop =
    PAD_TOP_BASE +
    (maxLines - 1) * SUBGROUP_TITLE_LINE_H +
    (numLevels - 1) * SUBGROUP_LEVEL_SPACING

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

  // Placement multi-niveaux des titres de sous-groupe (anti-overlap)
  const { placements: subTitlePlacements, maxLines: maxSubLines, numLevels: subLevels } =
    placeSubgroupTitles(ctx, layout)
  const padTop =
    PAD_TOP_BASE +
    (maxSubLines - 1) * SUBGROUP_TITLE_LINE_H +
    (subLevels - 1) * SUBGROUP_LEVEL_SPACING

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

  // Hauteur du bloc complet de titres de sous-groupes (tous niveaux confondus).
  // Utilisée pour positionner le titre famille au-dessus avec un gap propre.
  const subgroupBlockHeight =
    (subLevels - 1) * SUBGROUP_LEVEL_SPACING + maxSubLines * SUBGROUP_TITLE_LINE_H

  for (let fi = 0; fi < layout.families.length; fi++) {
    const fam = layout.families[fi]

    // Titre de famille (au-dessus de TOUS les niveaux de sous-groupe)
    ctx.fillStyle = '#1B5E20'
    ctx.font = `bold ${FAMILY_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
    ctx.textAlign = 'center'
    const familyTitleY = padTop - subgroupBlockHeight - 8
    ctx.fillText(fam.name.toUpperCase(), fam.centerX, familyTitleY)

    for (let gi = 0; gi < fam.rootGroups.length; gi++) {
      const rg = fam.rootGroups[gi]

      // Titre de sous-groupe (italique #546E7A, 9px — staggé sur niveau dédié)
      const placement = subTitlePlacements[fi][gi]
      if (placement && placement.lines.length > 0) {
        ctx.fillStyle = '#546E7A'
        ctx.font = `italic ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.textAlign = 'center'
        // baseY = baseline du bas du titre, décalée vers le haut selon level
        const baseY = padTop - 6 - placement.level * SUBGROUP_LEVEL_SPACING
        for (let li = 0; li < placement.lines.length; li++) {
          const yLine = baseY - (placement.lines.length - 1 - li) * SUBGROUP_TITLE_LINE_H
          ctx.fillText(placement.lines[li], rg.centerX, yLine)
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
 * Si `width` est omis, calcule la largeur exacte via computeChartWidth.
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
