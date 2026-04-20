'use client'

/**
 * Page de test visuel de l'export Word avec 5 domaines couvrant tous les seuils.
 *
 * Accessible sans auth (hors middleware) pour valider le rendu Word rapidement
 * après chaque modification du code de génération. À retirer / protéger avant
 * ouverture publique large.
 */

import { useState } from 'react'
import type { CRBOStructure } from '@/lib/prompts'

const MOCK_STRUCTURE: CRBOStructure = {
  anamnese_redigee:
    "Léa, actuellement scolarisée en CE2, est adressée pour un bilan orthophonique initial à la suite de difficultés persistantes en lecture et en orthographe signalées par l'enseignante. Elle a acquis la marche à 13 mois et ses premiers mots à 22 mois, avec un développement langagier oral considéré dans la norme. Fille aînée d'une fratrie de deux enfants, elle a connu un parcours scolaire régulier sans redoublement jusqu'à cette année. Aucun bilan ORL ni ophtalmologique récent n'est rapporté. Elle manifeste un intérêt marqué pour le dessin et les jeux de construction. Les parents évoquent une fatigabilité importante en fin de journée scolaire et un manque de plaisir apparent lors des activités de lecture.",
  domains: [
    {
      nom: 'Seuils cliniques — échantillon complet',
      commentaire:
        "Échantillon conçu pour couvrir l'ensemble des seuils cliniques : du Normal (P≥25) au Pathologique (P<2). Les couleurs des cellules doivent respecter le dégradé vert → jaune → orange → rouge clair → rouge foncé.",
      epreuves: [
        { nom: 'Épreuve Normal (P50)', score: '18/20', et: '+0.2', percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Normal' },
        { nom: 'Épreuve Normal (P25 = Q1)', score: '14/20', et: '-0.67', percentile: 'Q1 (P25)', percentile_value: 25, interpretation: 'Normal' },
        { nom: 'Épreuve Limite basse (P20)', score: '12/20', et: '-0.84', percentile: 'P20', percentile_value: 20, interpretation: 'Limite basse' },
        { nom: 'Épreuve Fragile (P10)', score: '9/20', et: '-1.28', percentile: 'P10', percentile_value: 10, interpretation: 'Fragile' },
        { nom: 'Épreuve Déficitaire (P5)', score: '7/20', et: '-1.65', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
        { nom: 'Épreuve Pathologique (P1)', score: '3/20', et: '-2.4', percentile: 'P1', percentile_value: 1, interpretation: 'Pathologique' },
      ],
    },
    {
      nom: 'Langage écrit — Exalang 8-11',
      commentaire:
        "La lecture de mots est dans la norme, avec une voie d'adressage fonctionnelle. En revanche, la lecture de non-mots est déficitaire, signant une atteinte de la voie d'assemblage et orientant vers une dyslexie de type phonologique. La leximétrie confirme un ralentissement significatif.",
      epreuves: [
        { nom: 'Lecture de mots', score: '28/30', et: '-0.3', percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Normal' },
        { nom: 'Lecture de non-mots', score: '14/30', et: '-1.75', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
        { nom: 'Leximétrie', score: '58 mots/min', et: '-1.55', percentile: 'P7', percentile_value: 7, interpretation: 'Fragile' },
        { nom: 'DRA — orthographe', score: '6/20', et: '-1.85', percentile: 'P3', percentile_value: 3, interpretation: 'Déficitaire' },
      ],
    },
    {
      nom: 'Métaphonologie',
      commentaire:
        "Fragilité métaphonologique nette, cohérente avec le profil dyslexique. À travailler en priorité en rééducation : conscience phonémique, manipulation syllabique, correspondance grapho-phonémique.",
      epreuves: [
        { nom: 'Acronymes', score: '5/10', et: '-1.4', percentile: 'P10', percentile_value: 10, interpretation: 'Fragile' },
        { nom: 'Rimes', score: '6/10', et: '-1.1', percentile: 'P15', percentile_value: 15, interpretation: 'Fragile' },
        { nom: 'Suppression phonémique', score: '4/10', et: '-1.7', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
      ],
    },
  ],
  diagnostic:
    "Léa présente un profil cohérent avec une dyslexie-dysorthographie développementale de type phonologique. Les épreuves de lecture et d'orthographe sont déficitaires, en lien avec une fragilité métaphonologique avérée. La voie d'assemblage est significativement touchée tandis que la voie d'adressage reste fonctionnelle. Le langage oral et la compréhension sont préservés.",
  recommandations:
    "Prise en charge orthophonique hebdomadaire de type rééducation du langage écrit, ciblant en priorité la conscience phonémique et l'automatisation du code grapho-phonémique. Mise en place d'aménagements scolaires : temps majoré aux évaluations, polices de lecture adaptées (OpenDyslexic, Arial), utilisation de supports audio pour la compréhension de textes longs. Bilan ophtalmologique et ORL à prévoir si non réalisés récemment.",
  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).",
}

const MOCK_FORM_DATA = {
  ortho_nom: 'Dr Marie DURAND',
  ortho_adresse: '12 rue de la République',
  ortho_cp: '69001',
  ortho_ville: 'Lyon',
  ortho_tel: '04 72 00 00 00',
  ortho_email: 'marie.durand@ortho-test.fr',
  patient_prenom: 'Léa',
  patient_nom: 'MARTIN',
  patient_ddn: '2017-03-15',
  patient_classe: 'CE2',
  bilan_date: '2026-04-20',
  bilan_type: 'initial',
  medecin_nom: 'Dr Bernard LEROY',
  medecin_tel: '04 72 11 22 33',
  motif: "Difficultés en lecture et orthographe signalées par l'enseignante de CE2 depuis la rentrée. Fatigabilité accrue en fin de journée scolaire.",
  anamnese: 'marche 13m / premiers mots 22m / CE2 / aime dessin / pas de bilan ORL',
  test_utilise: ['Exalang 8-11'] as string[],
  resultats_manuels: 'Voir tableau de résultats ci-dessus',
  notes_passation: 'Bilan réalisé sur 2 séances. Bonne coopération de la patiente.',
}

export default function TestWordPage() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setGenerating(true)
    setError('')

    try {
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, BorderStyle, AlignmentType, PageBreak, ShadingType, ImageRun,
      } = await import('docx')
      const fileSaver = await import('file-saver')
      const saveAs = fileSaver.default || fileSaver.saveAs

      const FONT = 'Calibri'
      const FONT_SIZE_NORMAL = 22
      const FONT_SIZE_TITLE = 32
      const FONT_SIZE_SECTION = 26
      const COLOR_GREEN = '2E7D32'

      type SeuilClinique = {
        label: 'Normal' | 'Limite basse' | 'Fragile' | 'Déficitaire' | 'Pathologique'
        min: number
        shading: string
        css: string
        range: string
      }
      const SEUILS: SeuilClinique[] = [
        { label: 'Normal',       min: 25, shading: 'C8E6C9', css: '#81C784', range: 'P ≥ 25' },
        { label: 'Limite basse', min: 16, shading: 'FFF59D', css: '#FFEE58', range: 'P16-24' },
        { label: 'Fragile',      min: 7,  shading: 'FFCC80', css: '#FFB74D', range: 'P7-15' },
        { label: 'Déficitaire',  min: 2,  shading: 'EF9A9A', css: '#E57373', range: 'P2-6' },
        { label: 'Pathologique', min: 0,  shading: 'E57373', css: '#C62828', range: 'P < 2' },
      ]
      const seuilFor = (v: number) => { for (const s of SEUILS) if (v >= s.min) return s; return SEUILS[SEUILS.length - 1] }
      const getPercentileColor = (v: number) => seuilFor(v).shading
      const getPercentileCssColor = (v: number) => seuilFor(v).css

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
        ctx.fillStyle = '#2E7D32'
        ctx.font = 'bold 16px Calibri, Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(title, 20, 28)
        const padLeft = 50, padRight = 20, padTop = 50, padBottom = 100
        const chartW = width - padLeft - padRight
        const chartH = height - padTop - padBottom
        ctx.strokeStyle = '#E0E0E0'
        ctx.fillStyle = '#666'
        ctx.font = '11px Calibri, Arial, sans-serif'
        ctx.textAlign = 'right'
        for (const tick of [0, 25, 50, 75, 100]) {
          const y = padTop + chartH - (tick / 100) * chartH
          ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(padLeft + chartW, y); ctx.stroke()
          ctx.fillText(`P${tick}`, padLeft - 6, y + 4)
        }
        const yP25 = padTop + chartH - (25 / 100) * chartH
        ctx.strokeStyle = '#4CAF50'; ctx.setLineDash([4, 3])
        ctx.beginPath(); ctx.moveTo(padLeft, yP25); ctx.lineTo(padLeft + chartW, yP25); ctx.stroke()
        ctx.setLineDash([])
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
          children: [new ImageRun({ data: img.data, transformation: { width: img.width / 1.6, height: img.height / 1.6 } } as any)],
        })

      const formData = MOCK_FORM_DATA
      const structure = MOCK_STRUCTURE

      const bilanDateFormatted = new Date(formData.bilan_date).toLocaleDateString('fr-FR')
      const ddnFormatted = new Date(formData.patient_ddn).toLocaleDateString('fr-FR')
      const age = '9 ans et 1 mois'

      const children: any[] = []

      children.push(
        new Paragraph({ children: [new TextRun({ text: formData.ortho_nom, size: FONT_SIZE_NORMAL, font: FONT, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: 'Orthophoniste', size: FONT_SIZE_NORMAL, font: FONT })] }),
        new Paragraph({ children: [new TextRun({ text: formData.ortho_adresse, size: FONT_SIZE_NORMAL, font: FONT })] }),
        new Paragraph({ children: [new TextRun({ text: `${formData.ortho_cp} ${formData.ortho_ville}`, size: FONT_SIZE_NORMAL, font: FONT })] }),
        new Paragraph({ children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'COMPTE RENDU DE BILAN ORTHOPHONIQUE — TEST', bold: true, size: FONT_SIZE_TITLE, font: FONT })],
          spacing: { before: 200, after: 400 },
        }),
      )

      children.push(createSectionTitle(`Bilan ${formData.bilan_type} du ${bilanDateFormatted}`))

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
              createCell(`${age} (${ddnFormatted})`, { width: 35 }),
              createCell('Classe :', { width: 15 }),
              createCell(formData.patient_classe, { width: 35 }),
            ]}),
          ],
        }),
        new Paragraph({ children: [] }),
      )

      // Synthèse page 1
      const recapBars = structure.domains.map((d) => {
        const values = d.epreuves.map((e) => e.percentile_value).filter((v) => typeof v === 'number')
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
        return { label: d.nom, value: avg }
      })
      const recapChart = await generateBarChart(recapBars, 'Synthèse — percentile moyen par domaine', 900, 380)
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Synthèse des résultats', size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
        imageParagraph(recapChart),
      )

      children.push(new Paragraph({ children: [new PageBreak()] }))

      // ANAMNÈSE
      children.push(createSectionTitle('ANAMNÈSE'))
      structure.anamnese_redigee.split('\n').forEach((line) => {
        if (line.trim()) {
          children.push(new Paragraph({ children: [new TextRun({ text: line.trim(), size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 100 } }))
        }
      })

      // BILAN
      children.push(createSectionTitle('BILAN'))
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

      for (const domain of structure.domains) {
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

        if (domain.commentaire) {
          children.push(new Paragraph({
            children: [new TextRun({ text: domain.commentaire.trim(), size: FONT_SIZE_NORMAL, font: FONT, italics: true })],
            spacing: { after: 200 },
          }))
        }
      }

      children.push(new Paragraph({ children: [new PageBreak()] }))

      children.push(createSectionTitle('SYNTHÈSE ET CONCLUSIONS'))
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
      pushBlock('Diagnostic orthophonique', structure.diagnostic)
      pushBlock('Recommandations', structure.recommandations)
      pushBlock('Conclusion', structure.conclusion)

      const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
      })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `CRBO_TEST_5_seuils_${new Date().toISOString().split('T')[0]}.docx`)
    } catch (err: any) {
      setError(err.message || String(err))
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Test export Word — 5 seuils cliniques</h1>
        <p className="mt-2 text-gray-600">
          Génère un Word de démonstration avec des données fictives couvrant tous les seuils :
          P50, P25, P20, P10, P5, P1. Permet de vérifier visuellement les couleurs, la colonne
          Interprétation, le graphique page 1 et la reformulation de l&apos;anamnèse.
        </p>

        <div className="mt-6 grid grid-cols-5 gap-2 text-xs">
          {[
            { label: 'Normal', range: 'P50 / P25', bg: '#C8E6C9' },
            { label: 'Limite basse', range: 'P20', bg: '#FFF59D' },
            { label: 'Fragile', range: 'P10', bg: '#FFCC80' },
            { label: 'Déficitaire', range: 'P5', bg: '#EF9A9A' },
            { label: 'Pathologique', range: 'P1', bg: '#E57373' },
          ].map(s => (
            <div key={s.label} className="rounded p-2 text-center border" style={{ backgroundColor: s.bg }}>
              <p className="font-bold text-gray-900">{s.label}</p>
              <p className="text-gray-700">{s.range}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={generating}
          className="mt-8 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {generating ? 'Génération en cours…' : 'Télécharger le Word de test'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Erreur : {error}
          </div>
        )}

        <div className="mt-8 text-xs text-gray-500 border-t pt-4">
          <p className="font-semibold text-gray-700 mb-1">À vérifier dans le Word :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Page 1 : graphique barres avec 3 domaines, couleurs cohérentes par valeur.</li>
            <li>Section BILAN : légende des 5 seuils en haut, colonne &ldquo;Interprétation&rdquo; présente.</li>
            <li>P50 et P25 en vert (Normal), P20 en jaune, P10 en orange, P5 en rouge clair, P1 en rouge foncé.</li>
            <li>Anamnèse : paragraphe fluide (jamais les notes brutes).</li>
            <li>Diagnostic / Recommandations / Conclusion bien séparés.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
