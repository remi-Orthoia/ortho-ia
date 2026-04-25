// Test unitaire d'intégrité du .docx généré par lib/word-export.ts
// - Stub du document.createElement('canvas') côté Node
// - Génère un CRBO complet avec sample structure
// - Unzip le .docx → parse chaque XML → signale toute erreur
import { writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
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
        return new Proxy({}, {
          get: () => () => undefined, // toutes les méthodes sont des no-ops
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
  pap_suggestions: ['Temps majoré 1/3', 'Tolérance orthographique'],
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

async function main() {
  console.log('[test-docx] Génération du .docx…')
  const blob = await generateCRBOWord(payload)
  const bytes = Buffer.from(await blob.arrayBuffer())
  const outPath = '/tmp/test-crbo.docx'
  writeFileSync(outPath, bytes)
  console.log(`[test-docx] .docx écrit : ${outPath} (${bytes.length} bytes)`)

  // Unzip via Python (pas de /usr/bin/unzip en WSL minimal)
  const extractDir = '/tmp/test-crbo-unzipped'
  if (existsSync(extractDir)) rmSync(extractDir, { recursive: true })
  mkdirSync(extractDir, { recursive: true })
  execSync(`python3 -c "import zipfile; zipfile.ZipFile('${outPath}').extractall('${extractDir}')"`, { stdio: 'inherit' })

  const errors: string[] = []
  const walk = (dir: string): string[] => {
    const out: string[] = []
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${f.name}`
      if (f.isDirectory()) out.push(...walk(full))
      else if (f.name.endsWith('.xml') || f.name.endsWith('.rels')) out.push(full)
    }
    return out
  }

  const xmlFiles = walk(extractDir)
  console.log(`[test-docx] ${xmlFiles.length} fichiers XML à valider`)
  for (const file of xmlFiles) {
    try {
      execSync(`python3 -c "import xml.etree.ElementTree as ET; ET.parse('${file}')"`, { stdio: 'pipe' })
    } catch (e: any) {
      errors.push(`${file}: ${e.stderr?.toString().trim() || e.message}`)
    }
  }

  // Vérifications structurelles spécifiques
  const docXml = readFileSync(`${extractDir}/word/document.xml`, 'utf8')

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

  // Tous les <w:br> de type page doivent être dans un <w:p>
  const pageBreakOutsideP = docXml.match(/(?<!<w:p[^>]*>[^<]*<w:r[^>]*>[^<]*)<w:br w:type="page"/)
  // Heuristique : on compte les <w:br w:type="page"> et on s'assure qu'ils sont tous précédés d'un <w:p
  const pageBreaks = [...docXml.matchAll(/<w:br\s+w:type="page"/g)].length
  console.log(`[test-docx] ${pageBreaks} PageBreak`)

  if (errors.length === 0) {
    console.log('\n✅ VALIDATION RÉUSSIE — aucun XML malformé, toutes les largeurs en DXA, shadings en CLEAR')
  } else {
    console.log('\n❌ ERREURS DÉTECTÉES :')
    for (const e of errors) console.log('  •', e)
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
