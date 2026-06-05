#!/usr/bin/env node
/**
 * Test end-to-end GréMots :
 * 1. Génère un PDF simulant un rapport HappyNeuron Pro rempli (profil APP
 *    sémantique d'un patient adulte 66 ans NSC 3).
 * 2. Appelle Claude (claude-sonnet-4-6) avec le tool d'extraction GréMots
 *    pour valider que le PDF est correctement parsé.
 * 3. Affiche le JSON structuré extrait et le sauve.
 *
 * Usage : node scripts/gremots-e2e-test.mjs
 */

import PDFDocument from 'pdfkit'
import { writeFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { GREMOTS_EXTRACT_TOOL, GREMOTS_EXTRACT_PROMPT } from '../lib/prompts/extraction/gremots.ts'

loadEnv({ path: '.env.local' })

const OUT_PDF = 'e2e/.results/test-gremots-henri.pdf'

function buildPdf() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: {
      Title: 'Rapport GréMots — TESTUSER Henri',
      Author: 'HappyNeuron Pro',
    }})
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(14).font('Helvetica-Bold').text('RAPPORT GRÉMOTS — HAPPYNEURON PRO', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(9).font('Helvetica').text("Évaluation du langage dans les pathologies neurodégénératives (collectif GréMots, 2016, De Boeck Supérieur / HappyNeuron 2021)", { align: 'center' })

    doc.moveDown(1)
    doc.fontSize(11).font('Helvetica-Bold').text('Identification du patient')
    doc.fontSize(10).font('Helvetica')
    doc.text("Nom : TESTUSER")
    doc.text("Prénom : Henri")
    doc.text("Date de naissance : 22/04/1960   Âge : 66 ans")
    doc.text("Niveau socio-culturel (NSC) : 3 (post-Bac, ancien architecte)")
    doc.text("Tranche d'âge d'étalonnage : 60-69 ans")
    doc.text("Date de passation : 05/06/2026")
    doc.text("Examinatrice : Mme TESTORTHO, orthophoniste (N° ADELI 339010987)")

    doc.moveDown(1)
    doc.fontSize(11).font('Helvetica-Bold').text("Synthèse globale")
    doc.fontSize(10).font('Helvetica')
    doc.text("Le patient présente un tableau de manque du mot progressif depuis 24 mois, une atteinte de la dénomination orale d'objets et de personnes célèbres, et une fluence sémantique sévèrement déficitaire contrastant avec une fluence phonémique relativement préservée.")

    doc.moveDown(1)
    doc.fontSize(11).font('Helvetica-Bold').text("Résultats par épreuve (scoring 3 niveaux : Strict / Large / Erreur)")
    doc.fontSize(9).font('Helvetica')
    doc.moveDown(0.3)

    const rows = [
      ['1', "Entretien / Langage spontané", "QUALITATIF", "—", "Fluidité préservée, débit normal, discours appauvri lexicalement, mots passe-partout (« chose », « truc »), périphrases, hyperonymes. Pas de trouble articulatoire ni d'agrammatisme. Conscience modérée du trouble."],
      ['2', "Répétition de mots", "Strict 18 / Large 1 / Erreur 1 (/20)", "Temps 105 s", "P50-P75 — préservé"],
      ['3', "Répétition de phrases", "Strict 14 / Large 1 / Erreur 0 (/15)", "Temps 285 s", "P50-P75 — préservé"],
      ['4', "Fluences verbes (1 min)", "9 verbes produits", "60 s", "P11-P25 — zone de fragilité"],
      ['5', "Fluences fruits (1 min)", "5 items produits", "60 s", "P1-P5 — difficulté sévère (marqueur APP sémantique)"],
      ['6', "Fluences lettre V (1 min)", "11 mots produits", "60 s", "P26-P49 — moyenne basse, préservé vs sémantique"],
      ['7', "Exécution d'ordres", "Strict 22 / Large 0 / Erreur 8 (/30)", "—", "P11-P25 — zone de fragilité"],
      ['8', "Dénomination orale, objets", "Strict 14 / Large 6 / Erreur 20 (/40)", "Temps 720 s", "P1-P5 — difficulté sévère. Paraphasies sémantiques : « animal » pour zèbre, « fruit » pour ananas. Circonlocutions : « c'est petit, pour rassembler des papiers » pour trombone. Dénominations vides : « truc », « machin »."],
      ['9', "Dénomination orale, actions", "Strict 22 / Large 5 / Erreur 13 (/40)", "Temps 540 s", "P11-P25 — zone de fragilité"],
      ['10', "Dénomination personnes célèbres", "Strict 4 / Large 0 / Erreur 26 (/30)", "Temps 450 s", "P1-P5 — effondrement. Ne reconnaît plus De Gaulle, Brigitte Bardot, Jean Reno ; produit « un homme connu », « une dame »."],
      ['11', "Élaboration de phrases", "Strict 14 / Large 0 / Erreur 1 (/15)", "—", "P50-P75 — syntaxe préservée"],
      ['12', "Discours narratif", "Strict 18 / Large 0 / Erreur 12 (/30)", "—", "P11-P25 — appauvrissement lexical, structure narrative préservée"],
      ['13', "Compréhension syntaxique", "Strict 25 / Large 0 / Erreur 5 (/30)", "—", "P26-P49 — moyenne basse"],
      ['14', "Lecture à voix haute de mots", "Strict 32 / Large 0 / Erreur 8 (/40)", "Temps 180 s", "P11-P25 — 8 régularisations sur mots irréguliers : « femme » lu /fɛm/, « monsieur » lu /mɔ̃sjœʁ/. Atteinte voie d'adressage."],
      ['15', "Lecture à voix haute logatomes", "Strict 18 / Large 0 / Erreur 2 (/20)", "Temps 90 s", "P50-P75 — voie d'assemblage préservée"],
      ['16', "Vérification mot oral / photo", "Strict 28 / Large 0 / Erreur 12 (/40)", "—", "P11-P25 — erreurs sur distracteurs sémantiques proches"],
      ['17', "Écriture automatique", "Strict 8 / Large 0 / Erreur 2 (/10)", "—", "P26-P49 — moyenne basse"],
      ['18', "Écriture sous dictée de mots", "Strict 30 / Large 0 / Erreur 10 (/40)", "—", "P11-P25 — régularisations sur mots irréguliers"],
      ['19', "Écriture sous dictée logatomes", "Strict 18 / Large 0 / Erreur 2 (/20)", "—", "P50-P75 — voie d'assemblage préservée"],
      ['20', "Écriture sous dictée de phrases", "Strict 22 / Large 0 / Erreur 8 (/30)", "—", "P26-P49 — moyenne basse"],
      ['21', "Compréhension de texte écrit", "Strict 14 / Large 0 / Erreur 6 (/20)", "—", "P11-P25 — zone de fragilité"],
      ['22', "Vérification mot écrit / photo", "Strict 26 / Large 0 / Erreur 14 (/40)", "—", "P11-P25 — accès sémantique depuis l'entrée écrite atteint"],
    ]

    for (const [num, nom, score, temps, obs] of rows) {
      if (doc.y > 720) doc.addPage()
      doc.font('Helvetica-Bold').text(`Épreuve ${num} — ${nom}`)
      doc.font('Helvetica').fontSize(9)
      doc.text(`Score : ${score}    ${temps !== '—' ? `Temps : ${temps}` : ''}`)
      doc.text(`Observation : ${obs}`)
      doc.moveDown(0.3)
    }

    if (doc.y > 700) doc.addPage()
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica-Bold').text("Synthèse profil")
    doc.fontSize(10).font('Helvetica')
    doc.text("Dissociation : atteinte sémantique massive (fluence fruits P1-P5, dénomination objets P1-P5, personnes célèbres P1-P5, lecture/écriture mots irréguliers atteintes) vs préservation phonologique (répétition mots/phrases P50-P75, fluence phonémique préservée, lecture/écriture logatomes P50-P75) et syntaxique (élaboration de phrases P50-P75).")

    doc.end()
  })
}

const pdfBuffer = await buildPdf()
writeFileSync(OUT_PDF, pdfBuffer)
console.log(`✓ PDF généré : ${OUT_PDF} (${pdfBuffer.length} octets)`)

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY manquant dans .env.local')
  process.exit(1)
}
const anthropic = new Anthropic({ apiKey })

console.log('\n→ Appel claude-sonnet-4-6 avec extract_gremots_results...')
const base64 = pdfBuffer.toString('base64')
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 8192,
  tools: [GREMOTS_EXTRACT_TOOL],
  tool_choice: { type: 'tool', name: 'extract_gremots_results' },
  messages: [{
    role: 'user',
    content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
      { type: 'text', text: GREMOTS_EXTRACT_PROMPT },
    ],
  }],
})

const toolUse = message.content.find((b) => b.type === 'tool_use')
if (!toolUse) {
  console.error('❌ Pas de tool_use dans la réponse')
  process.exit(1)
}

console.log(`← Tokens : ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`)
const extracted = toolUse.input
writeFileSync('e2e/.results/test-gremots-extracted.json', JSON.stringify(extracted, null, 2))
console.log('\n=== EXTRACTION COMPLÈTE ===')
console.log(`NSC : ${extracted.nsc}`)
console.log(`Tranche d'âge : ${extracted.trancheAge}`)
console.log(`Nombre d'épreuves extraites : ${extracted.epreuves.length}`)
console.log('\nDétail :')
for (const e of extracted.epreuves) {
  const scoreLine = [
    e.strict && `Strict ${e.strict}`,
    e.large && `Large ${e.large}`,
    e.erreur && `Erreur ${e.erreur}`,
  ].filter(Boolean).join(' / ')
  const tempsLine = e.temps ? `Temps ${e.temps}` : ''
  const pctLine = e.percentile ? `[${e.percentile}]` : ''
  const obsTrunc = (e.observation || e.qualitative_only || '').slice(0, 80)
  console.log(`  ${e.key.padEnd(34)} ${scoreLine.padEnd(35)} ${tempsLine.padEnd(12)} ${pctLine.padEnd(11)} ${obsTrunc}${obsTrunc.length === 80 ? '…' : ''}`)
}
console.log('\n✓ Sauvé : e2e/.results/test-gremots-extracted.json')
