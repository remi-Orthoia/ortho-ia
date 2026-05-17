/**
 * Test E2E des knowledge EVALEO 6-15 et BETL Hillis-Caramazza.
 *
 * Construit deux cas fictifs réalistes (un EVALEO 6-15 sur enfant CM2 +
 * un BETL sur adulte post-AVC), appelle l'API Claude en mode single-shot,
 * sauvegarde la structure JSON et le Word .docx résultants, puis imprime
 * un résumé des éléments clés pour vérifier que la knowledge a bien été
 * exploitée.
 *
 * Coût estimé : ~$0.15-0.30 par CRBO (~10-20k tokens input + 3-5k output
 * en Claude Sonnet 4.5).
 *
 * Usage :
 *   npx tsx scripts/test-evaleo-betl.ts
 *
 * Sortie : ~/Downloads/CRBO-TEST-EVALEO.{json,docx} + CRBO-TEST-BETL.{json,docx}
 */
import { writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import {
  buildSystemPrompt,
  buildCRBOPrompt,
  CRBO_TOOL,
  type CRBOStructure,
} from '../lib/prompts'
import { generateCRBOWord } from '../lib/word-export'

// Charge .env.local depuis la racine projet
config({ path: '.env.local' })

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY manquant dans .env.local')
  process.exit(1)
}

// Stub canvas (cf. autres scripts test) — évite crash @napi-rs/canvas sur Win
;(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag !== 'canvas') throw new Error(`stub: ${tag}`)
    return {
      width: 1, height: 1,
      getContext: () => ({
        fillStyle: '', strokeStyle: '', font: '', lineWidth: 1,
        fillRect: () => {}, strokeRect: () => {}, fillText: () => {},
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
        clearRect: () => {}, measureText: () => ({ width: 50 }),
        setLineDash: () => {}, save: () => {}, restore: () => {},
      }),
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADklEQVR42mP8/5+hngEFAAYBARUM8N/zAAAAAElFTkSuQmCC',
    }
  },
}

interface TestCase {
  name: string
  testKey: string
  formData: Parameters<typeof buildCRBOPrompt>[0]
  expectedSignals: string[]
}

// =============================================================================
// TEST CASE 1 : EVALEO 6-15 — enfant CM2, dyslexie phonologique suspectée
// =============================================================================
const TEST_EVALEO: TestCase = {
  name: 'EVALEO',
  testKey: 'EVALEO 6-15',
  formData: {
    ortho_nom: 'Marie Dupont',
    ortho_adresse: '12 rue des Lilas',
    ortho_cp: '33000',
    ortho_ville: 'Bordeaux',
    ortho_tel: '05 56 00 00 00',
    ortho_email: 'marie.dupont@ortho.fr',
    patient_prenom: 'Lucas',
    patient_nom: 'TESTPATIENT',
    patient_age: '10 ans 4 mois',
    patient_classe: 'CM2',
    bilan_date_display: '15/05/2026',
    bilan_type: 'initial',
    medecin_nom: 'Dr Pierre Martin',
    medecin_tel: '05 56 11 11 11',
    motif: 'lecture lente et orthographe défaillante signalées par l\'enseignante',
    anamnese: `Lucas est le 2e enfant d'une fratrie de 2. Pas d'antécédents familiaux de troubles spécifiques. Premiers mots à 13 mois, phrases à 24 mois, développement langage oral sans particularité. Audition et vision contrôlées dans la norme. Pas de PEC orthophonique antérieure. Acquisitions scolaires en lecture lentes dès le CP, difficultés persistantes en lecture et orthographe au CM2. L'enseignante de CM2 rapporte une lecture lente, des hésitations, et de nombreuses erreurs orthographiques en dictée. Lucas se dévalorise et évite les devoirs écrits.`,
    test_utilise: 'EVALEO 6-15',
    resultats: `=== EVALEO 6-15 (Launay, Maeder, Roustit, Touzin — Ortho Édition 2018) ===
Niveau scolaire : CM2 (~10-11 ans)

=== Langage Écrit ===
--- Lecture identification ---
Épreuve : Lecture de mots
  Percentile : P5 — Zone de fragilité
  Score brut : 38/100
  Temps : 92 sec
Épreuve : Lecture de pseudomots (Voie d'assemblage)
  Percentile : P5 — Zone de fragilité
  Score brut : 18/40
  Temps : 110 sec
Épreuve : EVAL2M — Lecture de mots en 2 min (Vitesse)
  Percentile : P10 — Moyenne basse
  Score brut : 88 mots
Épreuve : Evalouette — Lecture de texte non signifiant
  Percentile : P5 — Zone de fragilité
Épreuve : La Mouette — Lecture de texte signifiant (test)
  Percentile : P10 — Moyenne basse

--- Lecture compréhension ---
Épreuve : Compréhension écrite de phrases (CP 3e trim → 3e)
  Percentile : P25 — Moyenne basse
  Score brut : 18/30
Épreuve : Compréhension écrite de paragraphe
  Percentile : P50 — Moyenne

--- Orthographe ---
Épreuve : Dictée de pseudomots (Voie d'assemblage en écriture)
  Percentile : P5 — Zone de fragilité
  Score brut : 12 erreurs ONPP
Épreuve : Dictée de mots (Voie d'adressage)
  Percentile : P5 — Zone de fragilité
  Score brut : 18 OL erreurs (8 ODM + 10 ODNM)
Épreuve : Dictée de phrases (Orthographe lex + gram)
  Percentile : P5 — Zone de fragilité
  Score brut : 24 erreurs totales (atteinte linguistique + lexicale + morphologique)
Épreuve : Décision orthographique (CE2 → 3e)
  Percentile : P10 — Moyenne basse

=== Langage Oral ===
--- Phonologie ---
Épreuve : Répétition de pseudomots (Marqueur précoce dyslexie phonologique)
  Percentile : P5 — Zone de fragilité
Épreuve : Dénomination rapide — couleurs (RAN ralenti = marqueur dyslexie)
  Percentile : P10 — Moyenne basse
  Temps : élevé
Épreuve : Dénomination rapide — chiffres
  Percentile : P10 — Moyenne basse

--- Métaphonologie ---
Épreuve : Métaphonologie (Manipulation explicite phonèmes)
  Percentile : P5 — Zone de fragilité
  Score brut : 4/10

--- Lexique-sémantique ---
Épreuve : Dénomination Lexique — phonologie
  Percentile : P50 — Moyenne
Épreuve : Désignation d'images
  Percentile : P50 — Moyenne

--- Morphosyntaxe ---
Épreuve : Compréhension orale de phrases (Prédicteur compréhension écrite)
  Percentile : P25 — Moyenne basse

=== Autres ===
--- Visuo-attentionnel & Inhibition ---
Épreuve : Empan visuo-attentionnel (ms)
  Percentile : P50 — Moyenne
  Score brut : 5.5 lettres
Épreuve : Effet Stroop (Inhibition d'automatismes)
  Percentile : P50 — Moyenne

--- Mémoire à court terme ---
Épreuve : Répétition de chiffres endroit et envers (Empan verbal)
  Percentile : P25 — Moyenne basse
  Score brut : endroit 5 / envers 3

--- Synthèse zones percentiles ---
Excellent (≥ P90) : 0
Moyenne haute (P50-P90) : 0
Moyenne basse (P25-P50) : 4
Fragilité (P10-P25) : 0
Difficulté (P5-P10) : 0
Difficulté sévère (< P5) : 9`,
    notes_analyse: 'Lucas est coopératif mais fatigable. Stratégies de devinette à la lecture. Découragement marqué sur les épreuves orthographiques.',
    comportement_seance: 'Coopératif · Fatigabilité notée · Stratégies d\'évitement · Auto-dévalorisation',
    duree_seance_minutes: 90,
  },
  expectedSignals: [
    'ONPP', 'OL', 'ODM', 'ODNM',  // acronymes EVALEO
    'voie d\'assemblage', 'voie d\'adressage', 'voie d\'adressage',  // modèle dual route
    'Existe-t-il', 'trouble phonologique',  // structure en questions
    'Projet thérapeutique',  // renommage
    'P5', 'P10', 'P25',  // Px uniquement
  ],
}

// =============================================================================
// TEST CASE 2 : BETL — adulte 65 ans, post-AVC G, suspicion aphasie
// =============================================================================
const TEST_BETL: TestCase = {
  name: 'BETL',
  testKey: 'BETL',
  formData: {
    ortho_nom: 'Marie Dupont',
    ortho_adresse: '12 rue des Lilas',
    ortho_cp: '33000',
    ortho_ville: 'Bordeaux',
    ortho_tel: '05 56 00 00 00',
    ortho_email: 'marie.dupont@ortho.fr',
    patient_prenom: 'Jean',
    patient_nom: 'TESTPATIENT',
    patient_age: '65 ans 2 mois',
    patient_classe: 'Retraité (ancien cadre)',
    bilan_date_display: '15/05/2026',
    bilan_type: 'initial',
    medecin_nom: 'Dr Sophie Bernard',
    medecin_tel: '05 56 22 22 22',
    motif: 'bilan langage post-AVC ischémique sylvien gauche (3 mois)',
    anamnese: `Jean, 65 ans, ancien ingénieur informatique à la retraite. AVC ischémique sylvien gauche en février 2026. Récupération motrice satisfaisante. Persistance de difficultés langagières marquées : manque du mot fréquent, paraphasies sémantiques occasionnelles, conscience partielle des difficultés. Lecture lente mais possible. Écriture peu sollicitée. Pas d'antécédents neurologiques. Audition et vision contrôlées (port de lunettes pour la lecture). Profil cognitif global préservé selon le neurologue (MMSE 28/30 fait à 6 semaines post-AVC). NSC élevé (Bac+5). Bilan demandé par le neurologue pour caractériser le trouble du langage et orienter la rééducation orthophonique.`,
    test_utilise: 'BETL',
    resultats: `=== BETL — Batterie d'Évaluation des Troubles Lexicaux (Tran, Ortho Édition 2015) ===

--- 1. Dénomination orale d'images (54 items) ---
Score : 32/54
Temps : 12 min 20s
Percentile : P10 — Moyenne basse
Profil d'erreurs : 12 paraphasies sémantiques (chat→chien, fourchette→couteau, marteau→tournevis), 6 manques du mot avec circonlocution adaptée ("ça sert à attraper les choses" pour pince), 4 erreurs phonologiques mineures (lavabo→vavabo).
Ébauche orale : peu efficace (récupère 3/10 mots avec phonème initial).

--- 2. Dénomination écrite d'images (54 items) ---
Score : 28/54
Percentile : P5 — Zone de fragilité
Profil : difficultés similaires à la dénomination orale, avec en plus 8 erreurs orthographiques sur les mots correctement dénommés. Quelques substitutions sémantiques en écriture.

--- 3. Lecture à voix haute (54 items) ---
Score : 48/54
Temps : 5 min 30s
Percentile : P50 — Moyenne
Profil : lecture globalement préservée, avec quelques erreurs phonologiques (paraphasies phonémiques) sur les mots longs. Pas de difficulté de transposition visuo-phonatoire majeure.

--- 4. Désignation d'images à partir d'un mot entendu (54 items) ---
Score : 40/54
Percentile : P10 — Moyenne basse
Profil : difficultés portant sur les distracteurs sémantiques (confond chien/loup, écharpe/cravate). Distracteurs phonologiques et neutres bien rejetés.

--- 5. Désignation de mots écrits à partir d'un mot entendu (54 items) ---
Score : 42/54
Percentile : P25 — Moyenne basse
Profil : difficultés analogues à la désignation d'images.

--- 6. Appariement sémantique d'images (54 items) ---
Score : 36/54
Percentile : P10 — Moyenne basse
Profil : peinent sur les paires liées par catégorie superordonnée (chien-vache, marteau-clé). Bonnes réponses sur les liens fonctionnels simples.

--- 7. Appariement sémantique de mots écrits (54 items) ---
Score : 34/54
Percentile : P10 — Moyenne basse
Profil : analogue à l'appariement d'images.

--- 8. Questionnaire sémantique (54 items) ---
Score : 38/54
Percentile : P10 — Moyenne basse
Profil : connaissances sémantiques globalement préservées sur les propriétés perceptives (taille, couleur), plus fragiles sur les propriétés fonctionnelles et catégorielles superordonnées.

--- Profil de dénomination dans le discours et la conversation ---
- Manque du mot fréquent en discours spontané (1-2 par minute)
- Paraphasies sémantiques occasionnelles
- Circonlocutions adaptées ("le truc pour…")
- Pas de jargon, pas de néologismes
- Conscience PARTIELLE des troubles (corrections spontanées rares)
- Discours fluent, longueur de phrases préservée
- Pas de dysarthrie associée (parole intelligible)`,
    notes_analyse: 'Patient coopératif, fatigabilité après 45 min. Anxiété marquée sur les épreuves de dénomination. Bonne motivation pour la rééducation. Sa femme rapporte un retentissement social significatif (Jean évite les conversations avec ses petits-enfants par peur du manque du mot).',
    comportement_seance: 'Coopératif · Fatigabilité notée · Anxiété / tension · Autocorrections',
    duree_seance_minutes: 75,
  },
  expectedSignals: [
    'Caramazza', 'Hillis',  // référence schéma
    'lexico-sémantique', 'lexico-phonologique',  // distinction clé
    'paraphasie', 'ébauche',  // termes BETL
    'composant', 'système sémantique', 'lexique phonologique',  // termes modèle
    'Projet thérapeutique',  // renommage
  ],
}

// =============================================================================
// RUN
// =============================================================================
async function runTestCase(tc: TestCase): Promise<{ structure: CRBOStructure; rawJson: any }> {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 TEST CASE : ${tc.name}`)
  console.log(`${'='.repeat(80)}`)

  const systemPrompt = buildSystemPrompt([tc.testKey], 'full', 'complet')
  const userPrompt = buildCRBOPrompt(tc.formData)

  console.log(`📤 System prompt : ${(systemPrompt.length / 1000).toFixed(1)}k chars`)
  console.log(`📤 User prompt   : ${(userPrompt.length / 1000).toFixed(1)}k chars`)

  // Vérifie que la knowledge a bien été injectée
  const knowledgeMarkers = {
    'EVALEO méthodo': systemPrompt.includes('EVALEO 6-15 (6ᵉ édition 03/2024)'),
    'BETL Caramazza': systemPrompt.includes('Caramazza et Hillis (1990)'),
    'Grille SEUILS révisée': systemPrompt.includes('refonte 2026-05'),
    'Phrase synthèse imposée': systemPrompt.includes("On notera parmi les points d'appui"),
    'Px obligatoire': systemPrompt.includes('JAMAIS "Q1", "Q3", "Med'),
  }
  console.log(`📚 Knowledge injectée :`)
  for (const [k, v] of Object.entries(knowledgeMarkers)) {
    console.log(`   ${v ? '✅' : '❌'} ${k}`)
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  console.log(`\n⏳ Appel Anthropic (Claude Sonnet 4.5)...`)
  const t0 = Date.now()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    temperature: 0.3,
    system: systemPrompt,
    tools: [CRBO_TOOL as any],
    tool_choice: { type: 'tool', name: 'generate_crbo' },
    messages: [{ role: 'user', content: userPrompt }],
  })
  const dt = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`✅ Réponse en ${dt}s, input ${message.usage.input_tokens} tokens, output ${message.usage.output_tokens} tokens`)

  const toolUse = message.content.find(b => b.type === 'tool_use') as any
  if (!toolUse) throw new Error('Pas de tool_use dans la réponse')
  const structure = toolUse.input as CRBOStructure

  return { structure, rawJson: toolUse.input }
}

async function checkSignals(structure: CRBOStructure, expected: string[], name: string) {
  // On concatène tout le texte structuré pour grepper
  const allText = JSON.stringify(structure).toLowerCase()
  console.log(`\n🔍 Signaux attendus dans le CRBO ${name} :`)
  let found = 0
  for (const sig of expected) {
    const ok = allText.includes(sig.toLowerCase())
    if (ok) found++
    console.log(`   ${ok ? '✅' : '❌'} "${sig}"`)
  }
  console.log(`\n   → ${found}/${expected.length} signaux trouvés (${Math.round(100 * found / expected.length)}%)`)
}

async function saveOutputs(structure: CRBOStructure, formData: TestCase['formData'], name: string) {
  const downloads = join(homedir(), 'Downloads')
  const jsonPath = join(downloads, `CRBO-TEST-${name}.json`)
  writeFileSync(jsonPath, JSON.stringify(structure, null, 2))
  console.log(`💾 JSON  → ${jsonPath}`)

  // Word
  const blob = await generateCRBOWord({
    formData: {
      ortho_nom: formData.ortho_nom,
      ortho_adresse: formData.ortho_adresse,
      ortho_cp: formData.ortho_cp,
      ortho_ville: formData.ortho_ville,
      ortho_tel: formData.ortho_tel,
      ortho_email: formData.ortho_email,
      patient_prenom: formData.patient_prenom,
      patient_nom: formData.patient_nom,
      patient_ddn: '',
      patient_classe: formData.patient_classe,
      bilan_date: formData.bilan_date_display,
      bilan_type: formData.bilan_type,
      medecin_nom: formData.medecin_nom,
      medecin_tel: formData.medecin_tel,
      motif: formData.motif,
      test_utilise: [formData.test_utilise],
      anamnese: formData.anamnese,
      resultats_manuels: formData.resultats,
    },
    structure,
  })
  const docxPath = join(downloads, `CRBO-TEST-${name}.docx`)
  const arrayBuffer = await blob.arrayBuffer()
  writeFileSync(docxPath, Buffer.from(arrayBuffer))
  console.log(`💾 Word  → ${docxPath}`)
}

async function main() {
  for (const tc of [TEST_EVALEO, TEST_BETL]) {
    try {
      const { structure } = await runTestCase(tc)
      await checkSignals(structure, tc.expectedSignals, tc.name)
      await saveOutputs(structure, tc.formData, tc.name)

      // Imprime quelques extraits du CRBO
      console.log(`\n📄 Diagnostic généré :\n   ${structure.diagnostic?.substring(0, 400).replace(/\n/g, '\n   ')}...`)
      console.log(`\n📄 Projet thérapeutique :\n   ${structure.recommandations?.substring(0, 300).replace(/\n/g, '\n   ')}...`)
    } catch (e: any) {
      console.error(`❌ ${tc.name} a échoué :`, e?.message || e)
    }
  }
  console.log(`\n${'='.repeat(80)}`)
  console.log(`✅ Tests terminés. Fichiers dans ~/Downloads/`)
  console.log(`${'='.repeat(80)}\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
