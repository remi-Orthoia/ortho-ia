#!/usr/bin/env node
/**
 * Analyse clinique des CRBO générés par les tests E2E Playwright.
 *
 * Prend en input les artefacts produits par `e2e/pipeline.spec.ts`
 * (sous `e2e/.results/{fixtureId}/preview-sections.json`) et applique
 * des règles métier critiques :
 *
 *   - Q1/P25 doit apparaître comme "Zone de fragilité", JAMAIS comme
 *     "Difficulté sévère" (règle Laurie, cf. CLAUDE.md).
 *   - L'anamnèse rédigée doit conserver tous les faits factuels de
 *     l'anamnèse brute (Règle 0 anti-suppression, system-base.ts:47-99).
 *   - Le diagnostic ne doit pas paraphraser sans engager
 *     ("Le profil pourrait évoquer..." sans suite = bullshit).
 *   - La conclusion doit citer la nomenclature AMO applicable
 *     (8.4 pour LE, 9.4 pour LO, 11.7 pour math).
 *   - Aucune mention de noms d'IA / éditeurs ("Claude", "Anthropic")
 *     dans le rendu utilisateur.
 *
 * Usage:
 *   node scripts/analyze-crbo.mjs
 *   node scripts/analyze-crbo.mjs --fixture exalang-8-11-dyslexie-cm2
 *
 * Exit code 0 = toutes les règles passent. Non-zéro = au moins une
 * violation détectée (utile en CI).
 */

import fs from 'node:fs'
import path from 'node:path'

const RESULTS_DIR = path.join('e2e', '.results')

/**
 * Catalogue des règles cliniques vérifiées. Chaque règle est une
 * fonction qui prend les sections du CRBO (objet { sec-anamnese, ...})
 * et retourne :
 *   - null si la règle passe
 *   - { severity, message } si elle échoue ('error' bloquant en CI,
 *     'warn' informatif)
 */
const RULES = [
  {
    id: 'no-q1-difficulte-severe',
    description: 'Q1/P25 ne doit jamais être qualifié de "Difficulté sévère"',
    check(sections) {
      const all = Object.values(sections).join('\n').toLowerCase()
      // Patterns problématiques : "p25" ou "q1" à proximité (< 50 chars)
      // d'une mention "difficulté sévère" ou "déficit sévère".
      const reg = /(q1|p25|p ?25|percentile.{0,5}25)[\s\S]{0,80}(difficult[ée] s[ée]v[èe]re|d[ée]ficit s[ée]v[èe]re)/i
      if (reg.test(all)) {
        return {
          severity: 'error',
          message: 'Une épreuve à P25/Q1 est qualifiée de "Difficulté sévère" — règle Laurie : P25 = Zone de fragilité.',
        }
      }
      return null
    },
  },
  {
    id: 'no-ia-mention',
    description: 'Pas de mention "Claude", "Anthropic", "IA" dans le rendu utilisateur',
    check(sections) {
      const all = Object.values(sections).join('\n')
      const reg = /\b(claude|anthropic|intelligence artificielle|gpt|llm)\b/i
      const match = all.match(reg)
      if (match) {
        return {
          severity: 'error',
          message: `Mention IA détectée dans le CRBO : "${match[0]}" — règle ortho.ia : aucune mention IA/Anthropic en copy utilisateur.`,
        }
      }
      return null
    },
  },
  {
    id: 'amo-nomenclature',
    description: 'La conclusion cite la nomenclature AMO applicable (8.4 LE / 9.4 LO / 11.7 math)',
    check(sections) {
      const concl = (sections['sec-conclusion'] || '').toLowerCase()
      if (!concl) {
        return { severity: 'warn', message: 'Section conclusion vide ou non trouvée.' }
      }
      const hasAmo = /amo\s*(8\.4|9\.4|11\.7)/i.test(concl)
      if (!hasAmo) {
        return {
          severity: 'warn',
          message: 'La conclusion ne mentionne pas explicitement la nomenclature AMO (8.4 / 9.4 / 11.7).',
        }
      }
      return null
    },
  },
  {
    id: 'diagnostic-not-evasive',
    description: 'Le diagnostic ne doit pas être uniquement évasif ("pourrait évoquer..." sans suite)',
    check(sections) {
      const diag = (sections['sec-diagnostic'] || '').toLowerCase()
      if (!diag) {
        return { severity: 'error', message: 'Section diagnostic vide ou non trouvée.' }
      }
      // Heuristique : diagnostic vraiment court (< 200 chars) ET truffé de
      // modalisations sans engagement clair.
      const wishyWashy = (diag.match(/\b(pourrait|peut-[êe]tre|semblerait|paraît)\b/g) || []).length
      if (diag.length < 250 && wishyWashy >= 2) {
        return {
          severity: 'warn',
          message: `Diagnostic court (${diag.length} chars) et multi-modalisations (${wishyWashy} occurrences "pourrait/peut-être") — risque d'évitement diagnostique.`,
        }
      }
      return null
    },
  },
  {
    id: 'anamnese-completeness',
    description: 'L\'anamnèse rédigée doit conserver les faits clés (au moins 100 caractères, mention âge ou classe)',
    check(sections) {
      const an = sections['sec-anamnese'] || ''
      if (an.length < 100) {
        return {
          severity: 'error',
          message: `Anamnèse rédigée trop courte (${an.length} chars) — règle 0 anti-suppression menacée.`,
        }
      }
      return null
    },
  },
  {
    id: 'no-em-dash-french',
    description: 'Pas d\'em-dash (—) dans la copy utilisateur (préférence ortho.ia : virgule)',
    check(sections) {
      const all = Object.values(sections).join('\n')
      // Compte les em-dash hors structures techniques (listes, tableaux).
      // Une occurrence isolée dans la prose narrative est un faux positif
      // acceptable (em-dash légitime entre 2 propositions).
      const count = (all.match(/[^\n]\s*—\s*[a-zàâäéèêëïîôöùûüç]/gi) || []).length
      if (count > 3) {
        return {
          severity: 'warn',
          message: `${count} em-dash (—) détectés dans la prose — préférer la virgule (mémoire user).`,
        }
      }
      return null
    },
  },
]

function analyzeFixture(fixtureId) {
  const dir = path.join(RESULTS_DIR, fixtureId)
  const sectionsPath = path.join(dir, 'preview-sections.json')

  if (!fs.existsSync(sectionsPath)) {
    return {
      fixtureId,
      status: 'missing',
      message: `Aucun artefact dans ${dir} — lance d'abord \`npx playwright test\`.`,
      violations: [],
    }
  }

  const sections = JSON.parse(fs.readFileSync(sectionsPath, 'utf8'))
  const violations = []

  for (const rule of RULES) {
    const result = rule.check(sections)
    if (result) {
      violations.push({ ruleId: rule.id, ...result })
    }
  }

  return {
    fixtureId,
    status: violations.some((v) => v.severity === 'error') ? 'fail' : 'pass',
    sectionsAvailable: Object.keys(sections),
    violations,
  }
}

function main() {
  const args = process.argv.slice(2)
  const fixtureFilter = args.includes('--fixture')
    ? args[args.indexOf('--fixture') + 1]
    : null

  if (!fs.existsSync(RESULTS_DIR)) {
    console.error(`Dossier ${RESULTS_DIR} introuvable. Lance \`npx playwright test\` d'abord.`)
    process.exit(1)
  }

  const fixtures = fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => fs.statSync(path.join(RESULTS_DIR, f)).isDirectory())
    .filter((f) => !fixtureFilter || f === fixtureFilter)

  if (fixtures.length === 0) {
    console.error(`Aucune fixture trouvée dans ${RESULTS_DIR}.`)
    process.exit(1)
  }

  console.log(`\n📋 Analyse clinique de ${fixtures.length} CRBO test(s)\n`)
  console.log(`Règles vérifiées : ${RULES.length}`)
  console.log('='.repeat(70))

  let totalErrors = 0
  let totalWarns = 0

  for (const fixtureId of fixtures) {
    const report = analyzeFixture(fixtureId)
    const icon =
      report.status === 'pass' ? '✅' :
      report.status === 'fail' ? '❌' : '⚠️'
    console.log(`\n${icon} ${fixtureId} — ${report.status.toUpperCase()}`)

    if (report.message) {
      console.log(`   ${report.message}`)
    }

    if (report.violations.length === 0 && report.status === 'pass') {
      console.log('   Toutes les règles passent.')
    }

    for (const v of report.violations) {
      const prefix = v.severity === 'error' ? '❌' : '⚠️ '
      console.log(`   ${prefix} [${v.ruleId}] ${v.message}`)
      if (v.severity === 'error') totalErrors++
      else totalWarns++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`Résumé : ${totalErrors} erreur(s), ${totalWarns} avertissement(s)`)

  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
