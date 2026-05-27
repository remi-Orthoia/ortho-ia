/**
 * Test E2E renouvellement Exalang 8-11.
 *
 * Construit un cas fictif Lucas (CE2 -> CM1) : bilan initial en septembre 2024
 * (profil dyslexie phonologique en installation, scores fragile/deficitaire)
 * puis bilan de renouvellement en mai 2026 apres 18 mois de PEC orthophonique.
 *
 * Verifie que le module exalang-8-11.ts (commit de4d92f) produit bien :
 *   - synthese_evolution remplie avec citations nominatives (P25 -> P50, etc.)
 *   - delta percentile bien interprete (Q1->Med = progres net)
 *   - mention AMO 8.4 dans la conclusion
 *   - diagnostic actualise (pas re-diagnostic from scratch)
 *
 * Usage :
 *   npx tsx scripts/test-exalang-renouvellement.ts
 *
 * Sortie : ~/Downloads/CRBO-TEST-EXALANG-RENOUVELLEMENT.{json,docx,md}
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
  console.error('ANTHROPIC_API_KEY manquant dans .env.local')
  process.exit(1)
}

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

// =============================================================================
// BILAN PRECEDENT (CE2, septembre 2024) - dyslexie phonologique en installation
// =============================================================================
const BILAN_PRECEDENT: CRBOStructure = {
  anamnese_redigee:
    "Lucas, alors en CE2 (8 ans 4 mois), nous etait adresse pour un bilan orthophonique devant des difficultes de lecture et d'orthographe signalees depuis le CP. Pas d'antecedent ORL notable, pas de port de lunettes. Premiers mots tardifs (vers 18 mois). Audition et vision controlees dans la norme avant le bilan. Aucune reeducation anterieure.",
  domains: [
    {
      nom: 'A.1 Langage oral',
      commentaire: '',
      epreuves: [
        {
          nom: "Compréhension orale de phrases",
          score: '14/20', et: '-0.50', percentile: 'P50', percentile_value: 50,
          interpretation: 'Moyenne haute',
        },
        {
          nom: "Dénomination d'images",
          score: '38/50', et: '-1.10', percentile: 'P25', percentile_value: 25,
          interpretation: 'Zone de fragilité',
        },
      ],
    },
    {
      nom: 'A.2 Métaphonologie',
      commentaire: '',
      epreuves: [
        {
          nom: 'Métaphonologie - suppression phonémique',
          score: '5/12', et: '-2.10', percentile: 'P5', percentile_value: 5,
          interpretation: 'Difficulté sévère',
        },
        {
          nom: 'Métaphonologie - acronymes',
          score: '4/10', et: '-1.80', percentile: 'P10', percentile_value: 10,
          interpretation: 'Difficulté',
        },
      ],
    },
    {
      nom: 'B.1 Lecture',
      commentaire: '',
      epreuves: [
        {
          nom: 'Lecture de mots fréquents',
          score: '32/50', et: '-1.30', percentile: 'P25', percentile_value: 25,
          interpretation: 'Zone de fragilité',
        },
        {
          nom: 'Lecture de non-mots (logatomes écrits)',
          score: '8/20', et: '-2.30', percentile: 'P5', percentile_value: 5,
          interpretation: 'Difficulté sévère',
        },
        {
          nom: 'Leximétrie',
          score: '62 mots/min', et: '-1.70', percentile: 'P10', percentile_value: 10,
          interpretation: 'Difficulté',
        },
      ],
    },
    {
      nom: 'B.2 Orthographe',
      commentaire: '',
      epreuves: [
        {
          nom: 'DRA - Dictée de Rédaction Abrégée',
          score: '14/40', et: '-2.00', percentile: 'P5', percentile_value: 5,
          interpretation: 'Difficulté sévère',
        },
      ],
    },
    {
      nom: 'C.1 Mémoire',
      commentaire: '',
      epreuves: [
        {
          nom: 'Empan auditif endroit',
          score: '4 items', et: '-1.20', percentile: 'P25', percentile_value: 25,
          interpretation: 'Zone de fragilité',
        },
        {
          nom: 'Empan auditif envers',
          score: '3 items', et: '-0.80', percentile: 'P50', percentile_value: 50,
          interpretation: 'Moyenne haute',
        },
      ],
    },
  ],
  diagnostic:
    "Les resultats sont compatibles avec un profil de dyslexie-dysorthographie developpementale de type phonologique en installation, caracterise par une atteinte de la voie d'assemblage (lecture de non-mots P5) et une fragilite metaphonologique sous-jacente marquee (suppression phonemique P5). L'orthographe est touchee de maniere severe au regard du niveau scolaire.",
  recommandations:
    "Prise en charge orthophonique hebdomadaire (1 seance de 30 min). Axe principal : conscience phonemique + automatisation du code grapho-phonemique + lecture repetee. Reevaluation a 12 mois. La reeducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (reeducation des troubles du langage ecrit).",
  conclusion:
    "Document confidentiel destine aux professionnels de sante intervenant aupres de Lucas.",
}

// =============================================================================
// BILAN ACTUEL (CM1, mai 2026) - 18 mois apres, progres mitiges
// =============================================================================
const FORM_DATA_ACTUEL = {
  ortho_nom: 'Marie Dupont',
  ortho_adresse: '12 rue des Lilas',
  ortho_cp: '33000',
  ortho_ville: 'Bordeaux',
  ortho_tel: '05 56 00 00 00',
  ortho_email: 'marie.dupont@ortho.fr',
  patient_prenom: 'Lucas',
  patient_nom: 'TESTPATIENT',
  patient_age: '10 ans 1 mois',
  patient_classe: 'CM1',
  bilan_date_display: '27/05/2026',
  bilan_type: 'renouvellement' as const,
  medecin_nom: 'Dr Pierre Martin',
  medecin_tel: '05 56 11 11 11',
  motif:
    "Renouvellement de bilan orthophonique apres 18 mois de prise en charge pour dyslexie-dysorthographie phonologique. Evaluation de l'efficacite de la PEC et reorientation des axes therapeutiques pour les 12 prochains mois.",
  anamnese:
    "Lucas est suivi en orthophonie depuis octobre 2024 (1 seance hebdomadaire de 30 minutes) suite au bilan initial qui avait pose un diagnostic de dyslexie-dysorthographie phonologique en installation. Il est aujourd'hui en CM1, decrit comme plus a l'aise en classe, moins de plaintes d'evitement face a la lecture. L'enseignante note une amelioration du dechiffrage et une participation orale plus active mais maintient des aleas en dictee. PAP en place depuis le CM1. Pas de nouveau probleme ORL ni visuel.",
  test_utilise: 'Exalang 8-11',
  resultats: `=== EXALANG 8-11 (renouvellement, CM1, 18 mois de PEC) ===

A.1 LANGAGE ORAL
- Compréhension orale de phrases : 16/20, É-T : -0.30, P50 (Med)
- Dénomination d'images : 42/50, É-T : -0.50, P50 (Med)

A.2 MÉTAPHONOLOGIE
- Métaphonologie - suppression phonémique : 9/12, É-T : -0.80, P25 (Q1)
- Métaphonologie - acronymes : 7/10, É-T : -0.50, P50 (Med)

B.1 LECTURE
- Lecture de mots fréquents : 42/50, É-T : -0.40, P50 (Med)
- Lecture de non-mots (logatomes écrits) : 11/20, É-T : -1.80, P10
- Leximétrie : 92 mots/min, É-T : -1.20, P25 (Q1)

B.2 ORTHOGRAPHE
- DRA - Dictée de Rédaction Abrégée : 22/40, É-T : -1.50, P10

C.1 MÉMOIRE
- Empan auditif endroit : 5 items, É-T : -0.60, P50 (Med)
- Empan auditif envers : 3 items, É-T : -1.10, P25 (Q1)`,
  notes_analyse:
    "Lucas est plus a l'aise face aux epreuves de lecture qu'au bilan initial. Les strategies metaphonologiques semblent mieux mobilisees. La leximetrie reste lente mais a beaucoup progresse. L'orthographe reste l'axe de difficulte persistant. Discrete regression de l'empan envers a confirmer.",
  comportement_seance:
    "Cooperatif - Plus confiant qu'au precedent bilan - Pas d'evitement",
  duree_seance_minutes: 75,
  bilan_precedent_structure: BILAN_PRECEDENT,
  bilan_precedent_date: '2024-09-15',
  bilan_precedent_anamnese: BILAN_PRECEDENT.anamnese_redigee,
}

// =============================================================================
// RUN
// =============================================================================
async function main() {
  const testKey = 'Exalang 8-11'
  console.log(`\n${'='.repeat(80)}`)
  console.log(`TEST RENOUVELLEMENT : ${testKey}`)
  console.log(`Bilan initial : ${FORM_DATA_ACTUEL.bilan_precedent_date} (CE2)`)
  console.log(`Bilan actuel  : ${FORM_DATA_ACTUEL.bilan_date_display} (CM1, +20 mois)`)
  console.log(`${'='.repeat(80)}\n`)

  const systemPrompt = buildSystemPrompt([testKey], 'full', 'complet')
  const userPrompt = buildCRBOPrompt(FORM_DATA_ACTUEL as any)

  console.log(`System prompt : ${(systemPrompt.length / 1000).toFixed(1)}k chars`)
  console.log(`User prompt   : ${(userPrompt.length / 1000).toFixed(1)}k chars`)

  // Verifie que les markers attendus sont presents dans system prompt
  const markers = {
    'Exalang 8-11 module': systemPrompt.includes('EXALANG 8-11'),
    'Grille 6 zones': systemPrompt.includes('P11 - P25 (Q1 inclus)') || systemPrompt.includes('P11-P25 (Q1 incl'),
    'MODE RENOUVELLEMENT bloc': systemPrompt.includes('MODE RENOUVELLEMENT'),
    'AMO 8.4 directive': systemPrompt.includes('AMO 8.4'),
    'Citation nominative obligatoire': systemPrompt.includes('Citation nominative obligatoire'),
    'Q1->Med = progres net': systemPrompt.toLowerCase().includes('q1 vers med'),
  }
  console.log(`\nMarkers prompt :`)
  for (const [k, v] of Object.entries(markers)) {
    console.log(`   ${v ? '[OK]' : '[KO]'} ${k}`)
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  console.log(`\nAppel Anthropic (claude-sonnet-4-6)...`)
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
  console.log(`Reponse en ${dt}s, input ${message.usage.input_tokens} tokens, output ${message.usage.output_tokens} tokens`)

  const toolUse = message.content.find((b: any) => b.type === 'tool_use') as any
  if (!toolUse) throw new Error('Pas de tool_use dans la reponse')
  const structure = toolUse.input as CRBOStructure

  // Save outputs
  const downloads = join(homedir(), 'Downloads')
  const baseName = 'CRBO-TEST-EXALANG-RENOUVELLEMENT'

  const jsonPath = join(downloads, `${baseName}.json`)
  writeFileSync(jsonPath, JSON.stringify(structure, null, 2))
  console.log(`\nJSON  -> ${jsonPath}`)

  const blob = await generateCRBOWord({
    formData: {
      ortho_nom: FORM_DATA_ACTUEL.ortho_nom,
      ortho_adresse: FORM_DATA_ACTUEL.ortho_adresse,
      ortho_cp: FORM_DATA_ACTUEL.ortho_cp,
      ortho_ville: FORM_DATA_ACTUEL.ortho_ville,
      ortho_tel: FORM_DATA_ACTUEL.ortho_tel,
      ortho_email: FORM_DATA_ACTUEL.ortho_email,
      patient_prenom: FORM_DATA_ACTUEL.patient_prenom,
      patient_nom: FORM_DATA_ACTUEL.patient_nom,
      patient_ddn: '',
      patient_classe: FORM_DATA_ACTUEL.patient_classe,
      bilan_date: FORM_DATA_ACTUEL.bilan_date_display,
      bilan_type: FORM_DATA_ACTUEL.bilan_type,
      medecin_nom: FORM_DATA_ACTUEL.medecin_nom,
      medecin_tel: FORM_DATA_ACTUEL.medecin_tel,
      motif: FORM_DATA_ACTUEL.motif,
      test_utilise: [FORM_DATA_ACTUEL.test_utilise],
      anamnese: FORM_DATA_ACTUEL.anamnese,
      resultats_manuels: FORM_DATA_ACTUEL.resultats,
    } as any,
    structure,
    previousStructure: BILAN_PRECEDENT,
  } as any)
  const docxPath = join(downloads, `${baseName}.docx`)
  const arrayBuffer = await blob.arrayBuffer()
  writeFileSync(docxPath, Buffer.from(arrayBuffer))
  console.log(`Word  -> ${docxPath}`)

  // Markdown lisible
  const md = renderCRBOAsMarkdown(structure, FORM_DATA_ACTUEL, BILAN_PRECEDENT)
  const mdPath = join(downloads, `${baseName}.md`)
  writeFileSync(mdPath, md)
  console.log(`MD    -> ${mdPath}`)

  // Affichage console
  console.log(`\n${'='.repeat(80)}`)
  console.log(`OUTPUT CRBO RENOUVELLEMENT`)
  console.log(`${'='.repeat(80)}\n`)
  console.log(md)
}

function renderCRBOAsMarkdown(
  s: CRBOStructure,
  form: typeof FORM_DATA_ACTUEL,
  prev: CRBOStructure,
): string {
  const lines: string[] = []
  lines.push(`# CRBO RENOUVELLEMENT - ${form.patient_prenom} ${form.patient_nom}`)
  lines.push('')
  lines.push(`Bilan initial : ${form.bilan_precedent_date} (CE2)`)
  lines.push(`Bilan actuel  : ${form.bilan_date_display} (CM1, ~20 mois apres)`)
  lines.push(`Test : ${form.test_utilise}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Motif reformule')
  lines.push((s as any).motif_reformule || '(non renseigne)')
  lines.push('')
  lines.push('## Anamnese redigee')
  lines.push(s.anamnese_redigee || '(non renseigne)')
  lines.push('')
  lines.push('## Synthese d\'evolution (obligatoire en renouvellement)')
  const se = s.synthese_evolution
  if (se) {
    lines.push('')
    lines.push('### Resume narratif')
    lines.push(se.resume || '(vide)')
    lines.push('')
    lines.push(`### Progres (${se.domaines_progres?.length ?? 0})`)
    for (const p of se.domaines_progres ?? []) lines.push(`- ${p}`)
    lines.push('')
    lines.push(`### Stagnation (${se.domaines_stagnation?.length ?? 0})`)
    for (const p of se.domaines_stagnation ?? []) lines.push(`- ${p}`)
    lines.push('')
    lines.push(`### Regression (${se.domaines_regression?.length ?? 0})`)
    for (const p of se.domaines_regression ?? []) lines.push(`- ${p}`)
  } else {
    lines.push('**ERREUR : synthese_evolution NULL ou ABSENTE - non conforme au bilan de renouvellement.**')
  }
  lines.push('')
  lines.push('## Comparaison epreuve par epreuve')
  lines.push('')
  lines.push('| Epreuve | Initial CE2 | Actuel CM1 | Delta | Verdict |')
  lines.push('|---|---|---|---|---|')
  const prevMap = new Map<string, number>()
  for (const d of prev.domains) for (const e of d.epreuves) prevMap.set(e.nom.toLowerCase().trim(), e.percentile_value)
  for (const d of s.domains) {
    for (const e of d.epreuves) {
      const prevP = prevMap.get(e.nom.toLowerCase().trim())
      const delta = prevP !== undefined ? e.percentile_value - prevP : null
      const verdict =
        delta === null ? '(nouveau)' :
        delta >= 10 ? 'PROGRES' :
        delta <= -10 ? 'REGRESSION' : 'stable'
      lines.push(`| ${e.nom} | ${prevP !== undefined ? 'P' + prevP : '-'} | ${e.percentile} | ${delta !== null ? (delta >= 0 ? '+' : '') + delta : '-'} | ${verdict} |`)
    }
  }
  lines.push('')
  lines.push('## Diagnostic')
  lines.push(s.diagnostic || '(non renseigne)')
  lines.push('')
  lines.push('## Recommandations')
  lines.push(s.recommandations || '(non renseigne)')
  lines.push('')
  lines.push(`## Axes therapeutiques`)
  for (const a of s.axes_therapeutiques ?? []) lines.push(`- ${a}`)
  lines.push('')
  lines.push('## PAP suggestions')
  for (const p of s.pap_suggestions ?? []) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## Conclusion')
  lines.push(s.conclusion || '(non renseigne)')
  lines.push('')

  // Sanity checks
  lines.push('---')
  lines.push('')
  lines.push('## Sanity checks automatiques')
  const allText = JSON.stringify(s).toLowerCase()
  const checks = [
    ['Mention AMO 8.4', allText.includes('amo 8.4') || allText.includes('amo 8,4')],
    ['synthese_evolution non-null', !!s.synthese_evolution],
    ['Citation nominative epreuve avec percentiles avant/apres',
      // Accepte format "passage de X (P5) à Y (P25)", "P25 vers P50", "P25 -> P50", "P5 / P25"
      /\(p\d+\)\s*[àa]\s*[^()]{1,60}\(p\d+\)/i.test(JSON.stringify(s)) ||
      / p\d+\s*(vers|->|→)\s*p\d+/i.test(JSON.stringify(s)) ||
      /p\d+\s*\/\s*p\d+/i.test(JSON.stringify(s))],
    ['Mention "renouvellement" dans anamnese',
      (s.anamnese_redigee || '').toLowerCase().includes('renouvell') ||
      (s.anamnese_redigee || '').toLowerCase().includes('depuis le bilan') ||
      (s.anamnese_redigee || '').toLowerCase().includes('a ce jour')],
    ['Pas de mention "Claude" / "Anthropic"',
      !allText.includes('claude') && !allText.includes('anthropic')],
    ['Diagnostic actualise (pas re-diagnostic from scratch)',
      (s.diagnostic || '').toLowerCase().includes('persist') ||
      (s.diagnostic || '').toLowerCase().includes('maintenu') ||
      (s.diagnostic || '').toLowerCase().includes('actualis') ||
      (s.diagnostic || '').toLowerCase().includes('compens')],
  ]
  for (const [name, ok] of checks) lines.push(`- [${ok ? 'OK' : 'KO'}] ${name}`)

  return lines.join('\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
