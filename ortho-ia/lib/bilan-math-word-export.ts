'use client'

/**
 * Export Word dédié aux bilans de cognition mathématique B-CM / B-CMado.
 *
 * Contrairement aux bilans langage (lib/word-export.ts) qui consomment une
 * CRBOStructure (anamnèse + domaines/épreuves percentile-based + diagnostic),
 * les bilans math s'appuient sur :
 *   - la GRILLE (matrice 2D niveaux × tests + critères)
 *   - le DRAFT (cellules cotées par l'ortho, couleurs)
 *   - le TEXTE CRBO markdown (sections par épreuve + DSM-V + projet)
 *
 * Le tableau Exalang habituel (5 cols Épreuve/Score/É-T/Centile/Interprét.)
 * est remplacé par une reproduction COLORIÉE de la grille remplie par
 * l'ortho — c'est la demande explicite : "remplacer le tableau exalang
 * (pour ce bilan uniquement) par la grille complétée par l'orthophoniste".
 *
 * Layout :
 *   1. En-tête cabinet (nom ortho, adresse, tél, email)
 *   2. Titre + sous-titre (date bilan)
 *   3. Bloc Patient (Prénom/Nom/Âge/Classe)
 *   4. Tests pratiqués
 *   5. Grille coloriée — une matrice par section, cellules colorées selon
 *      la cotation (vert/orange/rouge/gris)
 *   6. Contenu CRBO markdown (Motif/Anamnèse/sections par épreuve/DSM-V/Projet)
 *   7. Signature
 */

import type { BilanMathDraft, GrilleBilan, PastilleEtat } from '@/lib/bilans/math/types'
import { cellKey } from '@/lib/bilans/math/parent-color'

export interface OrthoProfile {
  prenom?: string | null
  nom?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  email?: string | null
  /** Numero ADELI ou RPPS, libelle libre. Affiche en en-tete si rempli. */
  adeli_rpps?: string | null
}

export interface MathWordExportPayload {
  grille: GrilleBilan
  draft: BilanMathDraft
  crboText: string // markdown généré par l'IA
  profile: OrthoProfile | null
  bilanDate?: string // ISO YYYY-MM-DD, défaut = aujourd'hui
}

// Palette pastilles (sync visuelle avec Pastille.tsx + MatriceSection)
// Volontairement saturée pour print, retour direct sur fond blanc en Word.
const COLOR_SHADING: Record<PastilleEtat, string | undefined> = {
  gris: 'F3F4F6',
  vert: 'C8E6C9',
  orange: 'FFE0B2',
  rouge: 'FFCDD2',
}
const COLOR_TEXT: Record<PastilleEtat, string> = {
  gris: '6B7280',
  vert: '1B5E20',
  orange: 'B45309',
  rouge: 'B91C1C',
}
const COLOR_LABEL: Record<PastilleEtat, string> = {
  gris: '—',
  vert: 'OK',
  orange: 'étayage',
  rouge: 'échec',
}

// Police Bookman cohérente avec le Word langage.
const FONT = 'Bookman Old Style'
const FONT_SIZE_NORMAL = 22 // 11pt
const FONT_SIZE_SMALL = 18  // 9pt
const FONT_SIZE_TITLE = 32  // 16pt
const FONT_SIZE_SECTION = 24 // 12pt
const COLOR_GREEN = '2E7D32'
// A4 portrait : largeur utile = 11906 DXA (210mm) - marges. On utilise des
// marges resserrees a 567 DXA (1 cm) sur les 4 cotes pour eviter que la
// grille de cotation (jusqu'a ~9 sous-epreuves par section sur B-CMado +
// colonne Niveau) ne deborde a droite a l'impression. Cela donne 10772 DXA
// utiles, ~3% de plus qu'avec les 720 DXA par defaut Office (1,27 cm).
const TOTAL_DXA = 10772
const PAGE_MARGIN_DXA = 567

function fmtDateFR(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

function computeAgeText(ddnISO: string): string {
  if (!ddnISO) return ''
  const ddn = new Date(ddnISO)
  if (isNaN(ddn.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - ddn.getFullYear()
  let months = now.getMonth() - ddn.getMonth()
  if (now.getDate() < ddn.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years <= 0) return `${Math.max(0, months)} mois`
  return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
}

/** Répartit `total` DXA sur `n` colonnes en absorbant l'arrondi sur la dernière. */
function dxaSplit(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const cols = new Array(n).fill(base)
  cols[n - 1] = total - base * (n - 1)
  return cols
}

export async function generateBilanMathWord(payload: MathWordExportPayload): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, PageBreak, ShadingType, VerticalMergeType,
    TableLayoutType,
  } = await import('docx')

  const { grille, draft, crboText, profile, bilanDate } = payload
  const date = bilanDate ?? new Date().toISOString().slice(0, 10)
  const dateFR = fmtDateFR(date)
  const orthoFullName = `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim()
  const orthoCpVille = `${profile?.code_postal ?? ''} ${profile?.ville ?? ''}`.trim()
  const age = computeAgeText(draft.patient.date_naissance)
  const modeLabel = draft.mode === 'renouvellement' ? 'de renouvellement' : 'initial'

  // -------- Helpers locaux (capturent les imports docx) --------

  const text = (s: string, opts: { bold?: boolean; size?: number; color?: string; italic?: boolean } = {}) =>
    new TextRun({ text: s, bold: opts.bold, italics: opts.italic, size: opts.size ?? FONT_SIZE_NORMAL, font: FONT, color: opts.color })

  const para = (children: any[], opts: { before?: number; after?: number; alignment?: any; indent?: any } = {}) =>
    new Paragraph({
      children,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 0 },
      alignment: opts.alignment,
      indent: opts.indent,
    })

  const cell = (content: string | any[], opts: {
    bold?: boolean
    size?: number
    color?: string
    shading?: string
    alignment?: any
    width: number
    rowSpan?: number
    colSpan?: number
    verticalMerge?: 'restart' | 'continue'
  }) => {
    const runs = Array.isArray(content)
      ? content
      : [text(content, { bold: opts.bold, size: opts.size, color: opts.color })]
    return new TableCell({
      width: { size: opts.width, type: WidthType.DXA },
      shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading, color: 'auto' } : undefined,
      rowSpan: opts.rowSpan,
      columnSpan: opts.colSpan,
      verticalMerge:
        opts.verticalMerge === 'restart' ? VerticalMergeType.RESTART :
        opts.verticalMerge === 'continue' ? VerticalMergeType.CONTINUE : undefined,
      children: [new Paragraph({
        alignment: opts.alignment ?? AlignmentType.LEFT,
        children: runs,
      })],
    })
  }

  const sectionTitle = (label: string, opts: { centered?: boolean } = {}) =>
    para(
      [text(label, { bold: true, size: FONT_SIZE_SECTION, color: COLOR_GREEN })],
      { before: 300, after: 160, alignment: opts.centered ? AlignmentType.CENTER : undefined },
    )

  // -------- Construction du document --------

  const children: any[] = []

  // ===== EN-TÊTE ORTHO =====
  children.push(
    para([text(orthoFullName || '—', { bold: true })]),
    para([text('Orthophoniste')]),
  )
  if (profile?.adresse) children.push(para([text(profile.adresse)]))
  if (orthoCpVille) children.push(para([text(orthoCpVille)]))
  if (profile?.telephone) children.push(para([text(profile.telephone)]))
  if (profile?.email) children.push(para([text(profile.email)]))
  if (profile?.adeli_rpps && profile.adeli_rpps.trim()) {
    children.push(para([text(profile.adeli_rpps.trim())]))
  }
  children.push(para([text('')]))

  // ===== TITRE =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [text('COMPTE RENDU DE BILAN ORTHOPHONIQUE', { bold: true, size: FONT_SIZE_TITLE })],
      spacing: { before: 200, after: 200 },
    }),
    sectionTitle(`Bilan ${modeLabel}${dateFR ? ` du ${dateFR}` : ''}`, { centered: true }),
  )

  // ===== PATIENT =====
  children.push(
    para([text('Patient', { bold: true, color: COLOR_GREEN })], { before: 200, after: 100 }),
  )
  {
    const cols = dxaSplit(TOTAL_DXA, 4)
    children.push(new Table({
      width: { size: TOTAL_DXA, type: WidthType.DXA },
      columnWidths: cols,
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [
          cell('Prénom :', { width: cols[0] }),
          cell(draft.patient.prenom || '—', { width: cols[1], bold: true }),
          cell('Nom :', { width: cols[2] }),
          cell(draft.patient.nom || '—', { width: cols[3], bold: true }),
        ]}),
        new TableRow({ children: [
          cell('Âge :', { width: cols[0] }),
          cell(
            `${age}${draft.patient.date_naissance ? ` (${fmtDateFR(draft.patient.date_naissance)})` : ''}`,
            { width: cols[1] },
          ),
          cell('Classe :', { width: cols[2] }),
          cell(draft.patient.classe || '—', { width: cols[3] }),
        ]}),
      ],
    }))
  }
  children.push(para([text('')]))

  // ===== TESTS PRATIQUÉS =====
  children.push(
    para([text('Tests pratiqués', { bold: true, color: COLOR_GREEN })], { before: 200, after: 100 }),
    para([text(`• ${grille.label} — ${grille.description}`)], { after: 200 }),
  )

  // ===== GRILLE COLORIÉE — remplace le tableau Exalang =====
  children.push(
    para([text('Résultats détaillés du bilan', { bold: true, color: COLOR_GREEN, size: FONT_SIZE_SECTION })], { before: 300, after: 160 }),
  )

  for (const section of grille.sections) {
    // Titre de section
    children.push(
      para([text(section.label, { bold: true, color: COLOR_GREEN })], { before: 200, after: 100 }),
    )

    // Pré-calcule pour chaque (niveauId, sousEpreuveId) le critère qui couvre
    // ce point (s'il existe) + la position dans son éventuelle fusion verticale.
    // map[niv][se] = { criterion, color, isFirst, span } | { kind: 'grise' } | undefined
    type CellInfo =
      | { kind: 'criterion'; criterionLabel: string; color: PastilleEtat; isFirst: boolean; span: number }
      | { kind: 'grise' }
      | undefined
    const cellMap = new Map<string, CellInfo>()

    for (const ep of section.epreuves) {
      for (const se of ep.sousEpreuves) {
        // 1. Critères (potentiellement fusionnés sur plusieurs niveaux)
        for (const cr of se.criteres) {
          if (cr.niveauIds.length === 0) continue
          const state = draft.epreuves[ep.id]
          const color: PastilleEtat = state?.cells[cellKey(se.id, cr.id)] ?? 'gris'
          cr.niveauIds.forEach((nid, idx) => {
            cellMap.set(`${nid}|${se.id}`, {
              kind: 'criterion',
              criterionLabel: cr.label,
              color,
              isFirst: idx === 0,
              span: cr.niveauIds.length,
            })
          })
        }
        // 2. Niveaux grisés (cellules non applicables)
        for (const nid of se.niveauxGrises ?? []) {
          if (!cellMap.has(`${nid}|${se.id}`)) {
            cellMap.set(`${nid}|${se.id}`, { kind: 'grise' })
          }
        }
      }
    }

    // Colonnes : 1 colonne Niveau + 1 colonne par sous-épreuve (à plat).
    const flatSousEpreuves: Array<{ ep: typeof section.epreuves[number]; se: typeof section.epreuves[number]['sousEpreuves'][number] }> = []
    for (const ep of section.epreuves) for (const se of ep.sousEpreuves) flatSousEpreuves.push({ ep, se })

    const nCols = 1 + flatSousEpreuves.length
    const colWidth = Math.floor(TOTAL_DXA / nCols)
    const colWidths = new Array(nCols).fill(colWidth)
    // Absorbe l'arrondi sur la dernière colonne.
    colWidths[nCols - 1] = TOTAL_DXA - colWidth * (nCols - 1)

    // Header row 1 : "Niveau" + label épreuve macro (avec colSpan = nb sous-épreuves)
    const headerRow1Cells: any[] = [
      cell('Niveau', {
        width: colWidths[0],
        bold: true,
        size: FONT_SIZE_SMALL,
        shading: 'E8F5E9',
        alignment: AlignmentType.CENTER,
        rowSpan: 2,
      }),
    ]
    let colOffset = 1
    for (const ep of section.epreuves) {
      const span = ep.sousEpreuves.length
      const widthSum = colWidths.slice(colOffset, colOffset + span).reduce((a, b) => a + b, 0)
      headerRow1Cells.push(cell(ep.label, {
        width: widthSum,
        bold: true,
        size: FONT_SIZE_SMALL,
        shading: 'E8F5E9',
        alignment: AlignmentType.CENTER,
        colSpan: span,
      }))
      colOffset += span
    }

    // Header row 2 : labels sous-épreuves (cellule Niveau du rowSpan 2 = absente)
    const headerRow2Cells: any[] = flatSousEpreuves.map(({ se }, i) =>
      cell(se.label, {
        width: colWidths[1 + i],
        bold: true,
        size: FONT_SIZE_SMALL,
        shading: 'F3F4F6',
        alignment: AlignmentType.CENTER,
      }),
    )

    // Lignes données : 1 par niveau
    const bodyRows: any[] = []
    for (const niv of section.niveaux) {
      const nivLabel = niv.subLabel ? `${niv.label} (${niv.subLabel})` : niv.label
      const rowCells: any[] = [
        cell(nivLabel, {
          width: colWidths[0],
          bold: true,
          size: FONT_SIZE_SMALL,
          alignment: AlignmentType.CENTER,
          shading: 'FAFAFA',
        }),
      ]
      flatSousEpreuves.forEach(({ se }, i) => {
        const info = cellMap.get(`${niv.id}|${se.id}`)
        const w = colWidths[1 + i]
        if (!info) {
          rowCells.push(cell('', { width: w, size: FONT_SIZE_SMALL }))
          return
        }
        if (info.kind === 'grise') {
          rowCells.push(cell('', { width: w, shading: 'E5E5E5', size: FONT_SIZE_SMALL }))
          return
        }
        // Critère : sur la première ligne du span on rend le label, sur les
        // suivantes on continue verticalement (vertical merge docx).
        if (info.isFirst) {
          rowCells.push(cell(info.criterionLabel, {
            width: w,
            shading: COLOR_SHADING[info.color],
            color: COLOR_TEXT[info.color],
            size: FONT_SIZE_SMALL,
            verticalMerge: info.span > 1 ? 'restart' : undefined,
            alignment: AlignmentType.CENTER,
          }))
        } else {
          // Cellule de continuation : vide, fusionnée verticalement.
          rowCells.push(cell('', {
            width: w,
            shading: COLOR_SHADING[info.color],
            size: FONT_SIZE_SMALL,
            verticalMerge: 'continue',
          }))
        }
      })
      bodyRows.push(new TableRow({ children: rowCells }))
    }

    children.push(new Table({
      width: { size: TOTAL_DXA, type: WidthType.DXA },
      columnWidths: colWidths,
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: headerRow1Cells, tableHeader: true }),
        new TableRow({ children: headerRow2Cells, tableHeader: true }),
        ...bodyRows,
      ],
    }))
    children.push(para([text('')]))
  }

  // Légende de la cotation qualitative — utile sur la 1ère lecture du Word.
  children.push(
    para(
      [
        text('Légende couleurs : ', { bold: true, size: FONT_SIZE_SMALL }),
        text('vert = réussite spontanée ', { color: COLOR_TEXT.vert, size: FONT_SIZE_SMALL }),
        text('· ', { size: FONT_SIZE_SMALL }),
        text('orange = réussite après étayage ', { color: COLOR_TEXT.orange, size: FONT_SIZE_SMALL }),
        text('· ', { size: FONT_SIZE_SMALL }),
        text('rouge = échec ', { color: COLOR_TEXT.rouge, size: FONT_SIZE_SMALL }),
        text('· gris = non coté', { color: COLOR_TEXT.gris, size: FONT_SIZE_SMALL }),
      ],
      { before: 80, after: 220 },
    ),
  )

  // ===== CONTENU CRBO MARKDOWN =====
  // Parse léger : **Titre** sur sa ligne = sous-titre vert; "1." / "- " = listes;
  // sinon paragraphe normal.
  const lines = crboText.split('\n')
  let lastWasEmpty = true
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    const t = line.trim()
    if (!t) {
      if (!lastWasEmpty) {
        children.push(para([text('')], { after: 60 }))
        lastWasEmpty = true
      }
      continue
    }
    lastWasEmpty = false

    // **Titre seul**
    const titleAlone = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
    if (titleAlone) {
      children.push(sectionTitle(titleAlone[1].trim()))
      continue
    }
    // **Titre :** suite inline
    const titleInline = t.match(/^\*\*([^*]+)\*\*\s*[:—-]?\s+(.+)$/)
    if (titleInline) {
      children.push(sectionTitle(titleInline[1].trim()))
      children.push(para(parseBoldRunsAsRuns(titleInline[2].trim(), text), { after: 80 }))
      continue
    }
    // Liste numérotée
    const numMatch = t.match(/^(\d+)[.)]\s+(.+)$/)
    if (numMatch) {
      children.push(para(
        [
          text(`${numMatch[1]}. `, { bold: true, color: COLOR_GREEN }),
          ...parseBoldRunsAsRuns(numMatch[2], text),
        ],
        { after: 60, indent: { left: 360 } },
      ))
      continue
    }
    // Liste à puces
    const bulletMatch = t.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      children.push(para(
        [text('• ', { bold: true }), ...parseBoldRunsAsRuns(bulletMatch[1], text)],
        { after: 40, indent: { left: 360 } },
      ))
      continue
    }
    // Paragraphe normal avec inline bold
    children.push(para(parseBoldRunsAsRuns(t, text), { after: 80, alignment: AlignmentType.JUSTIFIED }))
  }

  // ===== SIGNATURE =====
  children.push(
    para([text('')], { before: 300 }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [text(orthoFullName || '', { italic: true })],
      spacing: { before: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [text('Orthophoniste', { italic: true, color: '6b7280', size: FONT_SIZE_SMALL })],
    }),
  )

  // ===== MENTION CONFIDENTIALITE (italique, fin de document) =====
  // Idem rendu langage (lib/word-export.ts) : formulation officielle reprise
  // des CRBO de reference, affichee systematiquement sur tous les bilans.
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 0 },
      children: [text(
        "Document confidentiel soumis au secret médical et légalement réservé en lecture aux seuls responsables légaux et médecin prescripteur, qui en contrôlent la diffusion et l'usage.",
        { italic: true, color: '707070', size: FONT_SIZE_SMALL },
      )],
    }),
  )

  // -------- Document final --------

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: PAGE_MARGIN_DXA, right: PAGE_MARGIN_DXA, bottom: PAGE_MARGIN_DXA, left: PAGE_MARGIN_DXA } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  return blob
}

/** Parse une string avec marqueurs **gras** en TextRun[] (alternance bold/normal). */
function parseBoldRunsAsRuns(
  s: string,
  makeText: (s: string, opts?: { bold?: boolean; italic?: boolean; color?: string; size?: number }) => any,
): any[] {
  const parts = s.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
  return parts.map((p) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return makeText(p.slice(2, -2), { bold: true })
    }
    return makeText(p)
  })
}
