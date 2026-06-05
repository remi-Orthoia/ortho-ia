#!/usr/bin/env node
/**
 * Étape 3 du test E2E GréMots : génère le Word à partir de extracted +
 * synthesized obtenus côté Node, en réutilisant generateCRBOWord de
 * lib/word-export.ts.
 *
 * Usage : node scripts/gremots-export-word.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'

// Import direct via tsx loader (--import tsx).
const { generateCRBOWord, buildCRBOFilename } = await import('../lib/word-export.ts')

const extracted = JSON.parse(readFileSync('e2e/.results/test-gremots-manual-extracted.json', 'utf8'))
const synthesized = JSON.parse(readFileSync('e2e/.results/test-gremots-synthesized.json', 'utf8'))

const formData = {
  ortho_nom: 'Mme TESTORTHO',
  ortho_adresse: '12 rue de la Paix',
  ortho_cp: '75002',
  ortho_ville: 'Paris',
  ortho_tel: '01 42 60 12 34',
  ortho_email: 'testortho@example.fr',
  ortho_adeli_rpps: 'N°ADELI : 339010987',
  patient_prenom: 'Henri',
  patient_nom: 'TESTUSER',
  patient_ddn: '1960-04-22',
  patient_classe: 'adulte',
  bilan_date: '2026-06-05',
  bilan_type: 'initial',
  medecin_nom: 'Claire TESTMEDECIN',
  medecin_tel: '',
  medecin_date_prescription: '2026-05-20',
  motif: 'Cognitif',
  test_utilise: ['GréMots'],
  anamnese: "Monsieur TESTUSER, 66 ans, droitier, ancien architecte (NSC 3). Plainte d'aggravation progressive du manque du mot depuis 24 mois. IRM cérébrale récente : atrophie temporale antérieure gauche modérée.",
  format_crbo: 'synthetique',
}

// Construction structure CRBO à partir de extracted + synthesized
const structure = {
  patient_prenom: 'Henri',
  patient_nom: 'TESTUSER',
  anamnese_redigee: extracted.anamnese_redigee,
  motif_reformule: extracted.motif_reformule,
  domains: extracted.domains,
  ...synthesized,
}

const payload = { formData, structure, fallbackCRBO: '' }
const blob = await generateCRBOWord(payload)
const ab = await blob.arrayBuffer()
const filename = buildCRBOFilename(formData)
const outPath = `e2e/.results/${filename}`
writeFileSync(outPath, Buffer.from(ab))
console.log(`✓ Word généré : ${outPath} (${ab.byteLength} octets)`)
