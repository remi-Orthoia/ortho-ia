#!/usr/bin/env node
/**
 * Étape 2 du test E2E GréMots : à partir des données extraites du PDF,
 * appelle /api/generate-crbo et récupère le CRBO synthétisé. Sauvegarde
 * extracted + synthesized en JSON.
 *
 * Login : via supabase-js signInWithPassword (compte demo@ortho-ia.fr),
 * extraction du access_token, injection en cookie `sb-...-auth-token`.
 *
 * Usage : node scripts/gremots-generate-crbo.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env.test' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL = process.env.E2E_TEST_EMAIL
const PASSWORD = process.env.E2E_TEST_PASSWORD

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
const { data: signin, error: signinErr } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})
if (signinErr) {
  console.error('Login échec :', signinErr.message)
  process.exit(1)
}
const accessToken = signin.session.access_token
const refreshToken = signin.session.refresh_token

const projectRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1]
const cookieName = `sb-${projectRef}-auth-token`
const cookieValue = encodeURIComponent(JSON.stringify({
  access_token: accessToken,
  refresh_token: refreshToken,
  expires_at: signin.session.expires_at,
  expires_in: signin.session.expires_in,
  token_type: signin.session.token_type,
  user: signin.session.user,
}))
console.log(`✓ Login OK (${EMAIL})`)

const extracted = JSON.parse(readFileSync('e2e/.results/test-gremots-extracted.json', 'utf8'))

// Mapping percentile range → percentile médian (Px) attendu par le tool
// schema EXTRACT (format Px strict, voir lib/prompts/tool-schema.ts).
const PCT_TO_MEDIAN = {
  'p76-100': 'P85',
  'p50-75':  'P62',
  'p26-49':  'P37',
  'p11-25':  'P18',
  'p6-10':   'P8',
  'p1-5':    'P3',
}
const PCT_LABELS = {
  'p76-100': 'Excellent',
  'p50-75':  'Moyenne haute',
  'p26-49':  'Moyenne basse',
  'p11-25':  'Zone de fragilité',
  'p6-10':   'Difficulté',
  'p1-5':    'Difficulté sévère',
}

// Mapping noms épreuves cohérents avec lib/prompts/tests/gremots.ts (epreuves[]).
const EPREUVE_LABELS = {
  e01_langage_spontane: 'Entretien / Langage spontané',
  e02_repetition_mots: 'Répétition de mots',
  e03_repetition_phrases: 'Répétition de phrases',
  e04_fluences_verbes: 'Fluences, verbes (1 min)',
  e05_fluences_fruits: 'Fluences, fruits (1 min)',
  e06_fluences_lettre_v: 'Fluences, lettre V (1 min)',
  e07_execution_ordres: "Exécution d'ordres",
  e08_denomination_objets: 'Dénomination orale, objets',
  e09_denomination_actions: 'Dénomination orale, actions',
  e10_denomination_personnes: 'Dénomination orale, personnes célèbres',
  e11_elaboration_phrases: 'Élaboration de phrases',
  e12_discours_narratif: 'Discours narratif',
  e13_comprehension_syntaxique: 'Compréhension syntaxique',
  e14_lecture_mots: 'Lecture à voix haute de mots',
  e15_lecture_logatomes: 'Lecture à voix haute de logatomes',
  e16_verification_oral_photo: 'Vérification mot oral, photo',
  e17_ecriture_automatique: 'Écriture automatique',
  e18_ecriture_mots: 'Écriture sous dictée de mots',
  e19_ecriture_logatomes: 'Répétition et écriture sous dictée de logatomes',
  e20_ecriture_phrases: 'Écriture sous dictée de phrases',
  e21_comprehension_texte_ecrit: 'Compréhension de texte écrit',
  e22_verification_ecrit_photo: 'Vérification mot écrit, photo',
}

// Score max attendu par épreuve (pour formater "X/Y" classique).
const EPREUVE_MAX = {
  e02_repetition_mots: 20, e03_repetition_phrases: 15,
  e07_execution_ordres: 30, e08_denomination_objets: 40, e09_denomination_actions: 40,
  e10_denomination_personnes: 30, e11_elaboration_phrases: 15, e12_discours_narratif: 30,
  e13_comprehension_syntaxique: 30, e14_lecture_mots: 40, e15_lecture_logatomes: 20,
  e16_verification_oral_photo: 40, e17_ecriture_automatique: 10, e18_ecriture_mots: 40,
  e19_ecriture_logatomes: 20, e20_ecriture_phrases: 30, e21_comprehension_texte_ecrit: 20,
  e22_verification_ecrit_photo: 40,
}

// Format texte clair, calqué sur les fixtures BETL/PREDIMEM qui marchent bien
// avec le pipeline générique (Score : X/Y → Px).
const epreuvesText = extracted.epreuves.map((e) => {
  const label = EPREUVE_LABELS[e.key] || e.key
  if (e.key === 'e01_langage_spontane' || !e.strict) {
    const obs = (e.qualitative_only || e.observation || '').trim()
    return `${label} : qualitatif — ${obs}`
  }
  const strict = parseInt(e.strict, 10) || 0
  const large = parseInt(e.large, 10) || 0
  const erreur = parseInt(e.erreur, 10) || 0
  const max = EPREUVE_MAX[e.key]
  const total = strict + large
  // Pattern aligné sur FIXTURE_BETL_APHASIE : "Épreuve : score/max — observation"
  // avec percentile Px immédiatement après le score brut.
  const scoreStr = max ? `${total}/${max}` : String(total)
  const pct = e.percentile ? ` ${PCT_TO_MEDIAN[e.percentile]} (${PCT_LABELS[e.percentile]})` : ''
  const temps = e.temps ? ` (temps ${e.temps} s)` : ''
  const decomp = `[Strict ${strict} + Large ${large}, ${erreur} erreur(s) selon convention GréMots]`
  const obs = (e.observation || '').trim()
  return `${label} : ${scoreStr}${pct}${temps} ${decomp}${obs ? ` — ${obs}` : ''}`
}).join('\n')

const formData = {
  patient_prenom: 'Henri',
  patient_nom: 'TESTUSER',
  patient_ddn: '1960-04-22',
  patient_classe: 'adulte',
  bilan_date: '2026-06-05',
  bilan_type: 'initial',
  motif: 'Cognitif',
  medecin_nom: 'Claire TESTMEDECIN',
  medecin_specialite: 'Neurologue',
  medecin_date_prescription: '2026-05-20',
  medecin_tel: '',
  anamnese: "Monsieur TESTUSER, 66 ans, droitier, ancien architecte (NSC 3). Adressé par son neurologue suite à une plainte d'aggravation progressive du manque du mot depuis ~24 mois, sans antécédent vasculaire. L'épouse signale une difficulté croissante à nommer des objets familiers, à reconnaître des visages de personnes connues (collègues, amis distants), un appauvrissement du vocabulaire en conversation. Pas d'antécédents neurologiques ni familiaux notables. IRM cérébrale récente : atrophie temporale antérieure gauche modérée. Pas d'AVC. Conduite automobile arrêtée par décision personnelle il y a 6 mois. Autonome pour les actes de la vie quotidienne.",
  test_utilise: ['GréMots'],
  resultats: `=== GréMots (Béziy, Pariente, Tran, Macoir et al., collectif GréMots, De Boeck Supérieur 2016 / HappyNeuron 2021) ===\nStratification : NSC ${extracted.nsc} × tranche d'âge ${extracted.trancheAge} ans\n\nÉpreuves (Score Strict / Score Large / Erreur, Score Strict TOTAL = Strict + Large selon convention manuel section 2.4) :\n${epreuvesText}`,
  comportement_seance: "M. TESTUSER coopératif, conscient des difficultés, frustration visible sur les épreuves de dénomination. Fatigabilité légère en fin de séance.",
  format: 'synthetique',
}

// Construction manuelle de l'extracted pour contourner la phase extract
// qui sur du format GréMots ne reconnaît pas les scores. On lui pré-mâche
// le travail avec un domains[] complet aligné sur les 22 épreuves.

const PCT_VALUE = { 'p76-100': 85, 'p50-75': 62, 'p26-49': 37, 'p11-25': 18, 'p6-10': 8, 'p1-5': 3 }
const PCT_INTERP = { 'p76-100': 'Excellent', 'p50-75': 'Moyenne haute', 'p26-49': 'Moyenne basse', 'p11-25': 'Zone de fragilité', 'p6-10': 'Difficulté', 'p1-5': 'Difficulté sévère' }

// Group les 22 épreuves dans les 8 domaines officiels GréMots
const DOMAIN_MAP = {
  '1. Traitement discursif': ['e01_langage_spontane', 'e12_discours_narratif', 'e21_comprehension_texte_ecrit'],
  '2. Production lexicale': ['e04_fluences_verbes', 'e05_fluences_fruits', 'e06_fluences_lettre_v', 'e08_denomination_objets', 'e09_denomination_actions', 'e10_denomination_personnes'],
  '3. Compréhension lexicale': ['e16_verification_oral_photo', 'e22_verification_ecrit_photo'],
  '4. Production syntaxique': ['e11_elaboration_phrases'],
  '5. Compréhension syntaxique': ['e07_execution_ordres', 'e13_comprehension_syntaxique'],
  '6. Répétition': ['e02_repetition_mots', 'e03_repetition_phrases', 'e19_ecriture_logatomes'],
  '7. Lecture à voix haute': ['e14_lecture_mots', 'e15_lecture_logatomes'],
  '8. Écriture': ['e17_ecriture_automatique', 'e18_ecriture_mots', 'e20_ecriture_phrases'],
}

function buildEpreuve(key) {
  const e = extracted.epreuves.find((x) => x.key === key)
  if (!e) return null
  const max = EPREUVE_MAX[key]
  if (key === 'e01_langage_spontane') {
    return {
      nom: EPREUVE_LABELS[key],
      score: 'Qualitatif (langage spontané)',
      et: null,
      percentile: '',
      percentile_value: 50,
      interpretation: '',
      commentaire: e.qualitative_only || '',
    }
  }
  const strict = parseInt(e.strict, 10) || 0
  const large = parseInt(e.large, 10) || 0
  const erreur = parseInt(e.erreur, 10) || 0
  const total = strict + large
  const pctV = e.percentile ? PCT_VALUE[e.percentile] : 50
  const pctP = e.percentile ? `P${pctV}` : ''
  const interp = e.percentile ? PCT_INTERP[e.percentile] : ''
  const obs = (e.observation || '').trim()
  return {
    nom: EPREUVE_LABELS[key],
    score: max ? `${total}/${max} (Strict ${strict} + Large ${large}, ${erreur} erreurs)` : `${total} (Strict ${strict} + Large ${large}, ${erreur} erreurs)`,
    et: null,
    percentile: pctP,
    percentile_value: pctV,
    interpretation: interp,
    commentaire: obs,
  }
}

const manualExtracted = {
  anamnese_redigee: formData.anamnese,
  motif_reformule: `Henri TESTUSER, 66 ans, est adressé pour un bilan orthophonique GréMots devant une plainte d'aggravation progressive du manque du mot depuis 24 mois, avec atteinte de la reconnaissance de personnes connues, et atrophie temporale antérieure gauche modérée à l'IRM. Suspicion clinique d'aphasie progressive primaire à caractériser.`,
  domains: Object.entries(DOMAIN_MAP).map(([nom, keys]) => ({
    nom,
    epreuves: keys.map(buildEpreuve).filter(Boolean),
    commentaire: '',
  })),
}

writeFileSync('e2e/.results/test-gremots-manual-extracted.json', JSON.stringify(manualExtracted, null, 2))
console.log(`✓ Manual extracted construit (${manualExtracted.domains.length} domaines, ${manualExtracted.domains.reduce((a, d) => a + d.epreuves.length, 0)} épreuves)`)

// SSE phase synthesize avec extracted pré-rempli
console.log('\n→ POST /api/generate-crbo (phase=synthesize)...')
const res = await fetch('http://localhost:3000/api/generate-crbo?stream=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'cookie': `${cookieName}=${cookieValue}`,
  },
  body: JSON.stringify({ formData, phase: 'synthesize', format: 'synthetique', extracted: manualExtracted }),
})
console.log(`← HTTP ${res.status}`)
if (!res.ok) {
  console.error(await res.text())
  process.exit(1)
}

const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
let final = null
let synthesized = null
let extractedFromAi = null

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  let nl
  while ((nl = buffer.indexOf('\n\n')) !== -1) {
    const evt = buffer.slice(0, nl)
    buffer = buffer.slice(nl + 2)
    for (const line of evt.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        const json = JSON.parse(line.slice(6))
        if (json.type === 'progress') process.stdout.write(`  · ${json.stage}\n`)
        if (json.type === 'complete') {
          final = json
          extractedFromAi = json.extracted ?? manualExtracted
          synthesized = json.synthesized
        }
        if (json.type === 'error') {
          console.error('Stream error:', json.message)
        }
      } catch {}
    }
  }
}

if (!synthesized) {
  console.error('❌ Pas de complete dans le stream')
  process.exit(1)
}

writeFileSync('e2e/.results/test-gremots-ai-extracted.json', JSON.stringify(extractedFromAi, null, 2))
writeFileSync('e2e/.results/test-gremots-synthesized.json', JSON.stringify(synthesized, null, 2))
console.log('✓ Sauvé : e2e/.results/test-gremots-synthesized.json')

console.log('\n=== DIAGNOSTIC ===')
console.log(synthesized.diagnostic)
console.log('\n=== CONCLUSION ===')
console.log(synthesized.conclusion)
