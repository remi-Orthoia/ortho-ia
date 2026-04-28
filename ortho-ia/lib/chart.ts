/**
 * Rendu du graphique HappyNeuron — partagé entre l'export Word et la page de
 * visualisation des résultats. Le module est sans dépendance React : il prend
 * un canvas (existant pour la page web, créé dynamiquement pour le Word).
 *
 * Module client-only (utilise document.createElement et CanvasRenderingContext2D).
 *
 * Refonte : 6 zones de performance + regroupement en 3 familles (Langage oral,
 * Langage écrit, Compétences sous-jacentes) avec hiérarchie sous-groupe → famille.
 */

// --------------------- Palette : zones de performance ---------------------
//
// 6 zones cliniques alignées sur le graphique HappyNeuron officiel.
// Convention de classement : `min` est inclusif. Q1 (P25) reste en fragilité
// — règle clinique Laurie déjà utilisée par l'extraction PDF et les tableaux.

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

export const ZONES: ZonePerformance[] = [
  { label: 'Excellent résultat',                min: 76, css: '#1B5E20' }, // vert foncé
  { label: 'Résultat dans la moyenne haute',    min: 51, css: '#66BB6A' }, // vert clair
  { label: 'Résultat dans la moyenne basse',    min: 26, css: '#C0CA33' }, // jaune-vert
  { label: 'Zone de fragilité',                 min: 10, css: '#FFB74D' }, // orange clair
  { label: 'Zone de difficulté',                min: 5,  css: '#EF6C00' }, // orange foncé
  { label: 'Zone de difficulté sévère',         min: 0,  css: '#5D4037' }, // marron
]

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

/**
 * Classifie un nom de domaine HappyNeuron dans l'une des 3 grandes familles.
 *  - Codes Exalang/Examath standard (A.x → oral, B.x → écrit, C.x → sub)
 *  - Fallback heuristique sur mots-clés (ordre important : on teste "écrit"
 *    avant "oral" pour que "lecture" soit bien classé en écrit).
 */
export function classifyFamily(domainName: string): FamilyKey {
  const n = (domainName || '').toLowerCase().trim()
  // Code HappyNeuron : "A.1 Langage oral", "B.2 Orthographe", "C.1 Mémoire"
  const codeMatch = n.match(/^([abc])\s*[.\d]/i)
  if (codeMatch) {
    const c = codeMatch[1].toLowerCase()
    if (c === 'a') return 'oral'
    if (c === 'b') return 'ecrit'
    if (c === 'c') return 'sub'
  }
  // Compétences sous-jacentes (testé en premier — empan/mémoire/etc. ne doivent
  // jamais être confondus avec "langage oral" même si les empans sont auditifs).
  if (/m[ée]moire|empan|boucle\s*phon|d[ée]nomination|denomination|visuo|attention|ran\b|traitement\s*visu|inhibition|flexibilit[ée]|s[ée]quentiel/.test(n)) {
    return 'sub'
  }
  // Langage écrit (lecture, leximétrie, dictée, etc.)
  if (/lecture|lex[ie]m[ée]trie|orthograph|dict[ée]e|closure|[ée]crit|non[\s\-]*mots?|graph[èe]m|d[ée]chiffrage/.test(n)) {
    return 'ecrit'
  }
  // Par défaut : langage oral (englobe métaphono, fluences, compréhension
  // orale, lexique, morphosyntaxe…)
  return 'oral'
}

// --------------------- Données du chart ---------------------

export type ChartBar = { label: string; value: number }
export type ChartGroup = { name: string; bars: ChartBar[] }
export type ChartFamily = { key: FamilyKey; name: string; subgroups: ChartGroup[] }

/**
 * Re-groupe une liste de domaines (ChartGroup) en 3 familles cliniques.
 * Chaque famille présente reçoit les sous-groupes dans leur ordre d'arrivée.
 * Les familles vides sont omises — utile pour les bilans ciblés (uniquement
 * "Examath" → uniquement Compétences sous-jacentes par exemple).
 */
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

// --------------------- Constantes de mise en page ---------------------

const PAD_LEFT = 200             // un peu plus large pour les labels de zone (textes plus longs)
const PAD_RIGHT = 20
const PAD_TOP_BASE = 80          // espace pour titre chart + 2 niveaux de titres (famille + sous-groupe)
const PAD_BOTTOM_MIN = 40
const LABEL_FONT_PX = 10         // épreuves verticales
const SUBGROUP_TITLE_FONT_PX = 11
const SUBGROUP_TITLE_LINE_H = 14
const SUBGROUP_TITLE_MAX_LINES = 2
const FAMILY_TITLE_FONT_PX = 13
const FAMILY_TITLE_LINE_H = 17
const SUBGROUP_GAP = 8           // gap entre sous-groupes d'une même famille
const FAMILY_GAP = 28            // gap plus large entre familles
const MIN_CHART_AREA_H = 220

// --------------------- Helpers de wrap & mesure ---------------------

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

// --------------------- Layout helpers ---------------------

type LayoutInfo = {
  families: ChartFamily[]
  totalBars: number
  slotW: number
  chartW: number
  groupSpans: number[][]   // groupSpans[fi][gi] = largeur en px du sous-groupe (fi, gi)
  familySpans: number[]    // largeur totale de chaque famille (somme sous-groupes + gaps internes)
}

function computeLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  groups: ChartGroup[],
): LayoutInfo {
  const families = regroupIntoFamilies(groups)
  const chartW = width - PAD_LEFT - PAD_RIGHT
  const totalBars = families.reduce((s, f) => s + f.subgroups.reduce((ss, g) => ss + g.bars.length, 0), 0)
  // gaps : (n_subgroups - 1) au sein de chaque famille (SUBGROUP_GAP) +
  // (n_families - 1) gros gaps entre familles (FAMILY_GAP)
  const intraGaps = families.reduce((s, f) => s + Math.max(0, f.subgroups.length - 1), 0)
  const interGaps = Math.max(0, families.length - 1)
  const totalGapPx = intraGaps * SUBGROUP_GAP + interGaps * FAMILY_GAP
  const slotW = totalBars > 0 ? Math.max(8, (chartW - totalGapPx) / totalBars) : chartW

  const groupSpans: number[][] = families.map(f => f.subgroups.map(g => g.bars.length * slotW))
  const familySpans = families.map((f, fi) => {
    const subgroupsSpan = groupSpans[fi].reduce((a, b) => a + b, 0)
    const gaps = Math.max(0, f.subgroups.length - 1) * SUBGROUP_GAP
    return subgroupsSpan + gaps
  })

  return { families, totalBars, slotW, chartW, groupSpans, familySpans }
}

/**
 * Hauteur idéale pour afficher tous les labels (verticaux) + 2 niveaux de
 * titres (sous-groupe + famille) sans amputation.
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

  // Pad bottom : largeur du plus long label vertical + marge
  ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
  const allLabels = groups.flatMap(g => g.bars.map(b => b.label))
  const maxLabelW = allLabels.reduce(
    (max, t) => Math.max(max, ctx.measureText(t || '').width),
    0,
  )
  const padBottom = Math.ceil(maxLabelW) + PAD_BOTTOM_MIN

  const layout = computeLayout(ctx, width, groups)

  // Pad top : titre chart + ligne famille + max(lignes wrap des sous-groupes)
  ctx.font = `bold ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  let maxSubLines = 1
  for (const f of layout.families) {
    for (let gi = 0; gi < f.subgroups.length; gi++) {
      const groupSpan = Math.max(40, layout.groupSpans[layout.families.indexOf(f)][gi])
      const lines = wrapTextByWords(ctx, f.subgroups[gi].name, groupSpan - 4, SUBGROUP_TITLE_MAX_LINES)
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

  // Pad bottom dynamique (longueur du plus long label vertical)
  ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
  const allLabels = groups.flatMap(g => g.bars.map(b => b.label))
  const maxLabelW = allLabels.reduce(
    (max, t) => Math.max(max, ctx.measureText(t || '').width),
    0,
  )
  const padBottom = Math.ceil(maxLabelW) + PAD_BOTTOM_MIN

  const layout = computeLayout(ctx, width, groups)
  const { families, slotW, chartW, groupSpans } = layout

  // Pré-wrap des titres de sous-groupe (familles indépendantes)
  ctx.font = `bold ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  const wrappedSubTitles: string[][][] = families.map((f, fi) =>
    f.subgroups.map((g, gi) => {
      const groupSpan = Math.max(40, groupSpans[fi][gi])
      return wrapTextByWords(ctx, g.name, groupSpan - 4, SUBGROUP_TITLE_MAX_LINES)
    })
  )
  const maxSubLines = wrappedSubTitles.reduce(
    (m, fLines) => Math.max(m, fLines.reduce((mm, l) => Math.max(mm, l.length), 1)),
    1,
  )
  const padTop = PAD_TOP_BASE + (maxSubLines - 1) * SUBGROUP_TITLE_LINE_H

  const chartH = Math.max(MIN_CHART_AREA_H, height - padTop - padBottom)
  const yFor = (p: number) => padTop + chartH - (p / 100) * chartH

  // ===== Bandes de fond colorées (zones de performance) =====
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const y0 = yFor(upper)
    const y1 = yFor(z.min)
    ctx.fillStyle = z.css + '33' // alpha ~20%
    ctx.fillRect(PAD_LEFT, y0, chartW, y1 - y0)
  }

  // Lignes horizontales fines entre zones
  ctx.strokeStyle = '#BDBDBD'
  ctx.lineWidth = 0.5
  for (let i = 1; i < ZONES.length; i++) {
    const y = yFor(ZONES[i - 1].min)
    ctx.beginPath(); ctx.moveTo(PAD_LEFT, y); ctx.lineTo(PAD_LEFT + chartW, y); ctx.stroke()
  }
  // Bordure du chart
  ctx.strokeRect(PAD_LEFT, padTop, chartW, chartH)

  // Labels de zone à gauche (textes longs → on autorise jusqu'à PAD_LEFT - 8 px)
  ctx.font = '600 10.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const bandTop = yFor(upper)
    const bandBot = yFor(z.min)
    if (bandBot - bandTop < 12) continue
    const mid = (bandTop + bandBot) / 2
    ctx.fillStyle = z.css
    // wrap si le label est trop long pour PAD_LEFT - 16
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

  // ===== Ligne médiane (P50) — trait plein noir =====
  const yMed = yFor(50)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(PAD_LEFT, yMed); ctx.lineTo(PAD_LEFT + chartW, yMed); ctx.stroke()
  ctx.fillStyle = '#000000'
  ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Médiane (P50)', PAD_LEFT + 4, yMed - 3)

  // ===== Ligne d'alerte clinique — trait rouge à P7 =====
  const yAlert = yFor(7)
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(PAD_LEFT, yAlert); ctx.lineTo(PAD_LEFT + chartW, yAlert); ctx.stroke()
  ctx.fillStyle = '#C62828'
  ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText("Seuil d'alerte (P7)", PAD_LEFT + 4, yAlert - 3)

  // ===== Barres regroupées par famille → sous-groupe → barre =====
  if (layout.totalBars === 0) return

  const barW = Math.min(slotW * 0.62, 30)
  let cursorX = PAD_LEFT

  for (let fi = 0; fi < families.length; fi++) {
    const family = families[fi]
    const familyStartX = cursorX
    const familySubgroupsCount = family.subgroups.length

    // Titre de famille (au-dessus, gras, plus gros)
    const familyCenterX = familyStartX + layout.familySpans[fi] / 2
    ctx.fillStyle = '#1B5E20'
    ctx.font = `bold ${FAMILY_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
    ctx.textAlign = 'center'
    // y = bordure haute du chart - hauteur des titres sous-groupe - 4
    const familyTitleY = padTop - (maxSubLines * SUBGROUP_TITLE_LINE_H) - 6
    ctx.fillText(family.name.toUpperCase(), familyCenterX, familyTitleY)

    // Sous-groupes
    for (let gi = 0; gi < familySubgroupsCount; gi++) {
      const sub = family.subgroups[gi]
      const groupSpan = groupSpans[fi][gi]
      const groupStartX = cursorX

      // Titre du sous-groupe (couleur grise)
      const titleLines = wrappedSubTitles[fi][gi]
      if (titleLines && titleLines.length > 0) {
        ctx.fillStyle = '#37474F'
        ctx.font = `bold ${SUBGROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.textAlign = 'center'
        const cx = groupStartX + groupSpan / 2
        const baseY = padTop - 6
        for (let li = 0; li < titleLines.length; li++) {
          const yLine = baseY - (titleLines.length - 1 - li) * SUBGROUP_TITLE_LINE_H
          ctx.fillText(titleLines[li], cx, yLine)
        }
      }

      // Barres
      for (let bi = 0; bi < sub.bars.length; bi++) {
        const b = sub.bars[bi]
        const v = Math.max(0, Math.min(100, b.value))
        const x = groupStartX + bi * slotW + (slotW - barW) / 2
        const yTop = yFor(v)
        const h = padTop + chartH - yTop
        const z = zoneFor(v)

        ctx.fillStyle = z.css
        ctx.fillRect(x, yTop, barW, h)
        ctx.strokeStyle = '#212121'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, yTop, barW, h)

        // Valeur P au-dessus de la barre
        ctx.fillStyle = '#212121'
        ctx.font = 'bold 9.5px Calibri, Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`P${Math.round(v)}`, x + barW / 2, yTop - 3)

        // Label vertical sous la barre — texte intégral, jamais tronqué.
        ctx.save()
        ctx.translate(x + barW / 2, padTop + chartH + 8)
        ctx.rotate(-Math.PI / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#37474F'
        ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
        ctx.fillText(b.label, 0, 4)
        ctx.restore()
      }

      cursorX += groupSpan

      // Séparateur léger entre sous-groupes d'une même famille
      if (gi < familySubgroupsCount - 1) {
        const sepX = cursorX + SUBGROUP_GAP / 2
        ctx.strokeStyle = '#CFD8DC'
        ctx.setLineDash([2, 3])
        ctx.lineWidth = 0.7
        ctx.beginPath(); ctx.moveTo(sepX, padTop + 4); ctx.lineTo(sepX, padTop + chartH - 4); ctx.stroke()
        ctx.setLineDash([])
        cursorX += SUBGROUP_GAP
      }
    }

    // Trait plein vertical entre familles (séparateur fort)
    if (fi < families.length - 1) {
      const sepX = cursorX + FAMILY_GAP / 2
      ctx.strokeStyle = '#607D8B'
      ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(sepX, padTop); ctx.lineTo(sepX, padTop + chartH); ctx.stroke()
      cursorX += FAMILY_GAP
    }
  }
}

/**
 * Génère un PNG (ArrayBuffer) du graphique pour embarquer dans le Word.
 */
export async function happyNeuronChartToPng(
  groups: ChartGroup[],
  title: string,
  width = 1000,
  minHeight = 480,
): Promise<{ data: ArrayBuffer; width: number; height: number }> {
  const canvas = document.createElement('canvas')
  const height = computeChartHeight(width, groups, minHeight)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  drawHappyNeuronChart(ctx, width, height, groups, title)
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png')!)
  return { data: await blob.arrayBuffer(), width, height }
}
