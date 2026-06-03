/**
 * Test E2E des bilans PREDIMEM et PrediFex (HappyNeuron 2019, Duchêne & Jaillard).
 *
 * Cas fictifs réalistes : NSC 3 (haute réserve cognitive) avec plainte
 * cognitive subjective et tests classiques normaux (cas d'usage prototype
 * de la gamme PREDI). Les deux cas mélangent intentionnellement des zones
 * Vert / Jaune / Orange pour vérifier que le mapping percentile_value est
 * correctement converti en couleurs Word cliniquement alignées.
 *
 * Ce script valide que les corrections de l'audit 2026-06-03 sont prises
 * en compte par le LLM :
 *   - PREDIMEM : 5 zones, vocabulaire HappyNeuron, mapping Jaune → 18
 *     ("Zone de fragilité"), pas "Moyenne basse".
 *   - PrediFex : 4 zones, vocabulaire HappyNeuron, mapping Jaune → 18.
 *   - Pas de contamination Exalang (pas de "Q1/Med/Q3", pas d'étiquette
 *     percentile-based dans `interpretation`).
 *
 * Coût estimé : ~$0.30-0.50 par CRBO (~10-15k tokens input + 3-5k output
 * en Claude Sonnet 4.6).
 *
 * Usage :
 *   npx tsx scripts/test-predimem-predifex.ts
 *
 * Sortie : ~/Downloads/CRBO-TEST-PREDIMEM.{json,docx} + CRBO-TEST-PREDIFEX.{json,docx}
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

config({ path: '.env.local' })

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY manquant dans .env.local')
  process.exit(1)
}

// Stub canvas pour generateCRBOWord côté Node (idem test-evaleo-betl.ts)
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
  /** Signaux qui DOIVENT être présents dans le CRBO (vocabulaire, hypothèses, etc.). */
  expectedSignals: string[]
  /** Signaux qui NE DOIVENT PAS être présents (anti-contamination Exalang, étiologies, etc.). */
  forbiddenSignals: string[]
}

// =============================================================================
// TEST CASE 1 : PREDIMEM — NSC 3, 62 ans, plainte mnésique avec MoCA 28/30
// =============================================================================
const TEST_PREDIMEM: TestCase = {
  name: 'PREDIMEM',
  testKey: 'PREDIMEM',
  formData: {
    ortho_nom: 'Marie Dupont',
    ortho_adresse: '12 rue des Lilas',
    ortho_cp: '33000',
    ortho_ville: 'Bordeaux',
    ortho_tel: '05 56 00 00 00',
    ortho_email: 'marie.dupont@ortho.fr',
    patient_prenom: 'Hélène',
    patient_nom: 'TESTPATIENT',
    patient_age: '62 ans',
    patient_classe: '',
    bilan_date_display: '03/06/2026',
    bilan_type: 'initial',
    medecin_nom: 'Dr Pierre Martin',
    medecin_tel: '05 56 11 11 11',
    motif: 'plainte mnésique subjective depuis 8 mois, oublis de noms et de rendez-vous, signalée également par le conjoint',
    anamnese: `Mme Hélène TESTPATIENT, 62 ans, ancienne cadre dans l'industrie pharmaceutique (NSC 3, Bac+5), consulte sur orientation de son médecin traitant pour plainte mnésique persistante depuis 8 mois. Le conjoint confirme une majoration des oublis (noms de personnes récemment rencontrées, rendez-vous, mots du quotidien). Pas d'antécédent neurologique. HTA traitée et équilibrée, pas de médicament à risque cognitif. Sommeil correct. Pas d'épisode dépressif. MMSE à 30/30, MoCA à 28/30 (1 erreur sur le rappel à 5 mots, 1 erreur sur l'orientation). Bilan biologique sans particularité. IRM cérébrale demandée, en attente.`,
    test_utilise: 'PREDIMEM',
    resultats: `=== PREDIMEM — Protocole d'évaluation et de dépistage des insuffisances de la mémoire ===
Stratification : 3 — 60-69 ans — NSC 3 — ≥ Bac+4 (haute réserve cognitive)

--- Épreuve 01 — Mémoire visuelle d'objets ---
Rappel libre (1a) : 14/25
Reconnaissance différée (1b) : 23/25
Temps : 4 min 20
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : rappelle vite les 7 premiers objets puis décroche. Pas de stratégie de catégorisation spontanée. Reconnaissance bien préservée — dissociation rappel/reconnaissance évoquant un trouble de récupération plutôt que d'encodage.

--- Épreuve 02 — Mémoire d'un texte LU ---
Rappel immédiat (2a) : 8/12
Choix du résumé (2b) : 8/8
Temps : 5 min 40 (texte Lapissoire, seuil étalonné 6 min)
Zone HappyNeuron : Vert clair (M−1σ à M−1,5σ) — performance dans la moyenne basse, à surveiller
Observation : restitution fragmentée des informations centrales du texte, mais bonne identification du résumé. Stratégie de relecture mentionnée.

--- Épreuve 03 — Mémoire de travail ---
Subtest 3a (alternance) : 22/24
Subtest 3b (avec mise en ordre) : 14/22
Temps : 3 min 50
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : 3a très bien réussi, mais effondrement sur 3b (mise en ordre alphabétique + croissant). Sujet conscient de la difficulté, plusieurs auto-corrections.

--- Épreuve 04 — Blasons ---
Blason 1 : 14/14
Blason 2 : 14/16
Blason 3 : 16/18
Blason 4 : 14/16
Temps : 6 min 10
Zone HappyNeuron : Vert foncé (≥ moyenne) — performance préservée
Observation : verbalise systématiquement pour s'aider. Pas de perte de couleur ou de position. Construction visuo-spatiale préservée.

--- Épreuve 06 — Associations sémantiques ---
Associations animaux : 16/16
Associations objets : 16/16
Associations logos : 13/14
Temps : 3 min
Zone HappyNeuron : Vert foncé (≥ moyenne) — performance préservée
Observation : mémoire sémantique préservée. Bon bénéfice à l'indiçage.

--- Épreuve 07 — Mémoire d'un texte ENTENDU ---
Rappel immédiat (7a) : 6/12
Choix du résumé (7b) : 2/8 (2e essai)
Temps : 4 min
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : perte de fil après la 2e phrase. Demande "qui ?" en cours d'écoute. Modalité auditive nettement moins efficiente que la modalité écrite (cf. ép. 02).

--- Épreuve 09 — Mémoire auditive ---
Bruits (6 bruits) : 12/12
Phrases (4 phrases) : 28/40
Temps : 4 min 30
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : bruits parfaitement reconnus. Phrases : pertes morphologiques (omet déterminants, modifie morphologie verbale) sur les 3e et 4e phrases. Boucle phonologique fragilisée.

--- Synthèse zones HappyNeuron ---
Vert foncé (préservé) : 2
Vert clair (moyenne basse) : 1
Jaune (seuil d'alerte) : 4
Orange (difficulté avérée) : 0
Rouge (effondrement) : 0`,
  },
  expectedSignals: [
    // Vocabulaire HappyNeuron correctement utilisé
    'fragilité objectivée',
    'performance préservée',
    'seuil d\'alerte',
    'dépistage',
    'hypothèse de diagnostic',
    // Croisements cliniques attendus (profil récupération + MdT + auditif)
    'récupération',
    'mémoire de travail',
    // Référence aux bilans complémentaires
    'neuropsychologique',
  ],
  forbiddenSignals: [
    // ❌ Étiologies interdites
    'Alzheimer',
    'démence',
    'MCI',
    'syndrome dysexécutif',
    'détérioration cognitive',
    // ❌ Vocabulaire Exalang interdit (jamais en HappyNeuron)
    'Excellent (P',
    'Moyenne haute (P',
    'Moyenne basse (P',
    'Q1',
    'Q3',
    'Med.',
    // ❌ Format diagnostic enfant interdit
    'dyslexie',
    'dysorthographie',
    'forme légère',
    'forme modérée',
    'trouble spécifique des apprentissages',
  ],
}

// =============================================================================
// TEST CASE 2 : PrediFex — NSC 3, 55 ans, plainte exécutive avec MoCA normal
// =============================================================================
const TEST_PREDIFEX: TestCase = {
  name: 'PREDIFEX',
  testKey: 'PrediFex',
  formData: {
    ortho_nom: 'Marie Dupont',
    ortho_adresse: '12 rue des Lilas',
    ortho_cp: '33000',
    ortho_ville: 'Bordeaux',
    ortho_tel: '05 56 00 00 00',
    ortho_email: 'marie.dupont@ortho.fr',
    patient_prenom: 'Cédric',
    patient_nom: 'TESTPATIENT',
    patient_age: '55 ans',
    patient_classe: '',
    bilan_date_display: '03/06/2026',
    bilan_type: 'initial',
    medecin_nom: 'Dr Pierre Martin',
    medecin_tel: '05 56 11 11 11',
    motif: 'plainte cognitive subjective : difficulté à organiser les tâches au travail, lenteur ressentie, fatigabilité',
    anamnese: `M. Cédric TESTPATIENT, 55 ans, ingénieur (NSC 3, Bac+5), consulte pour une plainte cognitive subjective depuis 6 mois : sensation de lenteur dans la prise de décision, difficulté à planifier les dossiers complexes au travail, fatigabilité en fin de journée. Pas d'antécédent neurologique. Examen clinique normal. MMSE à 30/30. MoCA à 29/30. Bilan biologique sans particularité. La plainte persiste malgré la normalité des tests classiques.`,
    test_utilise: 'PrediFex',
    resultats: `=== PrediFex — Protocole d'évaluation et de dépistage des insuffisances des fonctions exécutives (Duchêne & Jaillard, HappyNeuron 2019) ===
Stratification : 2 — 50-59 ans — NSC 3 — ≥ Bac+4 (haute réserve cognitive)

--- Épreuve 01 — Fluences alternées ---
Score total : 22/30
Temps : 1 min (chrono fixe)
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : NSC 3 = catégories Villes françaises / Pays étrangers. 22 mots en 1 min, dont 3 persévérations sur la catégorie « villes » en début d'épreuve. Reprend après recadrage. Pas d'erreur catégorielle.

--- Épreuve 02 — Texte à mettre en ordre ---
Score total : 12/12
Temps : 6 min (NSC 3 → texte Molly, seuil d'alerte 4 min pour 50-59 ans)
Zone HappyNeuron : Vert (≥ M − 1,5σ (norme ou au-dessus)) — performance préservée
Observation : score plafond MAIS temps largement au-dessus du seuil d'alerte (6 min vs 4 min attendues). Marqueur sub-clinique typique chez NSC 3 — le score ne reflète pas la lenteur d'exécution.

--- Épreuve 03 — Textes « exécutifs » ---
3a Choix du résumé : 4/4
3b Ordre des événements (5 épisodes) : 4/6
Temps : 8 min (NSC 3 → texte Jean, seuil 6 min)
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : 3a OK d'emblée (bon choix sémantique). 3b : 2 épisodes mal placés dont 1 à astérisque. Tendance à suivre l'ordre narratif au lieu de l'ordre des faits.

--- Épreuve 04 — Une syllabe sur deux ---
Mots 2 syllabes (items 1-2) : 8/8
Mots 3 syllabes (items 3-5) : 12/18
Mots 4 syllabes (items 6-7) : 8/16
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : 2 syl OK. 3 syl : dit le mot entier puis se reprend sur 3 items. 4 syl : 2 répétitions audio demandées (−4 pt), tendance à composer un mot avec 2 syllabes successives (défaut d'inhibition).

--- Épreuve 05 — Mise à jour ---
5a Chiffres : 19/21
5b Syllabes : 22/24
Zone HappyNeuron : Vert (≥ M − 1,5σ (norme ou au-dessus)) — performance préservée
Observation : 5a et 5b bien réussis, 5c non déclenché (au-dessus des seuils 12 / 14).

--- Épreuve 06 — Problème arithmétique ---
Raisonnement : 4/6
Calcul : 4/4
Temps : 7 min (NSC 3 → problème La Fondue, seuil 6 min)
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : relit l'énoncé 3 fois. Calcule correctement mais omet une donnée (poids du Vacherin) au 1er essai — se reprend après recadrage. Temps long.

--- Épreuve 07 — Problème logique « Luria » ---
Question 1 : 4/4
Question 2 : 2/2
Question 3 : 0/2
Question 4 : 2/2
Temps : 6 min (NSC 3 → problème Hélène, seuil 5 min)
Zone HappyNeuron : Vert (≥ M − 1,5σ (norme ou au-dessus)) — performance préservée
Observation : Q3 échouée — tombe dans le piège « plus que ». Ne se reprend pas spontanément. Score global préservé mais 1 piège raté.

--- Épreuve 09 — Équivalences ---
Formes (facile) : 8/8
Feux : 10/12
Étoiles : 12/18
Flèches (difficile) : 6/20 (essai)
Temps : 12 min (NSC 3 → seuil 5 min — temps PATHOLOGIQUE)
Zone HappyNeuron : Jaune (M−1,5σ à M−2σ (seuil d'alerte)) — fragilité objectivée (seuil d'alerte)
Observation : LUNES réussi. Formes OK, Feux léger fléchissement, Étoiles décroche, Flèches abandonnée après item 3 (scoring progressif 2+4+0 = 6/20). Seul le meilleur subtest compté : 12/18 Étoiles. Temps largement au-dessus du seuil.

--- Synthèse zones HappyNeuron (4 zones manuel PrediFex p. 17) ---
Vert (préservé, ≥ M − 1,5σ) : 3
Jaune (seuil d'alerte, M−1,5σ à M−2σ) : 5
Orange (difficulté avérée, M−2σ à M−3σ) : 0
Rouge (effondrement, < M−3σ) : 0`,
  },
  expectedSignals: [
    // Vocabulaire HappyNeuron correctement utilisé
    'fragilité objectivée',
    'performance préservée',
    'seuil d\'alerte',
    'dépistage',
    'hypothèse de diagnostic',
    // Profil exécutif attendu
    'flexibilité',
    'planification',
    'temps',
    'haute réserve cognitive',
    // Référence aux bilans complémentaires
    'neuropsychologique',
  ],
  forbiddenSignals: [
    // ❌ Étiologies interdites
    'Alzheimer',
    'démence frontotemporale',
    'syndrome dysexécutif avéré',
    'MCI',
    // ❌ Vocabulaire Exalang interdit
    'Excellent (P',
    'Moyenne haute (P',
    'Moyenne basse (P',
    'Q1',
    'Q3',
    'Med.',
    // ❌ Format diagnostic enfant interdit
    'dyslexie',
    'forme légère',
    'forme modérée',
    'trouble spécifique des apprentissages',
  ],
}

// =============================================================================
// Runner
// =============================================================================
async function runTestCase(tc: TestCase): Promise<{ structure: CRBOStructure }> {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 TEST CASE : ${tc.name}`)
  console.log(`${'='.repeat(80)}`)

  const systemPrompt = buildSystemPrompt([tc.testKey], 'full', 'complet')
  const userPrompt = buildCRBOPrompt(tc.formData)

  console.log(`📤 System prompt : ${(systemPrompt.length / 1000).toFixed(1)}k chars`)
  console.log(`📤 User prompt   : ${(userPrompt.length / 1000).toFixed(1)}k chars`)

  // Vérifie que les instructions critiques HappyNeuron ont bien été injectées
  const knowledgeMarkers = {
    [`${tc.name} module détecté`]: systemPrompt.includes(tc.testKey),
    'HappyNeuron sigma-based mentionné': systemPrompt.includes('sigma-based') || systemPrompt.includes('sigma'),
    'Vocabulaire HappyNeuron imposé': systemPrompt.includes('fragilité objectivée'),
    'Override tool-schema mentionné': systemPrompt.includes('surclassée') || systemPrompt.includes('EXCEPTION HappyNeuron'),
    'Hypothèse de diagnostic': systemPrompt.includes('Hypothèse de diagnostic'),
    'Pas de diagnostic étiologique': systemPrompt.includes('NE JAMAIS poser de diagnostic étiologique'),
  }
  console.log(`📚 Instructions injectées :`)
  for (const [k, v] of Object.entries(knowledgeMarkers)) {
    console.log(`   ${v ? '✅' : '❌'} ${k}`)
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  console.log(`\n⏳ Appel Anthropic (Claude Sonnet 4.6)...`)
  const t0 = Date.now()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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
  return { structure: toolUse.input as CRBOStructure }
}

function checkSignals(structure: CRBOStructure, tc: TestCase) {
  const allText = JSON.stringify(structure).toLowerCase()

  console.log(`\n✅ Signaux ATTENDUS dans le CRBO ${tc.name} :`)
  let foundExpected = 0
  for (const sig of tc.expectedSignals) {
    const ok = allText.includes(sig.toLowerCase())
    if (ok) foundExpected++
    console.log(`   ${ok ? '✅' : '❌'} "${sig}"`)
  }
  console.log(`   → ${foundExpected}/${tc.expectedSignals.length} signaux trouvés`)

  console.log(`\n🚫 Signaux INTERDITS (anti-contamination Exalang / étiologies) :`)
  let foundForbidden = 0
  for (const sig of tc.forbiddenSignals) {
    const present = allText.includes(sig.toLowerCase())
    if (present) foundForbidden++
    console.log(`   ${present ? '❌ TROUVÉ (BUG)' : '✅ absent'} "${sig}"`)
  }
  if (foundForbidden > 0) {
    console.log(`   → ⚠️ ${foundForbidden} signaux interdits trouvés — contamination détectée !`)
  } else {
    console.log(`   → ✅ Aucun signal interdit, pas de contamination Exalang ni d'étiologie.`)
  }

  // Inspection détaillée des épreuves : vérifie le vocabulaire et la cohérence percentile_value
  console.log(`\n🔬 Inspection des épreuves (vocabulaire interpretation + percentile_value) :`)
  for (const domain of structure.domains ?? []) {
    for (const e of domain.epreuves ?? []) {
      const interp = (e.interpretation || '').toLowerCase()
      const pv = e.percentile_value
      // On veut vocabulaire HappyNeuron, pas Laurie
      const usesLaurie = ['excellent', 'moyenne haute', 'moyenne basse', 'zone de fragilité', 'difficulté sévère']
        .some(label => interp === label)
      const usesHappyNeuron = ['préservée', 'moyenne basse, à surveiller', 'fragilité objectivée', 'difficulté avérée', 'effondrement']
        .some(label => interp.includes(label))
      // Cohérence : Jaune (seuil d'alerte) doit avoir pv=18 (pas 35)
      if (interp.includes('fragilité objectivée') || interp.includes('seuil d\'alerte')) {
        const ok = pv === 18 || (pv >= 11 && pv <= 25)
        console.log(`   ${ok ? '✅' : '❌'} ${e.nom.slice(0, 40)} : "${interp.slice(0, 40)}" — pv=${pv} ${ok ? '' : '(devrait être 18)'}`)
      }
      if (usesLaurie && !usesHappyNeuron) {
        console.log(`   ❌ ${e.nom.slice(0, 40)} : vocabulaire Laurie détecté ("${interp}") — devrait être HappyNeuron`)
      }
    }
  }
}

async function saveOutputs(structure: CRBOStructure, formData: TestCase['formData'], name: string) {
  const downloads = join(homedir(), 'Downloads')
  const jsonPath = join(downloads, `CRBO-TEST-${name}.json`)
  writeFileSync(jsonPath, JSON.stringify(structure, null, 2))
  console.log(`💾 JSON  → ${jsonPath}`)

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
      patient_classe: formData.patient_classe ?? '',
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
  console.log(`\n${'#'.repeat(80)}`)
  console.log(`# Test E2E PREDIMEM + PrediFex — audit post-fix 2026-06-03`)
  console.log(`# Vérifie : vocabulaire HappyNeuron, mapping percentile_value,`)
  console.log(`#           absence de contamination Exalang, absence d'étiologie.`)
  console.log(`${'#'.repeat(80)}`)

  for (const tc of [TEST_PREDIMEM, TEST_PREDIFEX]) {
    try {
      const { structure } = await runTestCase(tc)
      checkSignals(structure, tc)
      await saveOutputs(structure, tc.formData, tc.name)

      // Imprime quelques extraits du CRBO
      console.log(`\n📄 Diagnostic généré :\n   ${(structure.diagnostic ?? '').substring(0, 500).replace(/\n/g, '\n   ')}...`)
      console.log(`\n📄 Recommandations :\n   ${(structure.recommandations ?? '').substring(0, 400).replace(/\n/g, '\n   ')}...`)
    } catch (e: any) {
      console.error(`❌ ${tc.name} a échoué :`, e?.message || e)
    }
  }
  console.log(`\n${'='.repeat(80)}`)
  console.log(`✅ Tests terminés. Fichiers dans ~/Downloads/`)
  console.log(`   Ouvrir les .docx pour vérifier visuellement :`)
  console.log(`     - Colonne « Interprétation » : vocabulaire HappyNeuron (pas Laurie)`)
  console.log(`     - Couleurs cellules : Jaune HappyNeuron → orange clair Laurie (pas jaune)`)
  console.log(`     - Titre synthèse : "Hypothèse de diagnostic" (pas "Diagnostic")`)
  console.log(`${'='.repeat(80)}\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
