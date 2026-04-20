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
      width: { size: width, type: WidthType.PERCENTAGE },
      shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
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

  const generateBarChart = async (bars: { label: string; value: number }[], title: string, width = 900, height = 380) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // Titre
    ctx.fillStyle = '#2E7D32'
    ctx.font = 'bold 16px Calibri, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(title, 20, 28)

    const padLeft = 50, padRight = 20, padTop = 50, padBottom = 100
    const chartW = width - padLeft - padRight
    const chartH = height - padTop - padBottom

    // Grille horizontale
    ctx.strokeStyle = '#E0E0E0'
    ctx.fillStyle = '#666'
    ctx.font = '11px Calibri, Arial, sans-serif'
    ctx.textAlign = 'right'
    for (const tick of [0, 25, 50, 75, 100]) {
      const y = padTop + chartH - (tick / 100) * chartH
      ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(padLeft + chartW, y); ctx.stroke()
      ctx.fillText(`P${tick}`, padLeft - 6, y + 4)
    }

    // Ligne seuil P25 (Normal)
    const yP25 = padTop + chartH - (25 / 100) * chartH
    ctx.strokeStyle = '#4CAF50'; ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(padLeft, yP25); ctx.lineTo(padLeft + chartW, yP25); ctx.stroke()
    ctx.setLineDash([])

    // Barres
    const n = Math.max(bars.length, 1)
    const slot = chartW / n
    const barW = Math.min(slot * 0.7, 70)
    bars.forEach((b, i) => {
      const x = padLeft + i * slot + (slot - barW) / 2
      const v = Math.max(0, Math.min(100, b.value))
      const h = (v / 100) * chartH
      const y = padTop + chartH - h
      ctx.fillStyle = getPercentileCssColor(v)
      ctx.fillRect(x, y, barW, h)
      ctx.strokeStyle = '#424242'; ctx.lineWidth = 1
      ctx.strokeRect(x, y, barW, h)
      ctx.fillStyle = '#212121'
      ctx.font = 'bold 11px Calibri, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`P${Math.round(v)}`, x + barW / 2, y - 4)
      const label = b.label.length > 22 ? b.label.slice(0, 21) + '…' : b.label
      ctx.save()
      ctx.translate(x + barW / 2, padTop + chartH + 8)
      ctx.rotate(-Math.PI / 6)
      ctx.fillStyle = '#333'; ctx.font = '11px Calibri, Arial, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })

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
    const bilan = new Date(formData.bilan_date || new Date().toISOString())
    if (isNaN(birth.getTime()) || isNaN(bilan.getTime())) return ''
    let years = bilan.getFullYear() - birth.getFullYear()
    let months = bilan.getMonth() - birth.getMonth()
    if (bilan.getDate() < birth.getDate()) months -= 1
    if (months < 0) { years -= 1; months += 12 }
    if (years <= 0) return `${Math.max(0, months)} mois`
    return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
  }

  // ============ Construction du document ============

  const bilanDateFormatted = formData.bilan_date ? new Date(formData.bilan_date).toLocaleDateString('fr-FR') : ''
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
      width: { size: 100, type: WidthType.PERCENTAGE },
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
        width: { size: 100, type: WidthType.PERCENTAGE },
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
      new Paragraph({ children: [new TextRun({ text: 'Plaintes du patient', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
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

  // ===== TABLEAU COMPARATIF (renouvellement) =====
  if (hasStructure && hasPrevious) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '📊 Évolution depuis le dernier bilan', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })],
        spacing: { before: 300, after: 100 },
      }),
    )
    if (previousBilanDate) {
      const prevDate = new Date(previousBilanDate).toLocaleDateString('fr-FR')
      children.push(new Paragraph({
        children: [new TextRun({ text: `Comparaison avec le bilan du ${prevDate}`, italics: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '666666' })],
        spacing: { after: 100 },
      }))
    }

    // Construire le tableau : par épreuve commune
    const compRows = [
      new TableRow({ children: [
        createCell('Domaine / Épreuve', { bold: true, width: 40, shading: 'E8F5E9' }),
        createCell('Bilan précédent', { bold: true, width: 22, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell('Bilan actuel', { bold: true, width: 22, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
        createCell('Évolution', { bold: true, width: 16, shading: 'E8F5E9', alignment: AlignmentType.CENTER }),
      ]}),
    ]

    // Index précédent par nom d'épreuve (insensible à la casse)
    const prevIndex = new Map<string, { percentile: string; value: number }>()
    for (const d of previousStructure!.domains) {
      for (const e of d.epreuves) {
        prevIndex.set(e.nom.toLowerCase().trim(), { percentile: e.percentile, value: e.percentile_value })
      }
    }

    for (const d of structure!.domains) {
      for (const e of d.epreuves) {
        const prev = prevIndex.get(e.nom.toLowerCase().trim())
        const prevLabel = prev ? prev.percentile : '—'
        const curLabel = e.percentile
        let arrow = '='
        let arrowColor = '9E9E9E'
        if (prev) {
          const delta = e.percentile_value - prev.value
          if (delta >= 10) { arrow = '↑ Progrès'; arrowColor = '1B5E20' }
          else if (delta <= -10) { arrow = '↓ Régression'; arrowColor = 'C62828' }
          else { arrow = '= Stable'; arrowColor = '616161' }
        } else {
          arrow = 'Nouvelle'
          arrowColor = '1565C0'
        }
        compRows.push(new TableRow({ children: [
          createCell(e.nom, { width: 40 }),
          createCell(prevLabel, { width: 22, alignment: AlignmentType.CENTER }),
          createCell(curLabel, { width: 22, alignment: AlignmentType.CENTER, shading: getPercentileColor(e.percentile_value) }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: arrow, bold: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: arrowColor })],
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
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: compRows }), new Paragraph({ children: [] }))
  }

  // ===== SYNTHÈSE VISUELLE PAGE 1 =====
  if (hasStructure) {
    const recapBars = structure!.domains.map((d) => {
      const values = d.epreuves.map((e) => e.percentile_value).filter((v) => typeof v === 'number')
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      return { label: d.nom, value: avg }
    })
    const recapChart = await generateBarChart(recapBars, 'Synthèse — percentile moyen par domaine', 900, 380)
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Synthèse des résultats', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      imageParagraph(recapChart),
    )
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
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: SEUILS.map(s => createCell(`${s.label} (${s.range})`, { shading: s.shading, width: 20, alignment: AlignmentType.CENTER, bold: true })),
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
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }), new Paragraph({ children: [] }))

      if (domain.epreuves.length > 0) {
        const chart = await generateBarChart(
          domain.epreuves.map((e) => ({ label: e.nom, value: e.percentile_value })),
          `${domain.nom} — percentiles par épreuve`,
          900, 360,
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
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }), new Paragraph({ children: [] }))
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ===== SYNTHÈSE / CONCLUSIONS =====
  children.push(createSectionTitle('SYNTHÈSE ET CONCLUSIONS'))
  if (hasStructure) {
    const s = structure!
    const pushBlock = (label: string, content: string) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: label, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN })],
        spacing: { before: 240, after: 80 },
      }))
      content.split('\n').forEach((line) => {
        const t = line.trim()
        if (t) children.push(new Paragraph({ children: [new TextRun({ text: t, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 60 } }))
      })
    }
    pushBlock('Diagnostic orthophonique', s.diagnostic)

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
      s.synthese_evolution.resume.split('\n').forEach((line: string) => {
        const t = line.trim()
        if (t) children.push(new Paragraph({ children: [new TextRun({ text: t, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 60 } }))
      })
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

  // ===== GLOSSAIRE (si présent, filtre entrées vides) =====
  const glossaire = (hasStructure ? structure!.glossaire ?? [] : []).filter(
    g => g && g.terme && g.terme.trim() && g.definition && g.definition.trim(),
  )
  if (glossaire.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(createSectionTitle('GLOSSAIRE'))
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'Définition des termes techniques employés dans ce compte rendu, à destination des parents et des professionnels non spécialistes.',
        italics: true, size: FONT_SIZE_NORMAL - 2, font: FONT, color: '666666',
      })],
      spacing: { after: 200 },
    }))
    for (const g of glossaire) {
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: `${g.terme.trim()} — `, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN }),
          new TextRun({ text: g.definition.trim(), size: FONT_SIZE_NORMAL, font: FONT }),
        ],
      }))
    }
  }

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
