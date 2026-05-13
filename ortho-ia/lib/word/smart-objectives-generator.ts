/**
 * Génération Word (.docx) de la fiche d'objectifs SMART post-CRBO.
 *
 * Module client-only — utilise `import('docx')` dynamique pour préserver
 * le tree-shaking et éviter de gonfler le bundle initial.
 *
 * Mise en page alignée sur le style CRBO : police Bookman Old Style,
 * titres verts (#2E7D32), tableaux à bordures grises claires.
 */

import type { SmartObjectivesPayload } from '@/app/api/generate-smart-objectives/route'

export interface SmartObjectivesPayloadInput {
  patient_prenom: string
  patient_nom: string
  bilan_date: string
  smart: SmartObjectivesPayload
}

function formatFrLong(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateSmartObjectivesWord(input: SmartObjectivesPayloadInput): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, ShadingType, PageOrientation,
  } = await import('docx')

  const FONT = 'Bookman Old Style'
  const FONT_SIZE_NORMAL = 22
  const FONT_SIZE_TITLE = 32
  const FONT_SIZE_SECTION = 26
  const FONT_SIZE_SMALL = 18
  const COLOR_GREEN = '2E7D32'
  const COLOR_GREEN_LIGHT = 'E8F5E9'
  const COLOR_GREY_TEXT = '707070'
  const COLOR_BORDER = 'BFBFBF'

  const TOTAL_DXA = 10466
  const dxaCols = (percents: number[], total: number = TOTAL_DXA): number[] => {
    const cols = percents.slice(0, -1).map((p) => Math.round((total * p) / 100))
    cols.push(total - cols.reduce((a, b) => a + b, 0))
    return cols
  }

  const { patient_prenom, patient_nom, bilan_date, smart } = input
  const bilanDateFr = formatFrLong(bilan_date)

  const createCell = (
    text: string,
    options: {
      bold?: boolean
      dxa: number
      shading?: string
      alignment?: any
      textColor?: string
      size?: number
    },
  ) => {
    const {
      bold = false,
      dxa,
      shading,
      alignment = AlignmentType.LEFT,
      textColor,
      size = FONT_SIZE_NORMAL,
    } = options
    return new TableCell({
      width: { size: dxa, type: WidthType.DXA },
      shading: shading
        ? { type: ShadingType.CLEAR, fill: shading, color: 'auto' }
        : undefined,
      children: [
        new Paragraph({
          alignment,
          children: [new TextRun({ text: text || '', bold, size, font: FONT, color: textColor })],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      },
    })
  }

  const sectionTitle = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: COLOR_GREEN }),
      ],
      spacing: { before: 300, after: 160 },
      border: { bottom: { color: COLOR_GREEN, space: 20, style: BorderStyle.SINGLE, size: 12 } },
    })

  const bullet = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text: `• ${text}`, size: FONT_SIZE_NORMAL, font: FONT })],
      spacing: { after: 80 },
    })

  const children: any[] = []

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'FICHE OBJECTIFS THÉRAPEUTIQUES',
          bold: true,
          size: FONT_SIZE_TITLE,
          font: FONT,
          color: COLOR_GREEN,
        }),
      ],
      spacing: { before: 100, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Patient : ${patient_prenom} ${patient_nom}`,
          size: FONT_SIZE_NORMAL,
          font: FONT,
          bold: true,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Bilan du ${bilanDateFr}`,
          size: FONT_SIZE_SMALL,
          font: FONT,
          color: COLOR_GREY_TEXT,
        }),
      ],
      spacing: { after: 240 },
    }),
  )

  children.push(sectionTitle('OBJECTIFS COURT TERME (3-4 semaines)'))

  smart.objectifs.forEach((obj, idx) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Objectif ${idx + 1} — ${obj.domaine}`,
            bold: true,
            size: FONT_SIZE_NORMAL,
            font: FONT,
            color: COLOR_GREEN,
          }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        alignment: AlignmentType.BOTH,
        shading: { type: ShadingType.CLEAR, fill: COLOR_GREEN_LIGHT, color: 'auto' },
        children: [
          new TextRun({ text: 'Objectif : ', bold: true, size: FONT_SIZE_NORMAL, font: FONT }),
          new TextRun({ text: obj.intitule, size: FONT_SIZE_NORMAL, font: FONT }),
        ],
        spacing: { after: 120 },
      }),
    )

    const cols = dxaCols([28, 72])
    children.push(
      new Table({
        width: { size: TOTAL_DXA, type: WidthType.DXA },
        columnWidths: cols,
        rows: [
          new TableRow({
            children: [
              createCell('Ligne de base', { dxa: cols[0], bold: true, shading: 'F5F5F5' }),
              createCell(obj.ligne_de_base, { dxa: cols[1] }),
            ],
          }),
          new TableRow({
            children: [
              createCell('Critère de maîtrise', { dxa: cols[0], bold: true, shading: 'F5F5F5' }),
              createCell(obj.critere_maitrise, { dxa: cols[1] }),
            ],
          }),
          new TableRow({
            children: [
              createCell('Délai', { dxa: cols[0], bold: true, shading: 'F5F5F5' }),
              createCell(obj.delai, { dxa: cols[1] }),
            ],
          }),
          new TableRow({
            children: [
              createCell('Réévaluation', { dxa: cols[0], bold: true, shading: 'F5F5F5' }),
              createCell(obj.reevaluation, { dxa: cols[1] }),
            ],
          }),
        ],
      }),
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Entraînement ciblé',
            bold: true,
            size: FONT_SIZE_NORMAL,
            font: FONT,
            color: COLOR_GREEN,
          }),
        ],
        spacing: { before: 160, after: 80 },
      }),
    )
    for (const ex of obj.entrainement) {
      children.push(bullet(ex))
    }
  })

  children.push(sectionTitle('STRATÉGIES EVIDENCE-BASED'))
  for (const s of smart.strategies_ebp) {
    children.push(bullet(s))
  }

  children.push(sectionTitle('SUIVI'))
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Prochaine évaluation formelle : ',
          bold: true,
          size: FONT_SIZE_NORMAL,
          font: FONT,
        }),
        new TextRun({ text: smart.prochaine_evaluation, size: FONT_SIZE_NORMAL, font: FONT }),
      ],
      spacing: { before: 120, after: 240 },
    }),
  )

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Document généré par Ortho.ia — usage clinique interne',
          size: FONT_SIZE_SMALL,
          font: FONT,
          italics: true,
          color: COLOR_GREY_TEXT,
        }),
      ],
      spacing: { before: 400 },
    }),
  )

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}

export function buildSmartObjectivesFilename(input: {
  patient_prenom: string
  bilan_date: string
}): string {
  const prenom = (input.patient_prenom || '')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-zà-ÿ])/g, (_m, sep, c) => sep + c.toUpperCase())
  const ref = input.bilan_date ? new Date(input.bilan_date) : new Date()
  const dateFr = (isNaN(ref.getTime()) ? new Date() : ref).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `Objectifs_SMART_${prenom}_${dateFr}.docx`
}

export async function downloadSmartObjectivesWord(
  input: SmartObjectivesPayloadInput,
): Promise<void> {
  const blob = await generateSmartObjectivesWord(input)
  const fileSaver = await import('file-saver')
  const saveAs = fileSaver.default || fileSaver.saveAs
  saveAs(blob, buildSmartObjectivesFilename(input))
}
