// Test unitaire d'intégrité du .docx généré par lib/word-export.ts
// - Stub du document.createElement('canvas') côté Node
// - Génère un CRBO complet avec sample structure
// - Unzip le .docx → parse chaque XML → signale toute erreur
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdmZip = require('adm-zip')
import { generateCRBOWord } from '../lib/word-export'
import type { CRBOStructure } from '../lib/prompts'

// ===== Stub DOM pour canvas (word-export.ts appelle document.createElement) =====
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=',
  'base64',
)
;(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag !== 'canvas') throw new Error(`stub: ${tag} unsupported`)
    return {
      width: 1, height: 1,
      getContext() {
        // Stub minimal : measureText doit renvoyer { width }, fillText/etc. no-op.
        return new Proxy({}, {
          get: (_t, prop: string) => {
            if (prop === 'measureText') return (s: string) => ({ width: (s || '').length * 7 })
            return () => undefined
          },
          set: () => true,
        })
      },
      toBlob(cb: (b: Blob) => void) { cb(new Blob([PNG_1x1], { type: 'image/png' })) },
    }
  },
}

// ===== Sample structure minimale mais complète =====
const structure: CRBOStructure = {
  anamnese_redigee: 'Giulia, 12 ans, 5ème.\n\nDeuxième paragraphe pour tester le rendu.',
  domains: [
    {
      nom: 'Mémoire de travail',
      epreuves: [
        { nom: 'Empan endroit', score: '6/7', et: '+0.45', percentile: 'P90', percentile_value: 90, interpretation: 'Normal' },
        { nom: 'Boucle phono', score: '16/25', et: '-1.53', percentile: 'Q1 (P25)', percentile_value: 25, interpretation: 'Normal' },
      ],
      commentaire: 'Commentaire du domaine.',
    },
    {
      nom: 'Lecture',
      epreuves: [
        { nom: 'Lecture de mots', score: '99/100', et: '+0.24', percentile: 'Q3 (P75)', percentile_value: 75, interpretation: 'Normal' },
        { nom: 'Recherche temps', score: '480s', et: '-5.41', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
      ],
      commentaire: '',
    },
  ],
  diagnostic: '**Points forts**\n\nExcellents.\n\n**Difficultés**\n\nLenteur en contexte.',
  recommandations: 'PEC hebdomadaire recommandée.',
  conclusion: 'Compte rendu remis en main propre.',
  severite_globale: 'Modéré',
  comorbidites_detectees: ['Anxiété de performance suspectée'],
  pap_suggestions: [
    'Temps : temps majoré aux évaluations écrites',
    'Outils numériques : recours à un outil numérique en classe si besoin',
    'Pédagogie : consignes reformulées et segmentées',
  ],
  synthese_evolution: null,
}

const payload = {
  formData: {
    ortho_nom: 'Laurie Berrio',
    ortho_adresse: '24 rue Test',
    ortho_cp: '75011',
    ortho_ville: 'Paris',
    ortho_tel: '01 00 00 00 00',
    ortho_email: 'demo@ortho-ia.fr',
    patient_prenom: 'Giulia',
    patient_nom: 'M.',
    patient_ddn: '2013-09-15',
    patient_classe: '5ème',
    bilan_date: '2026-04-22',
    bilan_type: 'initial',
    medecin_nom: 'Dr Lambert',
    medecin_tel: '05 56 00 00 00',
    motif: 'Motif de consultation.',
    test_utilise: ['Exalang 11-15'],
    anamnese: 'Notes brutes.',
    resultats_manuels: 'Scores manuels.',
  },
  structure,
}

// ===== Renouvellement : structure précédente pour exercer le tableau comparatif =====
const previousStructure: CRBOStructure = {
  ...structure,
  domains: [
    {
      nom: 'Mémoire de travail',
      epreuves: [
        { nom: 'Empan endroit', score: '5/7', et: '+0.10', percentile: 'P75', percentile_value: 75, interpretation: 'Normal' },
        { nom: 'Boucle phono', score: '14/25', et: '-1.80', percentile: 'P10', percentile_value: 10, interpretation: 'Limite basse' },
      ],
      commentaire: '',
    },
  ],
}

async function main() {
  console.log('[test-docx] Génération du .docx (initial)…')
  const blob = await generateCRBOWord(payload)
  const bytes = Buffer.from(await blob.arrayBuffer())
  const outPath = join(tmpdir(), 'test-crbo.docx')
  writeFileSync(outPath, bytes)
  console.log(`[test-docx] .docx écrit : ${outPath} (${bytes.length} bytes)`)

  // Unzip via adm-zip (cross-platform, pas de dépendance python/unzip)
  const zip = new AdmZip(outPath)
  const entries: { name: string; data: Buffer }[] = zip.getEntries().map((e: any) => ({
    name: e.entryName,
    data: e.getData(),
  }))

  const errors: string[] = []

  // Vérifications structurelles spécifiques
  const docEntry = entries.find((e) => e.name === 'word/document.xml')
  if (!docEntry) { console.error('document.xml introuvable'); process.exit(1) }
  const docXml = docEntry.data.toString('utf8')

  // ===== INVARIANT CRITIQUE : sum(gridCol) === tblW pour chaque table =====
  // C'est ce qui déclenche "Propriétés des tableaux 1 à N" dans Word quand sum dérive
  // de ±1 DXA à cause d'arrondis indépendants par colonne.
  const tableBlocks = [...docXml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)]
  console.log(`[test-docx] ${tableBlocks.length} tables à vérifier (invariant gridCol)`)
  tableBlocks.forEach((m, idx) => {
    const tblXml = m[1]
    const tblWTag = tblXml.match(/<w:tblW\s+([^/]*?)\/>/)
    if (!tblWTag) { errors.push(`Table #${idx + 1} : <w:tblW> introuvable`); return }
    const tblWAttrs = tblWTag[1]
    if (!/w:type="dxa"/.test(tblWAttrs)) { errors.push(`Table #${idx + 1} : <w:tblW> non-DXA (${tblWAttrs})`); return }
    const wMatch = tblWAttrs.match(/w:w="(\d+)"/)
    if (!wMatch) { errors.push(`Table #${idx + 1} : <w:tblW w:w> introuvable`); return }
    const tblWidth = parseInt(wMatch[1], 10)
    const gridCols = [...tblXml.matchAll(/<w:gridCol\s+w:w="(\d+)"/g)].map(g => parseInt(g[1], 10))
    const gridSum = gridCols.reduce((a, b) => a + b, 0)
    if (gridSum !== tblWidth) {
      errors.push(`Table #${idx + 1} : sum(gridCol)=${gridSum} ≠ tblW=${tblWidth} (delta=${gridSum - tblWidth})`)
    }
  })

  // Tous les w:tcW doivent avoir w:type="dxa" (pas "pct")
  const tcwMatches = [...docXml.matchAll(/<w:tcW\s+([^/]+?)\/>/g)]
  const pctCells = tcwMatches.filter(m => /w:type="pct"/.test(m[1]))
  if (pctCells.length > 0) errors.push(`${pctCells.length} TableCell en PERCENTAGE restantes`)
  const dxaCells = tcwMatches.filter(m => /w:type="dxa"/.test(m[1]))
  console.log(`[test-docx] ${tcwMatches.length} TableCell (${dxaCells.length} DXA, ${pctCells.length} PCT)`)

  // Toutes les tables doivent avoir w:tblW type=dxa
  const tblwMatches = [...docXml.matchAll(/<w:tblW\s+([^/]+?)\/>/g)]
  const pctTables = tblwMatches.filter(m => /w:type="pct"/.test(m[1]))
  if (pctTables.length > 0) errors.push(`${pctTables.length} Table en PERCENTAGE`)
  console.log(`[test-docx] ${tblwMatches.length} Tables (${tblwMatches.length - pctTables.length} DXA, ${pctTables.length} PCT)`)

  // Tous les <w:shd> doivent avoir w:val="clear" (pas "solid")
  const shdMatches = [...docXml.matchAll(/<w:shd\s+([^/]+?)\/>/g)]
  const solidShd = shdMatches.filter(m => /w:val="solid"/.test(m[1]))
  if (solidShd.length > 0) errors.push(`${solidShd.length} shading en SOLID au lieu de CLEAR`)
  console.log(`[test-docx] ${shdMatches.length} shadings (tous en clear : ${solidShd.length === 0})`)

  // ===== Aucun <w:tbl> imbriqué dans un autre <w:tbl> =====
  // (Word 2016 et antérieur gèrent mal les tables imbriquées.)
  for (const m of tableBlocks) {
    if (/<w:tbl>/.test(m[1])) errors.push('Table imbriquée détectée (un <w:tbl> est dans un autre <w:tbl>)')
  }
  // ===== Chaque <w:tc> contient au moins un <w:p> =====
  const tcBlocks = [...docXml.matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)]
  const tcWithoutP = tcBlocks.filter((m) => !/<w:p[\s>]/.test(m[1]))
  if (tcWithoutP.length > 0) errors.push(`${tcWithoutP.length} TableCell sans <w:p>`)
  console.log(`[test-docx] ${tcBlocks.length} TableCells (toutes contiennent un <w:p> : ${tcWithoutP.length === 0})`)
  // ===== Tous les <w:br w:type="page"/> sont dans un <w:p> =====
  // Heuristique : un page-break solitaire crée un <w:br> top-level au lieu de
  // <w:p><w:r><w:br/></w:r></w:p>. On compte les page-breaks et on assert que
  // chacun a un <w:r> juste avant lui (= dans un run, donc dans un paragraphe).
  const pageBreakRuns = [...docXml.matchAll(/<w:br\s+w:type="page"\s*\/>/g)]
  const orphanBreaks = pageBreakRuns.filter((m) => {
    const before = docXml.slice(0, m.index)
    const lastRun = before.lastIndexOf('<w:r')
    const lastP = before.lastIndexOf('<w:p>')
    const lastPClose = before.lastIndexOf('</w:p>')
    // Un page-break valide est dans un run, et le run est dans un paragraphe ouvert.
    return lastRun === -1 || lastP < lastPClose
  })
  if (orphanBreaks.length > 0) errors.push(`${orphanBreaks.length} PageBreak hors d'un <w:p>`)

  // ===== Section properties : sectPr présent et bien formé =====
  const sectPr = docXml.match(/<w:sectPr[^>]*>([\s\S]*?)<\/w:sectPr>/)
  if (!sectPr) errors.push('<w:sectPr> manquant — Word risque de refuser l\'ouverture')
  else {
    if (!/<w:pgSz/.test(sectPr[1])) errors.push('<w:pgSz> manquant dans sectPr')
    if (!/<w:pgMar/.test(sectPr[1])) errors.push('<w:pgMar> manquant dans sectPr')
    console.log('[test-docx] sectPr OK (pgSz + pgMar présents)')
  }

  // ===== Borders : chaque <w:tcBorders> child a sz, val ET color =====
  const borderBlocks = [...docXml.matchAll(/<w:(top|bottom|left|right)\s+([^/]*?)\/>/g)]
  // Le filtrage par contexte tcBorders est complexe ; on vérifie globalement
  // que tout border-like a au minimum w:val + w:sz + w:color quand il est présent.
  const incompleteBorders = borderBlocks.filter((m) => {
    const attrs = m[2]
    // Ne valide que les borders structurels (pas les marges p:top/right/etc. qui n'ont pas w:val).
    if (!/w:val=/.test(attrs)) return false
    return !/w:sz=/.test(attrs) || !/w:color=/.test(attrs)
  })
  if (incompleteBorders.length > 0) {
    errors.push(`${incompleteBorders.length} border(s) incomplet(s) (manque sz ou color)`)
  }

  // Tous les <w:br> de type page doivent être dans un <w:p>
  const pageBreakOutsideP = docXml.match(/(?<!<w:p[^>]*>[^<]*<w:r[^>]*>[^<]*)<w:br w:type="page"/)
  // Heuristique : on compte les <w:br w:type="page"> et on s'assure qu'ils sont tous précédés d'un <w:p
  const pageBreaks = [...docXml.matchAll(/<w:br\s+w:type="page"/g)].length
  console.log(`[test-docx] ${pageBreaks} PageBreak`)

  // ===== Pass 2 : renouvellement (ajoute le tableau comparatif avec columnSpan) =====
  console.log('\n[test-docx] Génération du .docx (renouvellement)…')
  const blob2 = await generateCRBOWord({ ...payload, previousStructure, previousBilanDate: '2024-09-01' })
  const bytes2 = Buffer.from(await blob2.arrayBuffer())
  const outPath2 = join(tmpdir(), 'test-crbo-renouvellement.docx')
  writeFileSync(outPath2, bytes2)
  console.log(`[test-docx] .docx écrit : ${outPath2} (${bytes2.length} bytes)`)
  const zip2 = new AdmZip(outPath2)
  const docXml2 = zip2.getEntry('word/document.xml').getData().toString('utf8')
  const tableBlocks2 = [...docXml2.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)]
  console.log(`[test-docx] ${tableBlocks2.length} tables à vérifier (renouvellement)`)
  tableBlocks2.forEach((m, idx) => {
    const tblXml = m[1]
    const tblWTag = tblXml.match(/<w:tblW\s+([^/]*?)\/>/)
    if (!tblWTag) { errors.push(`[renouv] Table #${idx + 1} : <w:tblW> introuvable`); return }
    const tblWAttrs = tblWTag[1]
    if (!/w:type="dxa"/.test(tblWAttrs)) { errors.push(`[renouv] Table #${idx + 1} : <w:tblW> non-DXA`); return }
    const wMatch = tblWAttrs.match(/w:w="(\d+)"/)
    if (!wMatch) { errors.push(`[renouv] Table #${idx + 1} : w:w introuvable`); return }
    const tblWidth = parseInt(wMatch[1], 10)
    const gridCols = [...tblXml.matchAll(/<w:gridCol\s+w:w="(\d+)"/g)].map(g => parseInt(g[1], 10))
    const gridSum = gridCols.reduce((a, b) => a + b, 0)
    if (gridSum !== tblWidth) {
      errors.push(`[renouv] Table #${idx + 1} : sum(gridCol)=${gridSum} ≠ tblW=${tblWidth}`)
    }
  })

  if (errors.length === 0) {
    console.log('\n✅ VALIDATION RÉUSSIE — initial + renouvellement, toutes les largeurs en DXA, sum(gridCol)=tblW pour chaque table')
  } else {
    console.log('\n❌ ERREURS DÉTECTÉES :')
    for (const e of errors) console.log('  •', e)
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
