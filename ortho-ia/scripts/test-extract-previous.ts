/**
 * Test local de complétude de l'extraction du bilan précédent.
 *
 * Usage : ANTHROPIC_API_KEY=... npx tsx scripts/test-extract-previous.ts <fichier>
 *
 * Le script reproduit EXACTEMENT le pipeline de la route
 * `/api/extract-previous-bilan` :
 *   - DOCX → mammoth → texte brut → prompt DOCX
 *   - PDF  → base64 → document block → prompt PDF
 *   - max_tokens = 32 768 (identique à la prod)
 * et imprime le détail de l'extraction pour vérifier l'exhaustivité.
 *
 * Cas d'usage : valider en local la correction d'un bilan dont l'extraction
 * a manqué des épreuves (régression "✦ Nouvelle" en cascade dans la table
 * comparative du Word).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import {
  EXTRACT_PREVIOUS_TOOL,
  EXTRACT_PROMPT_PDF,
  EXTRACT_PROMPT_DOCX,
} from '../lib/prompts/previous-bilan'

// Charge .env.local pour ANTHROPIC_API_KEY
function loadDotEnv() {
  try {
    const txt = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // pas grave — l'utilisateur peut passer ANTHROPIC_API_KEY en env directe
  }
}
loadDotEnv()

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage : npx tsx scripts/test-extract-previous.ts <fichier.pdf|docx>')
    process.exit(1)
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY manquante (cherchée dans .env.local et l\'environnement).')
    process.exit(1)
  }

  const absPath = resolve(filePath)
  const fileBytes = readFileSync(absPath)
  const fileName = absPath.split(/[\\/]/).pop() || 'fichier'
  const isPdf = /\.pdf$/i.test(fileName)
  const isDocx = /\.docx?$/i.test(fileName)
  if (!isPdf && !isDocx) {
    console.error('Format non supporté. Attendu : .pdf ou .docx')
    process.exit(1)
  }

  console.log(`\n📄 Fichier : ${fileName} (${(fileBytes.length / 1024).toFixed(1)} Ko, ${isPdf ? 'PDF' : 'DOCX'})`)

  const anthropic = new Anthropic({ apiKey })

  let content: Anthropic.MessageParam['content']
  if (isPdf) {
    const base64 = fileBytes.toString('base64')
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
      { type: 'text', text: EXTRACT_PROMPT_PDF, cache_control: { type: 'ephemeral' as const } },
    ]
  } else {
    const result = await mammoth.extractRawText({ buffer: fileBytes })
    let text = (result?.value || '').trim()
    if (!text || text.length < 30) {
      console.error('DOCX vide ou illisible.')
      process.exit(1)
    }
    // Mode FOCUS_BILAN : si la variable d'env est posée, on isole la section
    // BILAN du Word de renouvellement (qui contient le bilan ACTUEL avec
    // toutes ses épreuves) — utile pour tester l'extraction sur un volume
    // important de données, sans qu'un tableau comparatif amont ne capte
    // l'attention du modèle.
    if (process.env.FOCUS_BILAN === '1') {
      const start = text.search(/\bBILAN\b\s*Légende/i)
      const end = text.search(/\bSYNTHÈSE\s+ET\s+CONCLUSIONS\b/i)
      if (start >= 0) {
        const slice = end > start ? text.slice(start, end) : text.slice(start)
        text = slice.trim()
        console.log(`   Mode FOCUS_BILAN : isolé ${text.length} caractères de la section BILAN`)
      } else {
        console.log('   Mode FOCUS_BILAN : section BILAN introuvable, on garde tout')
      }
    }
    const TRUNCATE = 80_000
    const truncated = text.length > TRUNCATE ? text.slice(0, TRUNCATE) + '\n\n[...]' : text
    console.log(`   Texte mammoth : ${text.length} caractères (tronqué à ${TRUNCATE} si plus long)`)
    const promptText = `${EXTRACT_PROMPT_DOCX}\n\n## DOCUMENT À ANALYSER\n\n${truncated}`
    content = [{ type: 'text', text: promptText, cache_control: { type: 'ephemeral' as const } }]
  }

  console.log('🤖 Appel Anthropic (claude-sonnet-4-6, max_tokens=32768, streaming)…')
  const t0 = Date.now()
  // Streaming requis par le SDK quand max_tokens > ~21k.
  const message = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 32_768,
    tools: [EXTRACT_PREVIOUS_TOOL],
    tool_choice: { type: 'tool', name: 'extract_previous_bilan' },
    messages: [{ role: 'user', content }],
  }).finalMessage()
  const dt = Date.now() - t0

  const tool = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  )
  if (!tool || tool.name !== 'extract_previous_bilan') {
    console.error('❌ Aucun tool_use exploité')
    process.exit(2)
  }

  type Extracted = {
    bilan_date: string
    tests_utilises: string[]
    domains: { nom: string; epreuves: { nom: string; percentile: string; percentile_value: number }[] }[]
    diagnostic: string
    amenagements?: string[]
  }
  const ex = tool.input as Extracted

  const totalEp = ex.domains.reduce((s, d) => s + d.epreuves.length, 0)
  console.log(`\n✅ Extraction terminée en ${dt}ms`)
  console.log(`   stop_reason : ${message.stop_reason}`)
  console.log(`   tokens     : ${(message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)} (in=${message.usage?.input_tokens}, out=${message.usage?.output_tokens})`)
  console.log(`   bilan_date : ${ex.bilan_date || '(vide)'}`)
  console.log(`   tests      : ${ex.tests_utilises?.join(', ') || '(vide)'}`)
  console.log(`   diagnostic : ${ex.diagnostic ? ex.diagnostic.slice(0, 80) + (ex.diagnostic.length > 80 ? '…' : '') : '(vide)'}`)
  console.log(`   ${ex.domains.length} domaines · ${totalEp} épreuves au total\n`)

  for (const d of ex.domains) {
    console.log(`   📂 ${d.nom} (${d.epreuves.length} épreuves)`)
    for (const e of d.epreuves) {
      console.log(`      - ${e.nom.padEnd(60)} ${e.percentile.padEnd(12)} (P${e.percentile_value})`)
    }
  }

  if (message.stop_reason === 'max_tokens') {
    console.log('\n⚠ stop_reason=max_tokens — la sortie a été tronquée, augmenter max_tokens.')
  }
  // Verdict simple
  if (totalEp >= 25) {
    console.log(`\n🟢 OK — ${totalEp} épreuves extraites (>=25 attendues pour un Exalang complet).`)
  } else if (totalEp >= 12) {
    console.log(`\n🟡 PARTIEL — ${totalEp} épreuves extraites (cible >=25 pour un Exalang complet).`)
  } else {
    console.log(`\n🔴 INSUFFISANT — seulement ${totalEp} épreuves extraites.`)
  }
}

main().catch((e) => {
  console.error('❌', e?.message ?? e)
  process.exit(2)
})
