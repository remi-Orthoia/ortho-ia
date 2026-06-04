#!/usr/bin/env node
/**
 * Analyse clinique des CRBO générés par les tests E2E Playwright.
 *
 * Prend en input les artefacts produits par `e2e/pipeline.spec.ts`
 * (sous `e2e/.results/{fixtureId}/`) et applique :
 *
 *   1. Des règles TRANSVERSES (s'appliquent à tous les bilans) — section
 *      anti-IA, anti-em-dash, anti-hallucination, structure minimale.
 *   2. Des règles SPÉCIFIQUES par bilan, extraites des prompts cliniques
 *      (`lib/prompts/tests/<bilan>.ts`) — sections "À NE PAS FAIRE" /
 *      "TOUJOURS FAIRE", règles métier Laurie/Cindy/Justine.
 *
 * Couches couvertes (cf. conversation audit) :
 *   L1 : règles transverses light
 *   L2 : règles transverses étoffées (DSM-5 référencement, vocabulaire)
 *   L3 : règles par bilan (Exalang 8-11, EVALEO 6-15 pour l'instant)
 *
 * Le dispatcher détecte le bilan via `metadata.json` (testUtilise) sauvegardé
 * par Playwright. Permet d'étendre couche par couche sans casser le
 * comportement transverse.
 *
 * Usage:
 *   node scripts/analyze-crbo.mjs
 *   node scripts/analyze-crbo.mjs --fixture exalang-8-11-dyslexie-cm2
 *
 * Exit code 0 = toutes les règles `error` passent (les `warn` sont
 * informatives et n'échouent pas le run). Non-zéro = au moins une
 * violation `error`.
 */

import fs from 'node:fs'
import path from 'node:path'

const RESULTS_DIR = path.join('e2e', '.results')

// ============================================================================
// HELPERS
// ============================================================================

/** Concatène toutes les sections en un seul blob pour les regex globales. */
function fullText(sections) {
  return Object.values(sections).join('\n')
}

/** Renvoie le contenu d'une section donnée (ou ''). */
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
      if (reg.test(all)) {
        return { severity: 'error', message: 'Une épreuve à P25/Q1 est qualifiée de "Difficulté sévère" — règle Laurie : P25 = Zone de fragilité.' }
      }
      return null
    },
  },
  {
    id: 'no-ia-mention',
    description: 'Pas de mention "Claude", "Anthropic", "IA" dans le rendu utilisateur',
    check(sections) {
      const reg = /\b(claude|anthropic|intelligence artificielle|gpt|llm|en tant qu['']assistant|en tant qu['']ia)\b/i
      const match = fullText(sections).match(reg)
      if (match) {
        return { severity: 'error', message: `Mention IA détectée : "${match[0]}" — règle ortho.ia : aucune mention IA/Anthropic en copy utilisateur.` }
      }
      return null
    },
  },
  {
    id: 'no-gamification-tone',
    description: 'Pas de "Bravo", "Bien joué", félicitations infantilisantes',
    check(sections) {
      const reg = /\b(bravo|bien jou[ée]|f[ée]licitations|excellent travail|continuez comme [çc]a)\b/i
      const match = fullText(sections).match(reg)
      if (match) {
        return { severity: 'error', message: `Ton gamifié détecté : "${match[0]}" — un CRBO médico-légal n'est pas un encouragement.` }
      }
      return null
    },
  },
  {
    id: 'no-em-dash-french',
    description: "Em-dash (—) rares en prose narrative — la virgule est préférée en français pro",
    check(sections) {
      const count = (fullText(sections).match(/[^\n]\s*—\s*[a-zàâäéèêëïîôöùûüç]/gi) || []).length
      if (count > 5) {
        return { severity: 'warn', message: `${count} em-dash (—) en prose — préférer la virgule (mémoire user 2026-06).` }
      }
      return null
    },
  },
  {
    id: 'anamnese-completeness',
    description: "L'anamnèse rédigée doit conserver les faits clés (règle 0 anti-suppression)",
    check(sections) {
      const an = sec(sections, 'sec-anamnese')
      if (an.length < 150) {
        return { severity: 'error', message: `Anamnèse rédigée trop courte (${an.length} chars) — règle 0 anti-suppression menacée.` }
      }
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
      if (sec(sections, 'sec-axes').length < 50) missing.push('axes thérapeutiques')
      if (missing.length > 0) {
        return { severity: 'error', message: `Sections manquantes ou trop courtes : ${missing.join(', ')}.` }
      }
      return null
    },
  },
  {
    id: 'no-diagnostic-evasion-without-substance',
    description: 'Le diagnostic ne doit pas être uniquement évasif',
    check(sections) {
      const diag = sec(sections, 'sec-diagnostic').toLowerCase()
      const wishyWashy = (diag.match(/\b(pourrait|peut-[êe]tre|semblerait|para[îi]t)\b/g) || []).length
      if (diag.length < 300 && wishyWashy >= 3) {
        return { severity: 'warn', message: `Diagnostic court (${diag.length} chars) et multi-modalisations (${wishyWashy} "pourrait/peut-être") — risque d'évitement.` }
      }
      return null
    },
  },
]

// ============================================================================
// COUCHE 3 — RÈGLES SPÉCIFIQUES EXALANG 8-11
// Source : lib/prompts/tests/exalang-8-11.ts sections "À NE PAS FAIRE" /
// "TOUJOURS FAIRE" lignes 227-245 + critères DSM-5 lignes 168-185.
// ============================================================================

const EXALANG811_RULES = [
  {
    id: 'exalang811-no-dyslexia-before-ce1',
    description: 'Pas de diagnostic dyslexie ferme avant fin CE1 (critère DSM-5 persistance 18 mois)',
    check(sections, meta) {
      const diag = sec(sections, 'sec-diagnostic').toLowerCase()
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      const all = diag + ' ' + conclu
      // Détecte "dyslexie" affirmée (pas "compatible avec" / "évoque").
      const affirmed = /\b(dyslexie|dyslexique)\b/i.test(all)
        && !/(compatible avec|[ée]voque|hypoth[èe]se de|en cours d['']?émergence)/i.test(all)
      const earlyClass = ['CP', 'CE1'].includes((meta?.patientClasse ?? '').toUpperCase())
      if (affirmed && earlyClass) {
        return { severity: 'error', message: `Diagnostic ferme de dyslexie posé pour un patient en ${meta.patientClasse} — règle DSM-5 : persistance ≥ 18 mois requise (pas avant fin CE1 février).` }
      }
      return null
    },
  },
  {
    id: 'exalang811-wisc-mentioned-if-pps',
    description: 'WISC-V mentionné si PPS / aménagements lourds suggérés',
    check(sections) {
      const all = fullText(sections)
      const ppsMentioned = /\bPPS\b|MDPH|am[ée]nagement.{0,30}(lourd|sp[ée]cifique|cons[ée]quent)/i.test(all)
      const wiscMentioned = /\bWISC[\-\s]?V\b|wisc/i.test(all)
      if (ppsMentioned && !wiscMentioned) {
        return { severity: 'warn', message: 'PPS suggéré sans mention WISC-V — prérequis pour exclure trouble cognitif global (critère D DSM-5).' }
      }
      return null
    },
  },
  {
    id: 'exalang811-orl-ophta-recommended',
    description: 'Bilan ORL et/ou ophta mentionné dans les recommandations',
    check(sections) {
      const all = fullText(sections).toLowerCase()
      const hasOrl = /\borl\b|otoscopie|audiom[ée]trie|audition/i.test(all)
      const hasOphta = /\b(ophtalmolog|orthopt|vision)\b/i.test(all)
      if (!hasOrl && !hasOphta) {
        return { severity: 'warn', message: "Aucune mention de bilan ORL ou ophtalmologique — bonne pratique 8-11 ans (exclure causes périphériques)." }
      }
      return null
    },
  },
  {
    id: 'exalang811-amo-84-conclusion',
    description: 'AMO 8.4 (langage écrit) en conclusion pour un Exalang 8-11',
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      if (!/\bamo\s*8\.4\b/i.test(conclu)) {
        return { severity: 'warn', message: 'Conclusion sans mention AMO 8.4 — nomenclature obligatoire pour bilan langage écrit pédiatrique.' }
      }
      return null
    },
  },
  {
    id: 'exalang811-renouvellement-citation-nominale',
    description: 'En renouvellement : citation nominative des épreuves (pas "plusieurs progrès observés")',
    check(sections, meta) {
      if (meta?.bilanType !== 'renouvellement') return null
      const evol = sec(sections, 'sec-anamnese') + ' ' + sec(sections, 'sec-diagnostic') + ' ' + sec(sections, 'sec-conclusion')
      const generic = /\b(plusieurs|certain.s) (progr[èe]s|r[ée]gression|am[ée]lioration)s? (observ|not)/i.test(evol)
      if (generic) {
        return { severity: 'error', message: 'Formulation générique en renouvellement ("plusieurs progrès observés") — règle : citation nominative obligatoire par nom d\'épreuve.' }
      }
      return null
    },
  },
  {
    id: 'exalang811-no-recalc-from-et',
    description: "Pas de mention d'un percentile recalculé depuis l'É-T",
    check(sections) {
      const all = fullText(sections).toLowerCase()
      // Patterns suspects : "calculé depuis", "É-T = X donc percentile..."
      const reg = /(calcul[ée] (depuis|à partir)|recalcul[ée]).{0,60}(percentile|centile)/i
      if (reg.test(all)) {
        return { severity: 'error', message: "Trace de recalcul de percentile depuis l'É-T — interdit (Q1 = P25, normes étalonnées priment sur la gaussienne)." }
      }
      return null
    },
  },
]

// ============================================================================
// COUCHE 3 — RÈGLES SPÉCIFIQUES EVALEO 6-15
// Source : lib/prompts/tests/evaleo-6-15.ts sections "INTERDICTION ABSOLUE" /
// "PIEGES FREQUENTS" / format Anne Frouard, lignes 248-815.
// ============================================================================

const EVALEO_RULES = [
  {
    id: 'evaleo-uses-7-classes-not-6-zones',
    description: 'EVALEO utilise les 7 classes officielles (pas les 6 zones Exalang Laurie)',
    check(sections) {
      const all = fullText(sections)
      // EVALEO doit citer "Classe 1" à "Classe 7" ; Exalang utilise "P11-P25",
      // "Zone de fragilité", etc.
      const usesClasses = /\bclasse\s*[1-7]\b/i.test(all)
      const usesExalangZones = /(zone de fragilit[ée]|moyenne haute|moyenne basse|difficult[ée] s[ée]v[èe]re)/i.test(all)
      if (!usesClasses) {
        return { severity: 'warn', message: 'Aucune mention "Classe 1-7" — EVALEO devrait référencer sa grille 7 classes officielle.' }
      }
      if (usesExalangZones) {
        return { severity: 'warn', message: 'Vocabulaire Exalang ("Zone de fragilité", "Moyenne haute"...) utilisé dans un bilan EVALEO — devrait utiliser la grille 7 classes.' }
      }
      return null
    },
  },
  {
    id: 'evaleo-no-class-restatement-in-comments',
    description: "Commentaires d'épreuve : pas d'intro qui re-cite la classe (Anne Frouard)",
    check(sections) {
      // Détecte les patterns interdits explicites dans le prompt EVALEO ligne 764-770.
      const all = fullText(sections)
      const patterns = [
        /Le score [a-zé\s]+ se situe en classe [0-9]/i,
        /La dict[ée]e [a-zé\s]+ est cot[ée]e en classe [0-9]/i,
        /Cette [ée]preuve obtient un percentile P[0-9]+/i,
        /En lecture de mots, le score est cot[ée] en classe [0-9]/i,
      ]
      for (const p of patterns) {
        const match = all.match(p)
        if (match) {
          return { severity: 'error', message: `Phrase d'intro interdite Anne Frouard : "${match[0]}" — le tableau au-dessus affiche déjà la classe.` }
        }
      }
      return null
    },
  },
  {
    id: 'evaleo-diagnostic-anne-frouard-length',
    description: 'Diagnostic EVALEO ~10-15 lignes (Anne Frouard) — pas un pavé de 20+ lignes',
    check(sections) {
      const diag = sec(sections, 'sec-diagnostic')
      const lines = diag.split('\n').filter(l => l.trim().length > 0).length
      if (lines > 25) {
        return { severity: 'warn', message: `Diagnostic de ${lines} lignes — Anne Frouard fait ~10-15 lignes max. Risque de pavé non-conforme au décret 2002-721.` }
      }
      return null
    },
  },
  {
    id: 'evaleo-amo-84-conclusion',
    description: 'AMO 8.4 (langage écrit) en conclusion pour EVALEO 6-15',
    check(sections) {
      const conclu = sec(sections, 'sec-conclusion').toLowerCase()
      // EVALEO peut aussi avoir AMO 9.4 si profil mixte LO+LE
      if (!/\bamo\s*(8\.4|9\.4)\b/i.test(conclu)) {
        return { severity: 'warn', message: 'Conclusion sans mention AMO 8.4 ou 9.4 — nomenclature obligatoire EVALEO.' }
      }
      return null
    },
  },
  {
    id: 'evaleo-decret-2002-721-formalism',
    description: "Formalisme juridique décret 2002-721 dans la conclusion (formule d'ouverture)",
    check(sections) {
      const all = sec(sections, 'sec-conclusion') + ' ' + sec(sections, 'sec-diagnostic')
      // Mots-clés du formalisme Anne Frouard : prescription, troubles spécifiques,
      // rééducation orthophonique.
      const hasFormula = /(troubles? sp[ée]cifique|r[ée][ée]ducation orthophonique|prescription|conform[ée]ment)/i.test(all)
      if (!hasFormula) {
        return { severity: 'warn', message: "Aucune trace du formalisme décret 2002-721 — formule juridique attendue dans la conclusion EVALEO." }
      }
      return null
    },
  },
  {
    id: 'evaleo-renouvellement-citation-nominale',
    description: 'En renouvellement : citation nominative des épreuves',
    check(sections, meta) {
      if (meta?.bilanType !== 'renouvellement') return null
      const evol = sec(sections, 'sec-anamnese') + ' ' + sec(sections, 'sec-diagnostic') + ' ' + sec(sections, 'sec-conclusion')
      const generic = /\b(plusieurs|certain.s) (progr[èe]s|r[ée]gression|am[ée]lioration)s? (observ|not)/i.test(evol)
      if (generic) {
        return { severity: 'error', message: 'Formulation générique en renouvellement — règle EVALEO : citation nominative obligatoire par nom d\'épreuve.' }
      }
      return null
    },
  },
]

// ============================================================================
// DISPATCHER + REPORT
// ============================================================================

const BILAN_RULESETS = {
  'Exalang 8-11': EXALANG811_RULES,
  'EVALEO 6-15': EVALEO_RULES,
}

function loadMetadata(fixtureDir) {
  const p = path.join(fixtureDir, 'metadata.json')
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function analyzeFixture(fixtureId) {
  const dir = path.join(RESULTS_DIR, fixtureId)
  const sectionsPath = path.join(dir, 'preview-sections.json')

  if (!fs.existsSync(sectionsPath)) {
    return {
      fixtureId,
      status: 'missing',
      bilan: null,
      message: `Aucun artefact dans ${dir} — lance d'abord \`npx playwright test\`.`,
      violations: [],
    }
  }

  const sections = JSON.parse(fs.readFileSync(sectionsPath, 'utf8'))
  const meta = loadMetadata(dir)
  const bilan = meta?.testUtilise ?? null

  const allRules = [...TRANSVERSE_RULES]
  if (bilan && BILAN_RULESETS[bilan]) {
    allRules.push(...BILAN_RULESETS[bilan])
  }

  const violations = []
  for (const rule of allRules) {
    const result = rule.check(sections, meta)
    if (result) {
      violations.push({ ruleId: rule.id, ...result })
    }
  }

  const hasError = violations.some(v => v.severity === 'error')
  return {
    fixtureId,
    bilan,
    rulesApplied: allRules.length,
    transverseRules: TRANSVERSE_RULES.length,
    specificRules: bilan && BILAN_RULESETS[bilan] ? BILAN_RULESETS[bilan].length : 0,
    status: hasError ? 'fail' : 'pass',
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

  console.log(`\nAnalyse clinique de ${fixtures.length} CRBO test(s)\n`)
  console.log(`Règles transverses : ${TRANSVERSE_RULES.length}`)
  console.log(`Règles spécifiques disponibles : Exalang 8-11 (${EXALANG811_RULES.length}), EVALEO 6-15 (${EVALEO_RULES.length})`)
  console.log('='.repeat(72))

  let totalErrors = 0
  let totalWarns = 0

  for (const fixtureId of fixtures) {
    const report = analyzeFixture(fixtureId)
    const icon =
      report.status === 'pass' ? '✅' :
      report.status === 'fail' ? '❌' : '⚠️ '
    console.log(`\n${icon} ${fixtureId} — ${report.status.toUpperCase()}`)

    if (report.bilan) {
      console.log(`   Bilan: ${report.bilan} | ${report.rulesApplied} règles appliquées (${report.transverseRules} transverses + ${report.specificRules} spécifiques)`)
    }
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

  console.log('\n' + '='.repeat(72))
  console.log(`Résumé global : ${totalErrors} erreur(s) bloquante(s), ${totalWarns} avertissement(s)`)

  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
