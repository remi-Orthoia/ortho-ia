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
import { splitCrboByGrilleSections } from '@/lib/bilans/math/split-crbo'

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

// Palette pastilles — couleurs Word (fond + texte).
//
// Retour utilisateur 2026-05-26 : les cellules "rouges" apparaissaient
// rosees, pas franchement rouges. Cause : on utilisait les tons Material
// 100 (tres pales), trop proches du beige. On passe sur Tailwind 300 qui
// est sature moyen et reste lisible avec un texte sombre (les couleurs
// COLOR_TEXT en 800 gardent le contraste).
//
// Hex utilises :
//   vert  C8E6C9 (Material 100) → 86EFAC (Tailwind green-300)
//   orange FFE0B2 (Material 100) → FCD34D (Tailwind amber-300)
//   rouge FFCDD2 (Material 100) → FCA5A5 (Tailwind red-300)
//   gris  inchange (F3F4F6 = Tailwind gray-100, neutre OK)
const COLOR_SHADING: Record<PastilleEtat, string | undefined> = {
  gris: 'F3F4F6',
  vert: '86EFAC',
  orange: 'FCD34D',
  rouge: 'FCA5A5',
}
const COLOR_TEXT: Record<PastilleEtat, string> = {
  gris: '6B7280',
  vert: '14532D',  // green-900 sombre, contraste fort sur green-300
  orange: '78350F', // amber-900
  rouge: '7F1D1D',  // red-900
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
    TableLayoutType, LevelFormat,
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

  // ===== SPLIT CRBO + RENDU INTERLEAVED =====
  // Le CRBO genere est decoupe par sections de grille (matching par
  // keywords sur les H2 markdown). On rend dans l'ordre :
  //   head (Motif / Anamnese / Bilan realise) →
  //   "Resultats detailles du bilan" + Legende →
  //   pour chaque section : grille + chunk markdown de cette section →
  //   tail (Diagnostic / Projet therapeutique)
  // Demande utilisateur 2026-05-26 : rapprocher visuellement les
  // commentaires d'epreuve de leur grille d'origine, plutot que de tout
  // mettre en bloc apres toutes les grilles.
  const crboSplit = splitCrboByGrilleSections(crboText, grille)

  /**
   * Parse un fragment markdown du CRBO et pousse les paragraphes / listes
   * dans `children`. Reprend exactement la logique de l'ancien for-loop
   * lignes 420-470 (titres, listes, bullets, paragraphes inline-bold).
   */
  const renderMarkdownChunk = (chunkText: string) => {
    if (!chunkText.trim()) return
    const chunkLines = chunkText.split('\n')
    let lastWasEmpty = true
    for (const raw of chunkLines) {
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
      // Liste numerotee — vraie liste Word native
      const numMatch = t.match(/^(\d+)[.)]\s+(.+)$/)
      if (numMatch) {
        children.push(new Paragraph({
          numbering: { reference: 'math-numbered', level: 0 },
          spacing: { after: 60 },
          children: parseBoldRunsAsRuns(numMatch[2], text),
        }))
        continue
      }
      // Liste a puces — vraie liste Word native
      const bulletMatch = t.match(/^[-*]\s+(.+)$/)
      if (bulletMatch) {
        children.push(new Paragraph({
          numbering: { reference: 'math-bullets', level: 0 },
          spacing: { after: 40 },
          children: parseBoldRunsAsRuns(bulletMatch[1], text),
        }))
        continue
      }
      // Paragraphe normal avec inline bold
      children.push(para(parseBoldRunsAsRuns(t, text), { after: 80, alignment: AlignmentType.JUSTIFIED }))
    }
  }

  // 1. HEAD : Motif / Anamnese / Bilan realise (avant les grilles)
  renderMarkdownChunk(crboSplit.head)

  // 2. Titre "Resultats detailles du bilan" + Legende couleurs (commune
  // aux 3 grilles, donc placee une fois avant le bloc grilles).
  children.push(
    para([text('Résultats détaillés du bilan', { bold: true, color: COLOR_GREEN, size: FONT_SIZE_SECTION })], { before: 300, after: 100 }),
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
      { after: 200 },
    ),
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
    // Largeur fixe pour la colonne Niveau : juste assez pour "Cycle III"
    // (9 chars) sans casser, et le subLabel quand mergeNiveauxByLabel est OFF.
    // 1300 DXA ~= 2.3 cm — assez pour "Cycle III (3e trim)" en cas de
    // sub-label long. Le reste de la largeur est partage equitablement entre
    // les colonnes sous-epreuves pour eviter les coupures de mots dans les
    // intitules longs ("DENOMBREMENT", "TRANSCODAGE", "CLASSIFICATIONS").
    const NIVEAU_COL_DXA = 1300
    const remainingDXA = TOTAL_DXA - NIVEAU_COL_DXA
    const subEpreuveColWidth = flatSousEpreuves.length > 0
      ? Math.floor(remainingDXA / flatSousEpreuves.length)
      : remainingDXA
    const colWidths = [NIVEAU_COL_DXA, ...new Array(flatSousEpreuves.length).fill(subEpreuveColWidth)]
    // Absorbe l'arrondi sur la dernière colonne pour atteindre TOTAL_DXA pile.
    if (flatSousEpreuves.length > 0) {
      const sum = colWidths.reduce((a, b) => a + b, 0)
      colWidths[colWidths.length - 1] += TOTAL_DXA - sum
    }

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

    // Pre-calcul des groupes de niveaux fusionnes verticalement (parite avec
    // MatriceSection.tsx). Quand section.mergeNiveauxByLabel est actif (cas
    // B-CMado : Collège×3, Cycle III×2, Cycle II×2), on emet UNE seule cellule
    // Niveau pour chaque groupe consecutif partageant le meme label, avec
    // rowSpan = nb de niveaux dans le groupe. Les lignes suivantes du groupe
    // omettent la cellule Niveau (absorbee par le rowSpan ci-dessus).
    type NiveauGroup = { firstInGroup: boolean; rowspan: number }
    const niveauGroups = new Map<string, NiveauGroup>()
    if (section.mergeNiveauxByLabel) {
      let i = 0
      while (i < section.niveaux.length) {
        const lbl = section.niveaux[i].label
        let j = i + 1
        while (j < section.niveaux.length && section.niveaux[j].label === lbl) j++
        niveauGroups.set(section.niveaux[i].id, { firstInGroup: true, rowspan: j - i })
        for (let k = i + 1; k < j; k++) {
          niveauGroups.set(section.niveaux[k].id, { firstInGroup: false, rowspan: 0 })
        }
        i = j
      }
    } else {
      for (const niv of section.niveaux) {
        niveauGroups.set(niv.id, { firstInGroup: true, rowspan: 1 })
      }
    }

    // Couleur de fond par cycle (parite avec MatriceSection.tsx). Active si
    // section.cycleBackgrounds = true. Couleurs alignees sur le design system
    // Direction A : vert tres clair pour Collège, sable tres clair pour Cycle II.
    const cycleBackgroundFor = (label: string): string | undefined => {
      if (!section.cycleBackgrounds) return undefined
      if (label === 'Collège') return 'EEF2EE'
      if (label === 'Cycle II') return 'F2EAD8'
      return undefined // Cycle III ou autre → fallback default
    }

    // Lignes données : 1 par niveau (sauf cellules Niveau fusionnees absorbees)
    const bodyRows: any[] = []
    for (const niv of section.niveaux) {
      const group = niveauGroups.get(niv.id) ?? { firstInGroup: true, rowspan: 1 }
      const cycleBg = cycleBackgroundFor(niv.label)
      // Quand on fusionne par label, le subLabel ("1"/"2"/"3") est OMIS : on
      // affiche juste "Collège" plutot que "Collège (1)" / "Collège (2)" / etc.
      const nivLabel = section.mergeNiveauxByLabel
        ? niv.label
        : (niv.subLabel ? `${niv.label} (${niv.subLabel})` : niv.label)
      const rowCells: any[] = []
      // Cellule Niveau emise UNIQUEMENT sur la 1ere ligne du groupe (rowSpan).
      // Sur les lignes suivantes du meme groupe, on omet la cellule : Word
      // absorbera l'espace via le rowSpan declare au-dessus.
      if (group.firstInGroup) {
        rowCells.push(cell(nivLabel, {
          width: colWidths[0],
          bold: true,
          size: FONT_SIZE_SMALL,
          alignment: AlignmentType.CENTER,
          shading: cycleBg ?? 'FAFAFA',
          rowSpan: group.rowspan > 1 ? group.rowspan : undefined,
        }))
      }
      flatSousEpreuves.forEach(({ se }, i) => {
        const info = cellMap.get(`${niv.id}|${se.id}`)
        const w = colWidths[1 + i]
        if (!info) {
          // Cellule vide : applique le fond du cycle si actif, sinon transparent.
          // Ca demarque visuellement les blocs Collège / Cycle III / Cycle II
          // a travers la largeur de la grille, parite avec le rendu ecran.
          rowCells.push(cell('', { width: w, size: FONT_SIZE_SMALL, shading: cycleBg }))
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

    // Apres la grille de cette section : on rend le chunk markdown
    // correspondant (commentaires des epreuves de cette section).
    const chunk = crboSplit.bySection.get(section.id)
    if (chunk) renderMarkdownChunk(chunk)
  }

  // ===== TAIL CRBO (Diagnostic / Projet therapeutique) — apres les grilles =====
  renderMarkdownChunk(crboSplit.tail)

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
    // Numbering : 2 listes Word natives (vrais bullets + numerotation) pour
    // que l'ortho puisse editer ses listes dans Word avec les outils
    // standards (Tab/Maj+Tab, retour ligne = nouvel item).
    numbering: {
      config: [
        {
          reference: 'math-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'math-numbered',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
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
