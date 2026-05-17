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
// 6 zones cliniques alignées sur la grille révisée Laurie (refonte 2026-05).
// Plus de "Excellent" — la zone haute commence à "Moyenne haute" (≥ P51).
// La nouvelle "Moyenne" (P26-50) correspond à l'ancienne "Moyenne basse".
// L'ancienne "Fragilité" (P10-25) devient "Moyenne basse".
// L'ancienne "Difficulté" (P6-9) devient "Zone de fragilité" et est élargie
// à P5-9. L'ancienne "Difficulté sévère" éclate en "Difficulté" (P2-4) et
// "Difficulté sévère" (<P2).

export type ZoneLabel =
  | 'Moyenne haute'
  | 'Moyenne'
  | 'Moyenne basse'
  | 'Zone de fragilité'
  | 'Difficulté'
  | 'Difficulté sévère'

export type ZonePerformance = {
  label: ZoneLabel
  min: number
  css: string
}

/** Couleurs des bandes de fond du graphique (palette pastel imposée Laurie).
 *  La couleur des barres elles-mêmes est plus saturée — voir BAR_FILL_OF_VALUE.
 *  Refonte 2026-05 : 6 labels courts unifiés, plus de "Excellent". */
export const ZONES: ZonePerformance[] = [
  { label: 'Moyenne haute',      min: 51, css: '#C8E6C9' }, // vert pastel — couvre ≥ P51
  { label: 'Moyenne',            min: 26, css: '#DCEDC8' }, // vert très pastel (P26-50)
  { label: 'Moyenne basse',      min: 10, css: '#FFF59D' }, // jaune pastel (P10-25, Q1 incl.)
  { label: 'Zone de fragilité',  min: 5,  css: '#FFE0B2' }, // orange pastel (P5-9)
  { label: 'Difficulté',         min: 2,  css: '#FFCCBC' }, // orange clair (P2-4)
  { label: 'Difficulté sévère',  min: 0,  css: '#D7CCC8' }, // marron clair (<P2)
]

/** Couleur de remplissage des barres (palette saturée — même que les fonds
 *  cellules tableaux Word). Plus visible que la palette pastel des bandes. */
const BAR_FILL_OF_VALUE = (value: number): string => {
  if (value >= 51) return '#2E7D32' // vert foncé (Moyenne haute, ≥ P51)
  if (value >= 26) return '#66BB6A' // vert clair (Moyenne, P26-50)
  if (value >= 10) return '#FBC02D' // jaune (Moyenne basse, P10-25)
  if (value >= 5)  return '#FB8C00' // orange (Zone de fragilité, P5-9)
  if (value >= 2)  return '#E65100' // orange foncé (Difficulté, P2-4)
  return '#D32F2F'                  // rouge vif (Difficulté sévère, <P2)
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

export function classifyFamily(domainName: string | null | undefined): FamilyKey {
  // Garde-fou : un domaine null/undefined (CRBO legacy mal formé) ne doit pas
  // crasher l'export Word. On retombe sur 'oral' (défaut sémantiquement neutre).
  const n = (domainName ?? '').toLowerCase().trim()
  const codeMatch = n.match(/^([abc])\s*[.\d]/i)
  if (codeMatch) {
    const c = codeMatch[1].toLowerCase()
    if (c === 'a') return 'oral'
    if (c === 'b') return 'ecrit'
    if (c === 'c') return 'sub'
  }
  // "Dénomination rapide" / "Dénomination automatisée" (RAN) → sous-jacentes.
  // En revanche "Dénomination d'images" reste en langage oral expressif :
  // on ne match donc PAS le mot "dénomination" seul.
  if (/m[ée]moire|empan|boucle\s*phon|d[ée]nomination\s+(?:rapide|automatis[ée]e)|\bran\b|visuo|attention|traitement\s*visu|inhibition|flexibilit[ée]|s[ée]quentiel/.test(n)) {
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
  // Note : "endroit" / "envers" volontairement EXCLUS des tail tokens —
  // les empans endroit et envers sont 2 épreuves distinctes et leurs barres
  // ne doivent PAS être collées (règle Laurie).
  const TAIL_TOKENS = /\s+(score|temps|ratio|brut|brute|pondéré|pondérée|note pondérée|phonologie|lexique|grammatical|grammaticale|réponses|erreurs|mots lus|mots lus correctement|note)\s*$/i
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

const PAD_LEFT = 180             // place pour les labels longs des zones gauche
const PAD_RIGHT = 24
const PAD_TOP_BASE = 84
const PAD_BOTTOM_MIN = 44
const LABEL_FONT_PX = 9          // épreuves (vertical) — spec Laurie 9px
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

/**
 * Dessine un texte avec un rectangle blanc semi-transparent derrière.
 * Garantit la lisibilité même si une barre passe juste sous le label.
 *
 *   align     : 'left' (défaut), 'center', 'right' — ancrage horizontal du texte
 *   solid     : si true, fond blanc opaque (255,255,255,1) — utilisé pour
 *               la médiane qui doit rester nette même si une barre est devant.
 *   border    : trace une bordure 0.5px gris clair autour du fond.
 *   padding   : padding intérieur autour du texte (défaut 3px H, 1.5px V).
 *
 * Précondition : ctx.font et ctx.fillStyle (couleur du texte) sont déjà set.
 * Cette fonction ne change PAS ctx.fillStyle pour le texte — elle ne fait
 * que peindre le bg puis appeler fillText avec la couleur déjà active.
 */
function drawTextWithBg(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    align?: 'left' | 'center' | 'right'
    solid?: boolean
    border?: boolean
    padX?: number
    padY?: number
  } = {},
): void {
  const align = opts.align ?? 'left'
  const padX = opts.padX ?? 3
  const padY = opts.padY ?? 1.5
  const w = ctx.measureText(text).width
  // Approxime hauteur du texte à 1.0 × fontSize (suffisant pour Calibri 9-10px).
  // On lit la taille depuis ctx.font ("bold 9.5px ..." → 9.5).
  const fontSizeMatch = ctx.font.match(/(\d+(?:\.\d+)?)px/)
  const h = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 10
  const left = align === 'center' ? x - w / 2 - padX
            : align === 'right'  ? x - w - padX
            : x - padX
  const top = y - h + padY * 0
  const bgX = left
  const bgY = top - padY
  const bgW = w + padX * 2
  const bgH = h + padY * 2

  const prevFill = ctx.fillStyle
  ctx.fillStyle = opts.solid ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.86)'
  ctx.fillRect(bgX, bgY, bgW, bgH)
  if (opts.border) {
    ctx.strokeStyle = 'rgba(120,120,120,0.45)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(bgX + 0.25, bgY + 0.25, bgW - 0.5, bgH - 0.5)
  }
  ctx.fillStyle = prevFill
  // Réinit textAlign pour fillText respecter `align` voulu
  const prevAlign = ctx.textAlign
  ctx.textAlign = align
  ctx.fillText(text, x, y)
  ctx.textAlign = prevAlign
}

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

// Les titres de sous-groupes (italiques au-dessus des barres) ont été
// retirés (Laurie). La fonction placeSubgroupTitles précédente n'est plus
// utilisée — seuls les titres de famille en gras vert demeurent.

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

  // Les titres de sous-groupes au-dessus des barres ont été retirés (Laurie) —
  // padTop reste minimal (juste la place pour le titre famille en gras).
  const padTop = PAD_TOP_BASE

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

  // Les titres de sous-groupes (italiques au-dessus des barres) ont été
  // retirés (Laurie) — on ne garde que les titres de famille en gras vert.
  const padTop = PAD_TOP_BASE

  const chartH = Math.max(MIN_CHART_AREA_H, height - padTop - padBottom)
  const yFor = (p: number) => padTop + chartH - (p / 100) * chartH

  // Largeur effective du chart pour les bandes de fond et lignes médianes
  const chartLeftX = PAD_LEFT
  const chartRightX = Math.max(layout.contentEndX, width - PAD_RIGHT)
  const chartW = chartRightX - chartLeftX

  // ===== Fond du graphique =====
  // Bandes colorées retirées (Laurie). Mais on garde de fines lignes
  // horizontales aux frontières de zones pour aider la lecture des labels
  // de zones (dessinés à gauche, en passe finale).
  ctx.strokeStyle = '#E0E0E0'
  ctx.lineWidth = 0.5
  for (let i = 1; i < ZONES.length; i++) {
    const y = yFor(ZONES[i - 1].min)
    ctx.beginPath(); ctx.moveTo(chartLeftX, y); ctx.lineTo(chartRightX, y); ctx.stroke()
  }
  ctx.strokeStyle = '#BDBDBD'
  ctx.lineWidth = 0.5
  ctx.strokeRect(chartLeftX, padTop, chartW, chartH)

  // ===== Lignes Médiane (P50) + Seuil P7 — TRACÉS UNIQUEMENT ICI =====
  // Les LABELS associés sont dessinés EN DERNIER (après les barres) avec
  // un fond blanc pour rester lisibles si une barre les recouvre.
  const yMed = yFor(50)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(chartLeftX, yMed); ctx.lineTo(chartRightX, yMed); ctx.stroke()

  const yAlert = yFor(7)
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(chartLeftX, yAlert); ctx.lineTo(chartRightX, yAlert); ctx.stroke()

  // ===== Séparateurs verticaux pointillés entre familles =====
  for (const sepX of layout.familySeparators) {
    ctx.strokeStyle = '#90A4AE'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(sepX, padTop); ctx.lineTo(sepX, padTop + chartH); ctx.stroke()
    ctx.setLineDash([])
  }

  // ===== Barres + titres famille =====
  if (layout.totalBars === 0) return

  for (let fi = 0; fi < layout.families.length; fi++) {
    const fam = layout.families[fi]

    // Titre de famille en gras vert (Langage oral / Langage écrit /
    // Compétences sous-jacentes). Les titres de sous-groupes ont été retirés.
    ctx.fillStyle = '#1B5E20'
    ctx.font = `bold ${FAMILY_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
    ctx.textAlign = 'center'
    const familyTitleY = padTop - 12
    ctx.fillText(fam.name.toUpperCase(), fam.centerX, familyTitleY)

    for (let gi = 0; gi < fam.rootGroups.length; gi++) {
      const rg = fam.rootGroups[gi]

      // Barres + label vertical sous la barre (P-label traité plus bas)
      for (const b of rg.bars) {
        const v = Math.max(0, Math.min(100, b.value))
        const yTop = yFor(v)
        const h = padTop + chartH - yTop

        ctx.fillStyle = BAR_FILL_OF_VALUE(v)
        ctx.fillRect(b.x, yTop, BAR_W, h)
        ctx.strokeStyle = '#212121'
        ctx.lineWidth = 1
        ctx.strokeRect(b.x, yTop, BAR_W, h)

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

      // ===== Labels P (P5, P25, P75…) AVEC DÉDOUBLONNAGE =====
      // Si plusieurs barres adjacentes (= dans le même root group, donc
      // séparées de seulement INTRA_ROOT_GAP=2px) ont la même valeur P
      // arrondie, on n'affiche qu'UN label centré sur l'ensemble.
      // Si une barre seule a un label trop large pour BAR_W (cas rare,
      // typiquement "P100"), on retombe à 7px.
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      let i = 0
      while (i < rg.bars.length) {
        let j = i
        const v0 = Math.round(Math.max(0, Math.min(100, rg.bars[i].value)))
        while (
          j + 1 < rg.bars.length &&
          Math.round(Math.max(0, Math.min(100, rg.bars[j + 1].value))) === v0
        ) j++

        const xLeft  = rg.bars[i].x
        const xRight = rg.bars[j].x + BAR_W
        const cx = (xLeft + xRight) / 2
        const yTop = yFor(v0)
        const text = `P${v0}`

        // Choix de la police : 8px par défaut, fallback 7px si label trop
        // large pour le span disponible (cas barre unique avec valeur > 9).
        const span = xRight - xLeft
        ctx.font = `${BAR_VALUE_FONT_PX}px Calibri, Arial, sans-serif`
        const w8 = ctx.measureText(text).width
        if (w8 > span - 1) {
          ctx.font = `7px Calibri, Arial, sans-serif`
        }
        ctx.fillText(text, cx, yTop - 3)

        i = j + 1
      }
    }
  }

  // ===== PASSE FINALE — labels TOUJOURS visibles au-dessus des barres =====
  // Dessinés en dernier (après les barres) avec fond blanc pour rester
  // lisibles si une barre les recouvre.

  // 1) Labels de zones à gauche (Excellent / Moyenne haute / Moyenne basse /
  //    Fragilité / Difficulté / Difficulté sévère). Pas de fond coloré, mais
  //    couleur du texte saturée pour évoquer le code couleur des barres.
  //    Pour les bandes étroites (Difficulté P6-9, Difficulté sévère P0-5), on
  //    utilise un libellé compact + police plus petite pour garantir l'affichage.
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const bandTop = yFor(upper)
    const bandBot = yFor(z.min)
    const bandH = bandBot - bandTop
    if (bandH < 7) continue
    const mid = (bandTop + bandBot) / 2
    ctx.fillStyle = BAR_FILL_OF_VALUE(z.min === 0 ? 0 : z.min)

    if (bandH < 22) {
      // On garde "Zone de …" en entier (règle Laurie) — on retire seulement
      // le préfixe "Résultat …" qui est implicite dans le contexte du graphique.
      const compact = z.label.replace(/^(Résultat dans la |Résultat )/, '')
      ctx.font = '600 8.5px Calibri, Arial, sans-serif'
      drawTextWithBg(ctx, compact, PAD_LEFT - 8, mid + 3, {
        align: 'right', padX: 2, padY: 1,
      })
    } else {
      ctx.font = '600 10.5px Calibri, Arial, sans-serif'
      const lines = wrapTextByWords(ctx, z.label, PAD_LEFT - 16, 2)
      if (lines.length === 1) {
        drawTextWithBg(ctx, lines[0], PAD_LEFT - 8, mid + 4, {
          align: 'right', padX: 3, padY: 1.5,
        })
      } else {
        const lineH = 12
        const startY = mid - ((lines.length - 1) * lineH) / 2 + 4
        for (let li = 0; li < lines.length; li++) {
          drawTextWithBg(ctx, lines[li], PAD_LEFT - 8, startY + li * lineH, {
            align: 'right', padX: 3, padY: 1.5,
          })
        }
      }
    }
  }

  // 2) Médiane (P50) — fond blanc OPAQUE + bordure fine
  ctx.font = 'bold 9.5px Calibri, Arial, sans-serif'
  ctx.fillStyle = '#000000'
  drawTextWithBg(ctx, 'Médiane (P50)', chartLeftX + 4, yMed - 3, {
    align: 'left', solid: true, border: true, padX: 4, padY: 2,
  })

  // 3) Seuil d'alerte P7 — même traitement, couleur rouge
  ctx.font = 'bold 9.5px Calibri, Arial, sans-serif'
  ctx.fillStyle = '#C62828'
  drawTextWithBg(ctx, "Seuil d'alerte (P7)", chartLeftX + 4, yAlert - 3, {
    align: 'left', solid: true, border: true, padX: 4, padY: 2,
  })
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
