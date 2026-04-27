/**
 * Rendu du graphique HappyNeuron — partagé entre l'export Word et la page de
 * visualisation des résultats. Le module est sans dépendance React : il prend
 * un canvas (existant pour la page web, créé dynamiquement pour le Word).
 *
 * Module client-only (utilise document.createElement et CanvasRenderingContext2D).
 */

// --------------------- Palette : zones de performance ---------------------
//
// Grille alignée sur la documentation officielle Exalang/HappyNeuron :
//  - P > 25 (strictement) → Dans la norme         (vert)
//  - P10 à P25 (Q1 inclus) → Zone de fragilité    (jaune/orange)
//  - P5 à P9               → Zone de difficulté   (orange foncé)
//  - P < 5                 → Zone de difficulté sévère (rouge/marron)

export type ZonePerformance = {
  label: 'Dans la norme' | 'Zone de fragilité' | 'Zone de difficulté' | 'Zone de difficulté sévère'
  min: number
  css: string
}

export const ZONES: ZonePerformance[] = [
  { label: 'Dans la norme',              min: 26, css: '#2E7D32' },
  { label: 'Zone de fragilité',          min: 10, css: '#FFA726' },
  { label: 'Zone de difficulté',         min: 5,  css: '#EF6C00' },
  { label: 'Zone de difficulté sévère',  min: 0,  css: '#4E342E' },
]

export function zoneFor(value: number): ZonePerformance {
  for (const z of ZONES) if (value >= z.min) return z
  return ZONES[ZONES.length - 1]
}

// --------------------- Données du chart ---------------------

export type ChartBar = { label: string; value: number }
export type ChartGroup = { name: string; bars: ChartBar[] }

// --------------------- Constantes de mise en page ---------------------

const PAD_LEFT = 150
const PAD_RIGHT = 20
const PAD_TOP_BASE = 56          // espace minimum pour le titre du chart
const PAD_BOTTOM_MIN = 40        // marge sous chart même sans labels
const LABEL_FONT_PX = 10         // épreuves verticales
const GROUP_TITLE_FONT_PX = 11   // titres de groupe
const GROUP_TITLE_LINE_H = 14    // hauteur de ligne pour titres groupe
const GROUP_TITLE_MAX_LINES = 2  // wrap sur 2 lignes max
const GROUP_GAP = 16
const MIN_CHART_AREA_H = 220

// --------------------- Helpers de wrap & mesure ---------------------

/** Découpe un texte en lignes pour qu'il tienne dans `maxWidth` (greedy word wrap). */
function wrapTextByWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (ctx.measureText(trimmed).width <= maxWidth) return [trimmed]

  const tokens = trimmed.split(/\s+/)
  if (tokens.length === 1) return [trimmed] // pas de séparateur, on laisse — la mesure peut déborder mais on n'ampute pas
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
        // dernière ligne autorisée : on y met tous les tokens restants — pas de troncation
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

/**
 * Calcule la hauteur de canvas optimale pour afficher tous les labels et titres
 * sans amputation. Renvoie une valeur ≥ minHeight.
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

  // Pad top : nombre de lignes max occupées par les titres de groupe
  ctx.font = `bold ${GROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  const chartW = width - PAD_LEFT - PAD_RIGHT
  const totalBars = groups.reduce((s, g) => s + g.bars.length, 0)
  const totalGap = Math.max(0, groups.length - 1) * GROUP_GAP
  const slotW = totalBars > 0 ? (chartW - totalGap) / totalBars : chartW
  let maxLines = 1
  for (const g of groups) {
    if (!g.name?.trim()) continue
    const groupSpan = Math.max(40, g.bars.length * slotW) // mini 40px pour ne pas exploser le wrap
    const lines = wrapTextByWords(ctx, g.name, groupSpan - 4, GROUP_TITLE_MAX_LINES)
    if (lines.length > maxLines) maxLines = lines.length
  }
  const padTop = PAD_TOP_BASE + Math.max(0, maxLines - 1) * GROUP_TITLE_LINE_H

  return Math.max(minHeight, padTop + MIN_CHART_AREA_H + padBottom)
}

// --------------------- Rendu canvas ---------------------

/**
 * Dessine le graphique HappyNeuron sur le canvas fourni. Le canvas doit avoir
 * `width` et `height` déjà configurés (en CSS pixels). Le rendu est synchrone.
 *
 * Pour garantir l'affichage complet de tous les labels :
 *  - padBottom est calculé dynamiquement à partir de la longueur (pixels) du
 *    plus long label d'épreuve (rotation -90°) ;
 *  - les titres de groupe sont wrappés sur 2 lignes max (pas de troncation
 *    avec "…").
 *
 * Pour pré-calculer la hauteur idéale, appeler `computeChartHeight()` puis
 * créer le canvas à cette taille avant d'appeler ce drawer.
 */
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

  // ===== Calcul des padding dynamiques =====
  ctx.font = `${LABEL_FONT_PX}px Calibri, Arial, sans-serif`
  const allLabels = groups.flatMap(g => g.bars.map(b => b.label))
  const maxLabelW = allLabels.reduce(
    (max, t) => Math.max(max, ctx.measureText(t || '').width),
    0,
  )
  const padBottom = Math.ceil(maxLabelW) + PAD_BOTTOM_MIN

  const padLeft = PAD_LEFT, padRight = PAD_RIGHT
  const chartW = width - padLeft - padRight
  const totalBars = groups.reduce((s, g) => s + g.bars.length, 0)
  const totalGap = Math.max(0, groups.length - 1) * GROUP_GAP
  const slotW = totalBars > 0 ? (chartW - totalGap) / totalBars : chartW

  // Pré-wrap des titres de groupe pour calculer maxLines → padTop
  ctx.font = `bold ${GROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
  const wrappedTitles: string[][] = groups.map(g => {
    if (!g.name?.trim()) return []
    const groupSpan = Math.max(40, g.bars.length * slotW)
    return wrapTextByWords(ctx, g.name, groupSpan - 4, GROUP_TITLE_MAX_LINES)
  })
  const maxTitleLines = wrappedTitles.reduce((m, lines) => Math.max(m, lines.length), 1)
  const padTop = PAD_TOP_BASE + Math.max(0, maxTitleLines - 1) * GROUP_TITLE_LINE_H

  const chartH = Math.max(MIN_CHART_AREA_H, height - padTop - padBottom)
  const yFor = (p: number) => padTop + chartH - (p / 100) * chartH

  // ===== Bandes de fond colorées (zones de performance) =====
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const y0 = yFor(upper)
    const y1 = yFor(z.min)
    ctx.fillStyle = z.css + '33' // hex alpha 0x33 ≈ 20%
    ctx.fillRect(padLeft, y0, chartW, y1 - y0)
  }

  // Lignes horizontales fines entre zones
  ctx.strokeStyle = '#BDBDBD'
  ctx.lineWidth = 0.5
  for (let i = 1; i < ZONES.length; i++) {
    const y = yFor(ZONES[i - 1].min)
    ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(padLeft + chartW, y); ctx.stroke()
  }
  // Bordure du chart
  ctx.strokeRect(padLeft, padTop, chartW, chartH)

  // Labels de zone à gauche, alignés sur le centre de la bande
  ctx.font = 'bold 10.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i]
    const upper = i === 0 ? 100 : ZONES[i - 1].min
    const mid = (yFor(upper) + yFor(z.min)) / 2
    if (yFor(z.min) - yFor(upper) < 12) continue // bande trop fine
    ctx.fillStyle = z.css
    ctx.fillText(z.label, padLeft - 8, mid + 4)
  }

  // ===== Ligne médiane (P50) — trait plein noir =====
  const yMed = yFor(50)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(padLeft, yMed); ctx.lineTo(padLeft + chartW, yMed); ctx.stroke()
  ctx.fillStyle = '#000000'
  ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Médiane (P50)', padLeft + 4, yMed - 3)

  // ===== Ligne d'alerte clinique — trait plein rouge à P7 =====
  // Repère visuel d'alerte clinique demandé explicitement par Laurie.
  // Note : avec la grille Exalang, P7 est dans la zone de difficulté (P5-9),
  // pas exactement à la frontière fragilité/difficulté (qui est à P9-10).
  // Conservé à P7 par cohérence avec la spec et l'usage clinique.
  const yAlert = yFor(7)
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(padLeft, yAlert); ctx.lineTo(padLeft + chartW, yAlert); ctx.stroke()
  ctx.fillStyle = '#C62828'
  ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText("Seuil d'alerte (P7)", padLeft + 4, yAlert - 3)

  // ===== Barres regroupées par sous-domaine =====
  if (totalBars === 0) return

  const barW = Math.min(slotW * 0.62, 30)

  let cursorX = padLeft
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const groupSpan = group.bars.length * slotW
    const groupStartX = cursorX

    // Titre du groupe au-dessus, centré, wrappé sur ≤ 2 lignes (pas de "…")
    const titleLines = wrappedTitles[gi]
    if (titleLines && titleLines.length > 0) {
      ctx.fillStyle = '#37474F'
      ctx.font = `bold ${GROUP_TITLE_FONT_PX}px Calibri, Arial, sans-serif`
      ctx.textAlign = 'center'
      const cx = groupStartX + groupSpan / 2
      // Lignes affichées du bas vers le haut depuis padTop - 6
      const baseY = padTop - 6
      for (let li = 0; li < titleLines.length; li++) {
        const yLine = baseY - (titleLines.length - 1 - li) * GROUP_TITLE_LINE_H
        ctx.fillText(titleLines[li], cx, yLine)
      }
    }

    for (let bi = 0; bi < group.bars.length; bi++) {
      const b = group.bars[bi]
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

    // Séparateur vertical pointillé entre groupes
    if (gi < groups.length - 1) {
      const sepX = cursorX + GROUP_GAP / 2
      ctx.strokeStyle = '#90A4AE'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(sepX, padTop); ctx.lineTo(sepX, padTop + chartH); ctx.stroke()
      ctx.setLineDash([])
      cursorX += GROUP_GAP
    }
  }
}

/**
 * Génère un PNG (ArrayBuffer) du graphique pour embarquer dans le Word.
 * La hauteur du canvas est auto-ajustée si les labels sont longs (pas de
 * troncation). Module client-only.
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
