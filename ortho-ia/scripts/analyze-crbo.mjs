#!/usr/bin/env node
/**
 * Analyse clinique des CRBO générés par les tests E2E Playwright.
 *
 * Architecture en 3 couches :
 *   1. Règles TRANSVERSES (s'appliquent à tous les bilans)
 *   2. Règles SPÉCIFIQUES par bilan extraites des prompts (À NE PAS FAIRE /
 *      TOUJOURS FAIRE)
 *   3. Règles structurelles (présence des sections obligatoires)
 *
 * Source d'analyse priorisée :
 *   1. extracted.json + synthesized.json (test api-pipeline.spec.ts) — full content
 *   2. preview-sections.json (test pipeline.spec.ts) — UI rendered subset
 *
 * Le dispatcher détecte le bilan via metadata.json (testUtilise).
 *
 * Usage:
 *   node scripts/analyze-crbo.mjs
 *   node scripts/analyze-crbo.mjs --fixture exalang-8-11-dyslexie-cm2
 *
 * Exit code 0 = toutes les règles `error` passent. Non-zéro = au moins une violation.
 */

import fs from 'node:fs'
import path from 'node:path'

const RESULTS_DIR = path.join('e2e', '.results')

// ============================================================================
// HELPERS — Construit un objet "sections" à partir de extracted+synthesized
// (full content API) OU preview-sections.json (UI subset).
// ============================================================================

function loadFixtureContent(fixtureDir) {
  const extractedPath = path.join(fixtureDir, 'extracted.json')
  const synthesizedPath = path.join(fixtureDir, 'synthesized.json')
  const previewSectionsPath = path.join(fixtureDir, 'preview-sections.json')

  if (fs.existsSync(extractedPath) && fs.existsSync(synthesizedPath)) {
    // Mode 1 : full content depuis l'API. Reconstruit un objet sections
    // équivalent au format preview-sections pour rétro-compat des règles.
    const ex = JSON.parse(fs.readFileSync(extractedPath, 'utf8'))
    const sy = JSON.parse(fs.readFileSync(synthesizedPath, 'utf8'))
    const sections = {
      'sec-anamnese': ex.anamnese_redigee || '',
      'sec-diagnostic': sy.diagnostic || '',
      'sec-axes': (sy.axes_therapeutiques || []).join('\n'),
      'sec-pap': (sy.pap_suggestions || []).join('\n'),
      'sec-conclusion': sy.conclusion || '',
      'sec-recommandations': sy.recommandations || '',
      'sec-bilans-complementaires': (sy.bilans_complementaires || []).join('\n'),
      // Domain commentaires + epreuves commentaires (extracted) concaténés
      'sec-domains-comments': (ex.domains || []).flatMap((d) => [
        d.commentaire || '',
        ...(d.epreuves || []).map((e) => e.commentaire || ''),
      ]).filter(Boolean).join('\n'),
      // Synthesized domain commentaires (reformulés par phase 2)
      'sec-domains-synth-comments': (sy.domain_commentaires || []).map((dc) => dc.commentaire || '').join('\n'),
    }
    return { sections, source: 'api', extracted: ex, synthesized: sy }
  }

  if (fs.existsSync(previewSectionsPath)) {
    const sections = JSON.parse(fs.readFileSync(previewSectionsPath, 'utf8'))
    return { sections, source: 'preview' }
  }

  return null
}

function fullText(sections) {
  return Object.values(sections).join('\n')
}
function sec(sections, id) {
  return sections[id] || ''
}

// ============================================================================
// COUCHE 1+2 — RÈGLES TRANSVERSES (tous les bilans)
// ============================================================================

const TRANSVERSE_RULES = [
  {
    id: 'no-q1-difficulte-severe',
    description: 'Q1/P25 ne doit jamais être qualifié de "Difficulté sévère"',
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const reg = /(q1|p25|p ?25|percentile.{0,5}25)[\s\S]{0,80}(difficult[ée] s[ée]v[èe]re|d[ée]ficit s[ée]v[èe]re)/i
      if (reg.test(all)) return { severity: 'error', message: 'Une épreuve à P25/Q1 est qualifiée de "Difficulté sévère" — règle Laurie : P25 = Zone de fragilité.' }
      return null
    },
  },
  {
    id: 'no-ia-mention',
    description: 'Pas de mention "Claude", "Anthropic", "IA" dans le rendu utilisateur',
    check(sections) {
      const reg = /\b(claude|anthropic|intelligence artificielle|gpt|llm|en tant qu['']assistant|en tant qu['']ia)\b/i
      const match = fullText(sections).match(reg)
      if (match) return { severity: 'error', message: `Mention IA détectée : "${match[0]}"` }
      return null
    },
  },
  {
    id: 'no-gamification-tone',
    description: 'Pas de "Bravo", "Bien joué", encouragements infantilisants',
    check(sections) {
      const reg = /\b(bravo|bien jou[ée]|f[ée]licitations(?!\s+r[ée]guli[èe]res?)|excellent travail|continuez comme [çc]a)\b/i
      const match = fullText(sections).match(reg)
      if (match) return { severity: 'error', message: `Ton gamifié détecté : "${match[0]}"` }
      return null
    },
  },
  {
    id: 'no-em-dash-french',
    description: 'Em-dash (—) rares en prose narrative',
    check(sections) {
      const count = (fullText(sections).match(/[^\n]\s*—\s*[a-zàâäéèêëïîôöùûüç]/gi) || []).length
      if (count > 8) return { severity: 'warn', message: `${count} em-dash en prose — préférer la virgule.` }
      return null
    },
  },
  {
    id: 'no-leaked-xml-tags',
    description: 'Aucune fuite de tags XML format Anthropic dans les sections',
    check(sections) {
      const all = fullText(sections)
      const tagPatterns = [
        /<\/?parameter\b/i,
        /<\/?invoke\b/i,
        /<\/?function_calls?\b/i,
        /<\/?anamnese_redigee\b/i,
        /<\/?motif_reformule\b/i,
        /<\/?diagnostic\b/i,
        /<\/?conclusion\b/i,
        /<\/?domains\b/i,
        /<\/?recommandations\b/i,
        /<\/?axes_therapeutiques\b/i,
        /<\/?pap_suggestions\b/i,
      ]
      const found = tagPatterns.find((p) => p.test(all))
      if (found) return { severity: 'error', message: `Fuite de tag XML détectée (pattern: ${found.source}). stripLeakedTags incomplet ?` }
      return null
    },
  },
  {
    id: 'anamnese-completeness',
    description: "L'anamnèse rédigée doit conserver les faits clés",
    check(sections) {
      const an = sec(sections, 'sec-anamnese')
      if (an.length < 200) return { severity: 'error', message: `Anamnèse trop courte (${an.length} chars) — règle 0 anti-suppression.` }
      return null
    },
  },
  {
    id: 'sections-presence',
    description: 'Toutes les sections principales sont présentes et substantielles',
    check(sections) {
      const missing = []
      if (sec(sections, 'sec-diagnostic').length < 80) missing.push('diagnostic')
      if (sec(sections, 'sec-conclusion').length < 80) missing.push('conclusion')
      if (sec(sections, 'sec-axes').length < 30) missing.push('axes thérapeutiques')
      if (missing.length > 0) return { severity: 'error', message: `Sections trop courtes/vides : ${missing.join(', ')}.` }
      return null
    },
  },
  {
    id: 'no-diagnostic-evasion',
    description: 'Le diagnostic ne doit pas être uniquement évasif',
    check(sections) {
      const diag = sec(sections, 'sec-diagnostic').toLowerCase()
      const wishyWashy = (diag.match(/\b(pourrait|peut-[êe]tre|semblerait|para[îi]t)\b/g) || []).length
      if (diag.length < 300 && wishyWashy >= 3) return { severity: 'warn', message: `Diagnostic court (${diag.length} chars) + ${wishyWashy} modalisations.` }
      return null
    },
  },
  {
    id: 'no-cim-dsm-code',
    description: "Pas de codes CIM-10 / DSM-5 explicites (F81.x, F90.x, etc.)",
    check(sections) {
      const all = fullText(sections)
      const reg = /\bF\s?\d{2}\.\d\b/i
      const match = all.match(reg)
      if (match) return { severity: 'warn', message: `Code CIM/DSM détecté : "${match[0]}" — règle prompt : pas de codes explicites.` }
      return null
    },
  },
  {
    id: 'no-patient-prenom-anonymization-leak',
    description: 'Le placeholder "[PATIENT_X]" ou similaire ne doit jamais leaker en clair',
    check(sections) {
      const all = fullText(sections)
      const reg = /\[(?:PATIENT|PRENOM|NOM|MEDECIN|ORTHO)_?[A-Z0-9_]*\]/
      const match = all.match(reg)
      if (match) return { severity: 'error', message: `Placeholder d'anonymisation non rehydraté : "${match[0]}"` }
      return null
    },
  },
]

// ============================================================================
// COUCHE 3 — RÈGLES PAR BILAN
// ============================================================================

const EXALANG811_RULES = [
  {
    id: 'exalang811-no-dyslexia-before-ce1',
    description: 'Pas de diagnostic dyslexie ferme avant fin CE1',
    check(sections, meta) {
      const all = (sec(sections, 'sec-diagnostic') + ' ' + sec(sections, 'sec-conclusion')).toLowerCase()
      const affirmed = /\b(dyslexie|dyslexique)\b/i.test(all)
        && !/(compatible avec|[ée]voque|hypoth[èe]se|en cours d['']?émergence)/i.test(all)
      const earlyClass = ['CP', 'CE1'].includes((meta?.patientClasse ?? '').toUpperCase())
      if (affirmed && earlyClass) return { severity: 'error', message: `Diagnostic dyslexie posé en ${meta.patientClasse}.` }
      return null
    },
  },
  {
    id: 'exalang811-orl-ophta-mentioned',
    description: 'Bilan ORL ou ophta mentionné',
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const hasOrl = /\borl\b|otoscopie|audiom[ée]trie|audition/i.test(all)
      const hasOphta = /\b(ophtalmolog|orthopt|vision)\b/i.test(all)
      if (!hasOrl && !hasOphta) return { severity: 'warn', message: "Pas de bilan ORL/ophta mentionné — bonne pratique enfant." }
      return null
    },
  },
  {
    id: 'exalang811-amo-84-conclusion',
    description: 'AMO 8.4 cité en conclusion',
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      if (!/\bamo\s*8[\.,]4\b/i.test(conclu)) return { severity: 'warn', message: 'Conclusion sans AMO 8.4.' }
      return null
    },
  },
]

const EXALANG_PEDIATRIC_RULES = [
  // Exalang 3-6 / 5-8 / 11-15 / Lyfac — règles communes pédiatrique-lycée
  {
    id: 'exalang-amo-conclusion-pediatric',
    description: 'AMO 8.4 (LE) ou 9.4 (LO) en conclusion pour Exalang pédiatrique/collège',
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      if (!/\bamo\s*(8|9|11)[\.,]\s*(4|7)\b/i.test(conclu)) {
        return { severity: 'warn', message: 'Conclusion sans AMO 8.4/9.4/11.7.' }
      }
      return null
    },
  },
]

const EVALEO_RULES = [
  {
    id: 'evaleo-uses-7-classes',
    description: 'Vocabulaire 7 classes EVALEO (pas vocabulaire Exalang Laurie)',
    check(sections) {
      const all = fullText(sections)
      const usesClasses = /\bclasse\s*[1-7]\b/i.test(all)
      const usesExalangZones = /(zone de fragilit[ée]|moyenne haute|moyenne basse|difficult[ée] s[ée]v[èe]re)/i.test(all)
      if (!usesClasses) return { severity: 'warn', message: 'Aucune mention "Classe 1-7" en EVALEO.' }
      if (usesExalangZones) return { severity: 'warn', message: 'Vocabulaire Exalang ("Zone de fragilité"...) dans EVALEO.' }
      return null
    },
  },
  {
    id: 'evaleo-no-class-restatement',
    description: "Pas de phrase d'intro qui re-cite la classe (Anne Frouard)",
    check(sections) {
      const all = fullText(sections)
      const patterns = [
        /Le score [a-zé\s]+ se situe en classe [0-9]/i,
        /La dict[ée]e [a-zé\s]+ est cot[ée]e en classe [0-9]/i,
        /Cette [ée]preuve obtient un percentile P[0-9]+/i,
      ]
      for (const p of patterns) {
        const match = all.match(p)
        if (match) return { severity: 'error', message: `Phrase d'intro interdite : "${match[0]}"` }
      }
      return null
    },
  },
]

const BETL_RULES = [
  {
    id: 'betl-no-etiological-diagnosis',
    description: 'Pas de diagnostic étiologique posé (Alzheimer, démence — BETL n\'est pas un test diagnostique)',
    check(sections) {
      const all = (sec(sections, 'sec-diagnostic') + ' ' + sec(sections, 'sec-conclusion')).toLowerCase()
      const reg = /\b(maladie d['']?alzheimer|d[ée]mence|APP\s*(s[ée]mantique|logop[ée]nique))\b/i
      const match = all.match(reg)
      // Tolère "compatible avec" / "[ée]voque" / "histoire naturelle de"
      const modalised = /(compatible avec|[ée]voque|histoire naturelle|orientation neurolog|relais neurolog)/i.test(all)
      if (match && !modalised) return { severity: 'error', message: `Diagnostic étiologique posé sans modalisation : "${match[0]}"` }
      return null
    },
  },
  {
    id: 'betl-hillis-caramazza-reference',
    description: 'Référence implicite ou explicite au modèle Hillis-Caramazza (composants lexico-sémantique/phonologique)',
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const hasFramework = /(hillis|caramazza|lexico[- ]?(?:s[ée]mantique|phonologique)|acc[èe]s au lexique|repr[ée]sentations? (?:s[ée]mantique|phonologique))/i.test(all)
      if (!hasFramework) return { severity: 'warn', message: "Pas de référence au modèle Hillis-Caramazza (composants lexico-sémantique/phonologique)." }
      return null
    },
  },
  {
    id: 'betl-no-amo-adult',
    description: "Pas de mention AMO dans la conclusion (BETL adulte = pas de nomenclature pédiatrique)",
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      const hasAmo = /\bamo\s*(8|9|11)\b/i.test(conclu)
      if (hasAmo) return { severity: 'warn', message: 'AMO mentionnée en conclusion BETL — réservée aux bilans pédiatriques.' }
      return null
    },
  },
]

const PREDIMEM_RULES = [
  {
    id: 'predimem-no-banned-vocab',
    description: "Vocabulaire à bannir : 'démence', 'déclin', 'Alzheimer', 'détérioration' (sauf modalisation)",
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const reg = /\b(d[ée]mence|d[ée]clin cognitif|alzheimer|d[ée]t[ée]rioration cognitive)\b/i
      const match = all.match(reg)
      const modalised = /(compatible avec|[ée]voque|histoire naturelle|consultation m[ée]moire)/i.test(all)
      if (match && !modalised) return { severity: 'error', message: `Vocabulaire à bannir détecté : "${match[0]}" sans modalisation.` }
      return null
    },
  },
  {
    id: 'predimem-screening-status',
    description: 'Statut dépistage rappelé (PREDIMEM ne pose pas de diagnostic étiologique)',
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const hasScreening = /(d[ée]pistage|orientation|bilan neuropsy approfondi|consultation m[ée]moire)/i.test(all)
      if (!hasScreening) return { severity: 'warn', message: "Pas de mention du statut dépistage / orientation neuropsy." }
      return null
    },
  },
]

const PREDIFEX_RULES = [
  {
    id: 'predifex-no-banned-vocab',
    description: "Vocabulaire à bannir : 'démence', 'déclin', 'détérioration'",
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const reg = /\b(d[ée]mence|d[ée]clin cognitif|d[ée]t[ée]rioration cognitive)\b/i
      const match = all.match(reg)
      const modalised = /(compatible avec|[ée]voque|histoire naturelle|consultation neurolog)/i.test(all)
      if (match && !modalised) return { severity: 'error', message: `Vocabulaire à bannir : "${match[0]}" sans modalisation.` }
      return null
    },
  },
]

const EXAMATH_RULES = [
  {
    id: 'examath-dyscalculie-subtype',
    description: 'Sous-type dyscalculie cité (primaire vs secondaire vs raisonnement)',
    check(sections) {
      const all = (sec(sections, 'sec-diagnostic') + ' ' + sec(sections, 'sec-conclusion')).toLowerCase()
      const hasSubtype = /(primaire|secondaire|raisonnement|proc[ée]durale|s[ée]mantique du nombre|transcodage|faits num[ée]riques)/i.test(all)
      if (!hasSubtype) return { severity: 'warn', message: "Pas de mention du sous-type dyscalculie." }
      return null
    },
  },
  {
    id: 'examath-amo-11-7',
    description: 'AMO 11.7 (cognition mathématique) en conclusion',
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      if (!/\bamo\s*11[\.,]\s*7\b/i.test(conclu)) return { severity: 'warn', message: 'Conclusion sans AMO 11.7.' }
      return null
    },
  },
]

// ============================================================================
// DISPATCHER + REPORT
// ============================================================================

const BILAN_RULESETS = {
  'Exalang 8-11': EXALANG811_RULES,
  'Exalang 3-6': EXALANG_PEDIATRIC_RULES,
  'Exalang 5-8': EXALANG_PEDIATRIC_RULES,
  'Exalang 11-15': EXALANG_PEDIATRIC_RULES,
  'Exalang Lyfac': EXALANG_PEDIATRIC_RULES,
  'EVALEO 6-15': EVALEO_RULES,
  'BETL': BETL_RULES,
  'PREDIMEM': PREDIMEM_RULES,
  'PrediFex': PREDIFEX_RULES,
  'Examath': EXAMATH_RULES,
}

function loadMetadata(fixtureDir) {
  const p = path.join(fixtureDir, 'metadata.json')
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function analyzeFixture(fixtureId) {
  const dir = path.join(RESULTS_DIR, fixtureId)
  const content = loadFixtureContent(dir)

  if (!content) {
    const errorPath = path.join(dir, 'error.txt')
    if (fs.existsSync(errorPath)) {
      return {
        fixtureId,
        status: 'fail',
        bilan: null,
        message: `Pipeline a échoué : ${fs.readFileSync(errorPath, 'utf8').slice(0, 200)}`,
        violations: [],
      }
    }
    return { fixtureId, status: 'missing', bilan: null, message: 'Pas d\'artefacts', violations: [] }
  }

  const meta = loadMetadata(dir)
  const bilan = meta?.testUtilise ?? null

  const allRules = [...TRANSVERSE_RULES]
  if (bilan && BILAN_RULESETS[bilan]) allRules.push(...BILAN_RULESETS[bilan])

  const violations = []
  for (const rule of allRules) {
    const result = rule.check(content.sections, meta)
    if (result) violations.push({ ruleId: rule.id, ...result })
  }

  const hasError = violations.some((v) => v.severity === 'error')
  return {
    fixtureId,
    bilan,
    source: content.source,
    rulesApplied: allRules.length,
    transverseRules: TRANSVERSE_RULES.length,
    specificRules: bilan && BILAN_RULESETS[bilan] ? BILAN_RULESETS[bilan].length : 0,
    status: hasError ? 'fail' : 'pass',
    violations,
  }
}

function main() {
  const args = process.argv.slice(2)
  const fixtureFilter = args.includes('--fixture') ? args[args.indexOf('--fixture') + 1] : null

  if (!fs.existsSync(RESULTS_DIR)) {
    console.error(`Dossier ${RESULTS_DIR} introuvable.`)
    process.exit(1)
  }

  const fixtures = fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => fs.statSync(path.join(RESULTS_DIR, f)).isDirectory())
    .filter((f) => !fixtureFilter || f === fixtureFilter)
    .sort()

  console.log(`\nAnalyse clinique de ${fixtures.length} CRBO\n`)
  console.log(`Règles transverses : ${TRANSVERSE_RULES.length}`)
  console.log(`Règles spécifiques par bilan : ${Object.entries(BILAN_RULESETS).map(([k, v]) => `${k} (${v.length})`).join(', ')}`)
  console.log('='.repeat(80))

  let totalErrors = 0
  let totalWarns = 0
  const summary = []

  for (const fixtureId of fixtures) {
    const report = analyzeFixture(fixtureId)
    const icon =
      report.status === 'pass' ? '✅' :
      report.status === 'fail' ? '❌' : '⚠️ '
    console.log(`\n${icon} ${fixtureId} — ${report.status.toUpperCase()}`)
    if (report.bilan) {
      console.log(`   Bilan: ${report.bilan} | source=${report.source} | ${report.rulesApplied} règles (${report.transverseRules}T + ${report.specificRules}S)`)
    }
    if (report.message) console.log(`   ${report.message}`)
    if (report.violations.length === 0 && report.status === 'pass') console.log('   Toutes les règles passent.')

    for (const v of report.violations) {
      const prefix = v.severity === 'error' ? '❌' : '⚠️ '
      console.log(`   ${prefix} [${v.ruleId}] ${v.message}`)
      if (v.severity === 'error') totalErrors++
      else totalWarns++
    }
    summary.push(report)
  }

  console.log('\n' + '='.repeat(80))
  console.log(`Résumé global : ${totalErrors} erreur(s), ${totalWarns} avertissement(s)`)
  console.log(`Passes : ${summary.filter(s => s.status === 'pass').length}/${summary.length}`)
  console.log(`Fails  : ${summary.filter(s => s.status === 'fail').length}/${summary.length}`)

  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
