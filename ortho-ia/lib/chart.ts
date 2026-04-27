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

// --------------------- Rendu canvas ---------------------

/**
 * Dessine le graphique HappyNeuron sur le canvas fourni. Le canvas doit avoir
 * `width` et `height` déjà configurés (en CSS pixels). Le rendu est synchrone.
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

  const padLeft = 150, padRight = 20, padTop = 56, padBottom = 130
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom
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

  // ===== Ligne d'alerte clinique — trait plein rouge à P10 =====
  // Marque la frontière entre la zone de fragilité (P10-25) et la zone de
  // difficulté (P5-9) selon la grille Exalang/HappyNeuron.
  const yAlert = yFor(10)
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(padLeft, yAlert); ctx.lineTo(padLeft + chartW, yAlert); ctx.stroke()
  ctx.fillStyle = '#C62828'
  ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText("Seuil d'alerte (P10)", padLeft + 4, yAlert - 3)

  // ===== Barres regroupées par sous-domaine =====
  const totalBars = groups.reduce((s, g) => s + g.bars.length, 0)
  if (totalBars === 0) return

  const groupGap = 16
  const totalGap = Math.max(0, groups.length - 1) * groupGap
  const slotW = (chartW - totalGap) / totalBars
  const barW = Math.min(slotW * 0.62, 30)

  let cursorX = padLeft
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const groupSpan = group.bars.length * slotW
    const groupStartX = cursorX

    // Titre du groupe au-dessus, centré (skip si name vide)
    if (group.name && group.name.trim()) {
      ctx.fillStyle = '#37474F'
      ctx.font = 'bold 11px Calibri, Arial, sans-serif'
      ctx.textAlign = 'center'
      const cx = groupStartX + groupSpan / 2
      const maxChars = Math.max(8, Math.floor(groupSpan / 7))
      const name = group.name.length > maxChars ? group.name.slice(0, maxChars - 1) + '…' : group.name
      ctx.fillText(name, cx, padTop - 12)
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

      // Label vertical sous la barre
      const lbl = b.label.length > 28 ? b.label.slice(0, 27) + '…' : b.label
      ctx.save()
      ctx.translate(x + barW / 2, padTop + chartH + 8)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#37474F'
      ctx.font = '10px Calibri, Arial, sans-serif'
      ctx.fillText(lbl, 0, 4)
      ctx.restore()
    }

    cursorX += groupSpan

    // Séparateur vertical pointillé entre groupes
    if (gi < groups.length - 1) {
      const sepX = cursorX + groupGap / 2
      ctx.strokeStyle = '#90A4AE'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(sepX, padTop); ctx.lineTo(sepX, padTop + chartH); ctx.stroke()
      ctx.setLineDash([])
      cursorX += groupGap
    }
  }
}

/**
 * Génère un PNG (ArrayBuffer) du graphique pour embarquer dans le Word.
 * Utilise un canvas hors-DOM. Module client-only.
 */
export async function happyNeuronChartToPng(
  groups: ChartGroup[],
  title: string,
  width = 1000,
  height = 480,
): Promise<{ data: ArrayBuffer; width: number; height: number }> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  drawHappyNeuronChart(ctx, width, height, groups, title)
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png')!)
  return { data: await blob.arrayBuffer(), width, height }
}
