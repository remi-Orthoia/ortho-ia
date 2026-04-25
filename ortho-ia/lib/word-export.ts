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

// --------------------- Palette cohérente seuils cliniques ---------------------

export type SeuilClinique = {
  label: 'Normal' | 'Limite basse' | 'Fragile' | 'Déficitaire' | 'Pathologique'
  min: number
  shading: string // hex sans # (pour docx)
  css: string     // avec # (pour canvas)
  range: string
}

// 5 niveaux alignés sur les seuils cliniques officiels des bilans orthophoniques.
export const SEUILS: SeuilClinique[] = [
  { label: 'Normal',       min: 25, shading: 'C8E6C9', css: '#81C784', range: 'P ≥ 25' },
  { label: 'Limite basse', min: 16, shading: 'FFF59D', css: '#FFEE58', range: 'P16-24' },
  { label: 'Fragile',      min: 7,  shading: 'FFCC80', css: '#FFB74D', range: 'P7-15' },
  { label: 'Déficitaire',  min: 2,  shading: 'EF9A9A', css: '#E57373', range: 'P2-6' },
  { label: 'Pathologique', min: 0,  shading: 'E57373', css: '#C62828', range: 'P < 2' },
]

export function seuilFor(value: number): SeuilClinique {
  for (const s of SEUILS) if (value >= s.min) return s
  return SEUILS[SEUILS.length - 1]
}
export const getPercentileColor = (v: number): string => seuilFor(v).shading
export const getPercentileCssColor = (v: number): string => seuilFor(v).css

// --------------------- Palette du graphique (zones de performance HappyNeuron) ---------------------
// Bandes de fond colorées + ligne médiane. Distincte de SEUILS (qui reste la source
// pour les shadings de cellules dans les tableaux Word — ne pas casser la cohérence là-bas).
export type ZonePerformance = {
  label: 'Excellent' | 'Moyenne haute' | 'Moyenne basse' | 'Fragilité' | 'Difficulté' | 'Difficulté sévère'
  min: number
  css: string
}

export const ZONES: ZonePerformance[] = [
  { label: 'Excellent',         min: 75, css: '#2E7D32' },
  { label: 'Moyenne haute',     min: 50, css: '#66BB6A' },
  { label: 'Moyenne basse',     min: 25, css: '#D4E157' },
  { label: 'Fragilité',         min: 16, css: '#FFA726' },
  { label: 'Difficulté',        min: 7,  css: '#EF6C00' },
  { label: 'Difficulté sévère', min: 0,  css: '#4E342E' },
]

export function zoneFor(value: number): ZonePerformance {
  for (const z of ZONES) if (value >= z.min) return z
  return ZONES[ZONES.length - 1]
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
  } = await import('docx')

  const FONT = 'Calibri'
  const FONT_SIZE_NORMAL = 22
  const FONT_SIZE_TITLE = 32
  const FONT_SIZE_SECTION = 26
  const COLOR_GREEN = '2E7D32'

  // A4 portrait (11906 DXA) - 720 DXA margins chaque côté = 9072 DXA de largeur
  // utilisable. Word refuse les largeurs relatives sur certaines combinaisons
  // (-> "contenu illisible"), donc on spécifie TOUJOURS en DXA.
  const TOTAL_DXA = 9072
  const pctToDxa = (pct: number) => Math.round((TOTAL_DXA * pct) / 100)

  const { formData, structure, fallbackCRBO = '', previousStructure, previousBilanDate } = payload
  const hasStructure = !!structure && !!structure.domains && structure.domains.length > 0
  const hasPrevious = !!previousStructure && !!previousStructure.domains && previousStructure.domains.length > 0

  // Couleur du badge sévérité
  const severiteColors: Record<string, { bg: string; fg: string }> = {
    'Léger':   { bg: 'C8E6C9', fg: '1B5E20' },
    'Modéré':  { bg: 'FFE082', fg: 'E65100' },
    'Sévère':  { bg: 'EF9A9A', fg: '8B0000' },
  }

  // ============ Helpers ============

  const createCell = (text: string, options: { bold?: boolean, width?: number, shading?: string, alignment?: any } = {}) => {
    const { bold = false, width = 25, shading, alignment = AlignmentType.LEFT } = options
    return new TableCell({
      width: { size: pctToDxa(width), type: WidthType.DXA },
      shading: shading ? { type: ShadingType.CLEAR, fill: shading, color: 'auto' } : undefined,
      children: [new Paragraph({
        alignment,
        children: [new TextRun({ text: text || '', bold, size: FONT_SIZE_NORMAL, font: FONT })],
      })],
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        left:   { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
        right:  { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
      },
    })
  }

  const createSectionTitle = (text: string) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: COLOR_GREEN })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: COLOR_GREEN, space: 20, style: BorderStyle.SINGLE, size: 12 } },
  })

  // Graphique style HappyNeuron : bandes de fond colorées par zone de performance,
  // ligne médiane rouge pointillée à P50, barres regroupées par sous-domaine avec
  // séparateurs verticaux et titres de groupe, labels d'épreuve en vertical.
  type ChartGroup = { name: string; bars: { label: string; value: number }[] }
  const generateGroupedBarChart = async (
    groups: ChartGroup[],
    title: string,
    width = 1000,
    height = 480,
  ) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
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

    // ===== Ligne médiane (P50) en pointillé rouge =====
    const yMed = yFor(50)
    ctx.strokeStyle = '#C62828'
    ctx.lineWidth = 1.6
    ctx.setLineDash([6, 4])
    ctx.beginPath(); ctx.moveTo(padLeft, yMed); ctx.lineTo(padLeft + chartW, yMed); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#C62828'
    ctx.font = 'italic bold 9.5px Calibri, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Médiane (P50)', padLeft + 4, yMed - 3)

    // ===== Barres regroupées par sous-domaine =====
    const totalBars = groups.reduce((s, g) => s + g.bars.length, 0)
    if (totalBars === 0) {
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png')!)
      return { data: await blob.arrayBuffer(), width, height }
    }

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

    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png')!)
    return { data: await blob.arrayBuffer(), width, height }
  }

  const imageParagraph = (img: { data: ArrayBuffer; width: number; height: number }) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new ImageRun({
        data: img.data,
        transformation: { width: img.width / 1.6, height: img.height / 1.6 },
      } as any)],
    })

  const calculateAge = () => {
    if (!formData.patient_ddn) return ''
    const birth = new Date(formData.patient_ddn)
    const today = new Date()
    if (isNaN(birth.getTime())) return ''
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    if (today.getDate() < birth.getDate()) months -= 1
    if (months < 0) { years -= 1; months += 12 }
    if (years <= 0) return `${Math.max(0, months)} mois`
    return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
  }

  // ============ Construction du document ============

  // Date du jour de génération (l'ortho rédige souvent plusieurs jours après la passation)
  const bilanDateFormatted = new Date().toLocaleDateString('fr-FR')
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
    new Paragraph({ children: [] }),
  )

  // ===== TITRE =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'COMPTE RENDU DE BILAN ORTHOPHONIQUE', bold: true, size: FONT_SIZE_TITLE, font: FONT })],
      spacing: { before: 200, after: 400 },
    }),
  )

  children.push(createSectionTitle(`Bilan ${formData.bilan_type || ''} du ${bilanDateFormatted}`))

  // ===== PATIENT =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Patient', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
    new Table({
      width: { size: TOTAL_DXA, type: WidthType.DXA },
      columnWidths: [pctToDxa(15), pctToDxa(35), pctToDxa(15), pctToDxa(35)],
      rows: [
        new TableRow({ children: [
          createCell('Prénom :', { width: 15 }),
          createCell(formData.patient_prenom, { bold: true, width: 35 }),
          createCell('Nom :', { width: 15 }),
          createCell(formData.patient_nom, { bold: true, width: 35 }),
        ]}),
        new TableRow({ children: [
          createCell('Âge :', { width: 15 }),
          createCell(`${calculateAge()}${ddnFormatted ? ` (${ddnFormatted})` : ''}`, { width: 35 }),
          createCell('Classe :', { width: 15 }),
          createCell(formData.patient_classe || '', { width: 35 }),
        ]}),
      ],
    }),
    new Paragraph({ children: [] }),
  )

  // ===== MÉDECIN =====
  if (formData.medecin_nom || formData.medecin_tel) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Médecin prescripteur', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Table({
        width: { size: TOTAL_DXA, type: WidthType.DXA },
        columnWidths: [pctToDxa(15), pctToDxa(45), pctToDxa(10), pctToDxa(30)],
        rows: [new TableRow({ children: [
          createCell('Nom :', { width: 15 }),
          createCell(formData.medecin_nom || '', { width: 45 }),
          createCell('Tél :', { width: 10 }),
          createCell(formData.medecin_tel || '', { width: 30 }),
        ]})],
      }),
      new Paragraph({ children: [] }),
    )
  }

  // ===== MOTIF =====
  if (formData.motif) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Motif de consultation', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: formData.motif, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 200 } }),
    )
  }

  // ===== TESTS =====
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Tests pratiqués', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `• ${testsText}`, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 200 } }),
  )

  // ===== BADGE SÉVÉRITÉ GLOBALE =====
  if (hasStructure && structure!.severite_globale) {
    const sev = structure!.severite_globale
    const colors = severiteColors[sev] ?? { bg: 'E0E0E0', fg: '212121' }
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `  Sévérité globale du profil : ${sev}  `,
          bold: true,
          size: FONT_SIZE_NORMAL + 2,
          font: FONT,
          color: colors.fg,
          shading: { type: ShadingType.CLEAR, fill: colors.bg, color: 'auto' },
        } as any)],
      }),
    )
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
        children: [new TextRun({ text: `Bilan initial du ${prevDate}  →  Bilan actuel du ${curDate}`, italics: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '666666' })],
        spacing: { after: 200 },
      }))
    }

    // Calcul stats globales d'évolution
    const prevIndex = new Map<string, { percentile: string; value: number; domain: string }>()
    for (const d of previousStructure!.domains) {
      for (const e of d.epreuves) {
        prevIndex.set(e.nom.toLowerCase().trim(), { percentile: e.percentile, value: e.percentile_value, domain: d.nom })
      }
    }
    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []
    for (const d of structure!.domains) {
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
    const compRows = [
      new TableRow({ children: [
        createCell('Domaine / Épreuve', { bold: true, width: 40, shading: 'E8F5E9' }),
        createCell(previousBilanDate ? new Date(previousBilanDate).toLocaleDateString('fr-FR') : 'Précédent', { bold: true, width: 22, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell(bilanDateFormatted || 'Actuel', { bold: true, width: 22, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell('Δ Évolution', { bold: true, width: 16, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
      ]}),
    ]

    for (const d of structure!.domains) {
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
        const prevLabel = prev ? prev.percentile : '—'
        const curLabel = e.percentile
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
          createCell(`  ${e.nom}`, { width: 40 }), // indentation pour voir que c'est une sous-épreuve du domaine
          createCell(prevLabel, { width: 22, alignment: AlignmentType.CENTER, shading: prev ? getPercentileColor(prev.value) : 'F5F5F5' }),
          createCell(curLabel, { width: 22, alignment: AlignmentType.CENTER, shading: getPercentileColor(e.percentile_value) }),
          new TableCell({
            width: { size: pctToDxa(16), type: WidthType.DXA },
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
        columnWidths: [pctToDxa(40), pctToDxa(22), pctToDxa(22), pctToDxa(16)],
        rows: compRows,
      }),
      new Paragraph({ children: [] }),
    )
  }

  // ===== SYNTHÈSE VISUELLE PAGE 1 — vue HappyNeuron groupée =====
  if (hasStructure) {
    const groups = structure!.domains.map((d) => ({
      name: d.nom,
      bars: d.epreuves.map((e) => ({ label: e.nom, value: e.percentile_value })),
    })).filter((g) => g.bars.length > 0)
    if (groups.length > 0) {
      const recapChart = await generateGroupedBarChart(
        groups,
        'Profil global — percentiles par épreuve',
        1000, 480,
      )
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Synthèse des résultats', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
        imageParagraph(recapChart),
      )
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ===== ANAMNÈSE — JAMAIS de notes brutes =====
  children.push(createSectionTitle('ANAMNÈSE'))
  const anamneseText = hasStructure && structure!.anamnese_redigee?.trim()
    ? structure!.anamnese_redigee.trim()
    : "[À COMPLÉTER — anamnèse non reformulée par l'IA. Reprenez les notes brutes et rédigez un paragraphe fluide.]"
  anamneseText.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.trim(), size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 100 } }))
    }
  })

  // ===== BILAN =====
  children.push(createSectionTitle('BILAN'))

  // Légende (dynamique depuis SEUILS)
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Légende des scores (percentiles) :', size: 18, font: FONT, bold: true })], spacing: { before: 200, after: 100 } }),
    new Table({
      width: { size: TOTAL_DXA, type: WidthType.DXA },
      columnWidths: SEUILS.map(() => pctToDxa(100 / SEUILS.length)),
      rows: [new TableRow({
        children: SEUILS.map(s => createCell(`${s.label} (${s.range})`, { shading: s.shading, width: 100 / SEUILS.length, alignment: AlignmentType.CENTER, bold: true })),
      })],
    }),
    new Paragraph({ children: [] }),
  )

  if (hasStructure) {
    for (const domain of structure!.domains) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: domain.nom, bold: true, size: FONT_SIZE_NORMAL + 2, font: FONT, color: COLOR_GREEN })],
          spacing: { before: 300, after: 120 },
        }),
      )
      const tableRows = [
        new TableRow({ children: [
          createCell('Épreuve', { bold: true, width: 40, shading: 'E8F5E9' }),
          createCell('Score', { bold: true, width: 15, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('É-T', { bold: true, width: 12, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Centile', { bold: true, width: 15, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Interprétation', { bold: true, width: 18, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        ]}),
      ]
      domain.epreuves.forEach((e) => {
        const color = getPercentileColor(e.percentile_value)
        tableRows.push(new TableRow({ children: [
          createCell(e.nom, { width: 40, shading: color }),
          createCell(e.score, { width: 15, alignment: AlignmentType.CENTER, shading: color }),
          createCell(e.et ?? '—', { width: 12, alignment: AlignmentType.CENTER, shading: color }),
          createCell(e.percentile, { width: 15, alignment: AlignmentType.CENTER, shading: color }),
          createCell(e.interpretation, { width: 18, alignment: AlignmentType.CENTER, shading: color }),
        ]}))
      })
      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: [pctToDxa(40), pctToDxa(15), pctToDxa(12), pctToDxa(15), pctToDxa(18)],
          rows: tableRows,
        }),
        new Paragraph({ children: [] }),
      )

      if (domain.epreuves.length > 0) {
        const chart = await generateGroupedBarChart(
          [{ name: '', bars: domain.epreuves.map((e) => ({ label: e.nom, value: e.percentile_value })) }],
          `${domain.nom} — percentiles par épreuve`,
          900, 420,
        )
        children.push(imageParagraph(chart))
      }

      if (domain.commentaire && domain.commentaire.trim()) {
        children.push(new Paragraph({
          children: [new TextRun({ text: domain.commentaire.trim(), size: FONT_SIZE_NORMAL, font: FONT, italics: true })],
          spacing: { after: 200 },
        }))
      }
    }
  } else if (formData.resultats_manuels) {
    // Fallback parsing texte
    const lines = formData.resultats_manuels.split('\n').filter((l) => l.trim())
    if (lines.length > 0) {
      const tableRows = [
        new TableRow({ children: [
          createCell('Épreuve', { bold: true, width: 50, shading: 'E8F5E9' }),
          createCell('Score', { bold: true, width: 20, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('É-T', { bold: true, width: 15, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
          createCell('Centile', { bold: true, width: 15, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        ]}),
      ]
      lines.forEach((line) => {
        const parts = line.split(/[,:]/).map(p => p.trim())
        const epreuve = parts[0] || line
        const score = parts[1] || ''
        const etMatch = line.match(/É-T\s*:\s*([-\d.]+)/i) || line.match(/([-]\d+\.?\d*)/)
        const et = etMatch ? etMatch[1] : ''
        const centileMatch = line.match(/P(\d+)/i) || line.match(/centile\s*:\s*(\d+)/i)
        const centile = centileMatch ? `P${centileMatch[1]}` : ''
        const pVal = centileMatch ? parseInt(centileMatch[1], 10) : 100
        const color = getPercentileColor(pVal)
        tableRows.push(new TableRow({ children: [
          createCell(epreuve, { width: 50 }),
          createCell(score, { width: 20, alignment: AlignmentType.CENTER }),
          createCell(et, { width: 15, alignment: AlignmentType.CENTER }),
          createCell(centile, { width: 15, alignment: AlignmentType.CENTER, shading: color }),
        ]}))
      })
      children.push(
        new Table({
          width: { size: TOTAL_DXA, type: WidthType.DXA },
          columnWidths: [pctToDxa(50), pctToDxa(20), pctToDxa(15), pctToDxa(15)],
          rows: tableRows,
        }),
        new Paragraph({ children: [] }),
      )
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ===== SYNTHÈSE / CONCLUSIONS =====
  children.push(createSectionTitle('SYNTHÈSE ET CONCLUSIONS'))
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
    // Rend un contenu texte avec sous-titres H3 (`**Titre**` seul sur une ligne),
    // inline bold, et saut de paragraphe sur ligne vide.
    const renderRichContent = (content: string) => {
      const lines = content.split('\n')
      let lastWasEmpty = true // évite un vide en tête
      lines.forEach((line) => {
        const t = line.trim()
        if (!t) {
          if (!lastWasEmpty) {
            children.push(new Paragraph({ children: [], spacing: { after: 60 } }))
            lastWasEmpty = true
          }
          return
        }
        lastWasEmpty = false
        const h3Match = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
        if (h3Match) {
          children.push(new Paragraph({
            children: [new TextRun({ text: h3Match[1].trim(), bold: true, size: FONT_SIZE_NORMAL + 2, font: FONT, color: COLOR_GREEN })],
            spacing: { before: 200, after: 100 },
          }))
          return
        }
        children.push(new Paragraph({
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
    // Diagnostic rendu SANS label "Diagnostic orthophonique" — les H3 Markdown
    // dans le texte (Comportement, Points forts, …, Diagnostic) jouent ce rôle.
    renderRichContent(s.diagnostic)

    // Comorbidités détectées (filtre strings vides)
    const comorbidites = (s.comorbidites_detectees ?? []).filter(c => c && c.trim().length > 0)
    if (comorbidites.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Comorbidités / profils associés suspectés', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: 'E65100' })],
        spacing: { before: 240, after: 80 },
      }))
      for (const c of comorbidites) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `• ${c.trim()}`, size: FONT_SIZE_NORMAL, font: FONT })],
          spacing: { after: 60 },
        }))
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

    pushBlock('Recommandations', s.recommandations)

    // PAP suggestions (filtre strings vides)
    const paps = (s.pap_suggestions ?? []).filter(p => p && p.trim().length > 0)
    if (paps.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Aménagements scolaires proposés (PAP)', bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: '1565C0' })],
        spacing: { before: 240, after: 80 },
      }))
      for (const p of paps) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `✓ ${p.trim()}`, size: FONT_SIZE_NORMAL, font: FONT })],
          spacing: { after: 60 },
        }))
      }
    }

    pushBlock('Conclusion', s.conclusion)
  } else {
    fallbackCRBO.split('\n').forEach((line) => {
      const t = line.trim()
      if (!t) { children.push(new Paragraph({ children: [] })); return }
      const isHeader = /^[A-ZÉÈÀÊÂÎÔÛÇ\s]+:?$/.test(t) && t.length < 50
      children.push(new Paragraph({
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
    new Paragraph({ children: [] }),
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
      children: [new TextRun({ text: 'Orthophoniste', size: FONT_SIZE_NORMAL, font: FONT, italics: true })],
    }),
  )

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
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
  const filename = `CRBO_${payload.formData.patient_prenom}_${payload.formData.patient_nom}_${new Date().toISOString().split('T')[0]}.docx`
  saveAs(blob, filename)
}
