import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  EXTRACTION_PROMPT,
  EXTRACT_TOOL,
  extractedToLegacyText,
  type ExtractedResults,
} from '@/lib/prompts/extraction'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

// Timeout serveur Vercel — l'extraction PDF Vision peut prendre 30-50s par
// document. En multi-PDF on traite en parallèle, donc 90s suffit pour 3 PDFs.
export const maxDuration = 90

const MAX_FILES = 3
const MAX_BYTES_PER_FILE = 10 * 1024 * 1024 // 10 Mo
const PER_FILE_TIMEOUT_MS = 60_000

function isSupabaseUnavailable(err: any): boolean {
  if (!err) return false
  const code = err?.code ?? err?.cause?.code
  if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true
  const msg = String(err?.message ?? '').toLowerCase()
  if (msg.includes('fetch failed') || msg.includes('network')) return true
  return false
}

function isAcceptableType(mime: string): boolean {
  return mime.includes('pdf') || mime.includes('image')
}

/**
 * Une extraction Claude Vision pour un seul fichier.
 * Renvoie la structure parsée + métadonnées de log.
 */
async function extractOne(
  anthropic: Anthropic,
  file: File,
  index: number,
  total: number,
): Promise<{
  index: number
  fileName: string
  structure: ExtractedResults
  tokensUsed: number
}> {
  const tag = `PDF ${index + 1}/${total} (${file.name || 'sans-nom'})`
  const t0 = Date.now()

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  let contentBlock: Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam
  if (file.type.includes('pdf')) {
    contentBlock = {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    }
  } else {
    let imageMediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
    if (file.type.includes('jpeg') || file.type.includes('jpg')) imageMediaType = 'image/jpeg'
    else if (file.type.includes('gif')) imageMediaType = 'image/gif'
    else if (file.type.includes('webp')) imageMediaType = 'image/webp'
    contentBlock = {
      type: 'image',
      source: { type: 'base64', media_type: imageMediaType, data: base64 },
    }
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), PER_FILE_TIMEOUT_MS)

  let message
  try {
    message = await withRetry(
      () => anthropic.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          tools: [EXTRACT_TOOL],
          tool_choice: { type: 'tool', name: 'extract_test_results' },
          messages: [
            {
              role: 'user',
              content: [
                contentBlock,
                {
                  type: 'text',
                  text: EXTRACTION_PROMPT,
                  cache_control: { type: 'ephemeral' as const },
                },
              ],
            },
          ],
        },
        { signal: abortController.signal },
      ),
      {
        maxAttempts: 3,
        initialDelayMs: 1500,
        signal: abortController.signal,
        onRetry: (attempt, error: any) => {
          console.log(`[retry ${attempt}/3] ${tag} — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
        },
      },
    )
  } finally {
    clearTimeout(timeoutId)
  }

  const toolUseBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )
  if (!toolUseBlock || toolUseBlock.name !== 'extract_test_results') {
    throw Object.assign(new Error(`${tag} — aucune structure exploitable produite`), {
      status: 502,
    })
  }

  const structure = toolUseBlock.input as ExtractedResults

  // Heuristique fallback test_name à partir du nom de fichier
  if (!structure.test_name) {
    const fname = (file.name || '').toLowerCase()
    const heuristiques: Array<[RegExp, string]> = [
      [/exalang[\s_-]*8[\s_-]*11/, 'Exalang 8-11'],
      [/exalang[\s_-]*11[\s_-]*15/, 'Exalang 11-15'],
      [/exalang[\s_-]*5[\s_-]*8/, 'Exalang 5-8'],
      [/exalang[\s_-]*3[\s_-]*6/, 'Exalang 3-6'],
      [/examath/, 'Examath'],
      [/evalo/, 'EVALO 2-6'],
      [/\belo\b/, 'ELO'],
      [/bale/, 'BALE'],
      [/belec/, 'BELEC'],
      [/betl/, 'BETL'],
      [/moca/, 'MoCA'],
      [/n-?eel/, 'N-EEL'],
      [/bilo/, 'BILO'],
      [/evaleo/, 'EVALEO 6-15'],
    ]
    for (const [re, name] of heuristiques) {
      if (re.test(fname)) {
        structure.test_name = name
        structure.warnings.push(`Test non identifié dans le document, déduit du nom de fichier : ${name}`)
        break
      }
    }
  }

  // Filet de sécurité : normaliser percentile_value à partir de percentile_raw
  for (const e of structure.epreuves ?? []) {
    if (e.percentile_raw && (e.percentile_value == null || isNaN(e.percentile_value))) {
      const raw = e.percentile_raw.trim().toUpperCase()
      if (raw.startsWith('Q1')) e.percentile_value = 25
      else if (raw.startsWith('MED') || raw === 'Q2') e.percentile_value = 50
      else if (raw.startsWith('Q3')) e.percentile_value = 75
      else {
        const m = raw.match(/P?(\d+)/)
        if (m) e.percentile_value = parseInt(m[1], 10)
      }
    }
  }

  const tokensUsed =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)
  const dt = Date.now() - t0
  console.log(
    `[extract-pdf] ${tag} traité : ${structure.epreuves?.length ?? 0} épreuves extraites ` +
    `(test=${structure.test_name ?? 'non identifié'}, ${tokensUsed} tokens, ${dt}ms)`,
  )

  return { index, fileName: file.name, structure, tokensUsed }
}

/**
 * Fusionne N structures extraites en une seule.
 *
 * Règles de consolidation :
 *   - test_name : premier non-null rencontré (les PDFs d'un même bilan ont le
 *     même test ; en cas de divergence on garde le premier et on warn).
 *   - patient_info : merge champ par champ, premier non-null gagne.
 *   - epreuves : toutes les épreuves de tous les PDFs concaténées, puis
 *     dédoublonnées par `nom` (lowercase trim). En cas de doublon, **la dernière
 *     occurrence (PDF le plus récent dans l'ordre d'upload) gagne**.
 *   - warnings : concat préfixés par "[PDF N]".
 *   - notes_extraction : concat des notes par PDF.
 */
function mergeStructures(
  parts: { index: number; fileName: string; structure: ExtractedResults }[],
): ExtractedResults {
  if (parts.length === 1) return parts[0].structure

  const ordered = [...parts].sort((a, b) => a.index - b.index)

  // test_name : premier non-null
  const testNames = ordered.map((p) => p.structure.test_name).filter(Boolean) as string[]
  const test_name = testNames[0] ?? null
  const divergences = new Set(testNames).size > 1

  // patient_info : merge premier non-null par champ
  const patient_info: ExtractedResults['patient_info'] = {}
  for (const p of ordered) {
    const pi = p.structure.patient_info ?? {}
    for (const k of ['prenom', 'nom', 'age', 'classe', 'bilan_date'] as const) {
      if (!patient_info[k] && pi[k]) patient_info[k] = pi[k]
    }
  }

  // Épreuves : map indexée par nom normalisé, écrasée par les PDFs suivants
  // (= "le PDF le plus récent gagne" pour les doublons).
  const epreuvesByKey = new Map<string, ExtractedResults['epreuves'][number]>()
  for (const p of ordered) {
    for (const e of p.structure.epreuves ?? []) {
      const key = (e.nom || '').toLowerCase().trim()
      if (!key) continue
      epreuvesByKey.set(key, e)
    }
  }
  const epreuves = Array.from(epreuvesByKey.values())

  // Warnings préfixés
  const warnings: string[] = []
  for (const p of ordered) {
    const tag = `PDF ${p.index + 1}`
    for (const w of p.structure.warnings ?? []) {
      warnings.push(`[${tag}] ${w}`)
    }
  }
  if (divergences) {
    const uniqueTests = Array.from(new Set(testNames))
    warnings.unshift(
      `Tests détectés divergents entre les PDFs : ${uniqueTests.join(', ')}. ` +
      `Le test "${test_name}" du premier PDF a été retenu.`,
    )
  }

  // Notes extraction par PDF
  const notesParts: string[] = []
  for (const p of ordered) {
    if (p.structure.notes_extraction) {
      notesParts.push(`[PDF ${p.index + 1} — ${p.fileName}] ${p.structure.notes_extraction}`)
    }
  }

  return {
    test_name,
    patient_info,
    epreuves,
    warnings,
    notes_extraction: notesParts.length > 0 ? notesParts.join('\n') : null,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerSupabaseClient()
    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      if (isSupabaseUnavailable(err)) {
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
          { status: 503 },
        )
      }
      throw err
    }
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const formData = await request.formData()
    // Accepte soit `files` (multi, nouveau), soit `file` (legacy single).
    // L'ordre d'upload est conservé ; le PDF le plus récent doit donc être
    // ajouté EN DERNIER côté client (les doublons sont écrasés par les suivants).
    const multi = formData.getAll('files').filter((v): v is File => v instanceof File)
    const single = formData.get('file')
    const files: File[] = multi.length > 0
      ? multi
      : (single instanceof File ? [single] : [])

    if (files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Trop de fichiers (max ${MAX_FILES}).` },
        { status: 400 },
      )
    }

    for (const f of files) {
      if (!isAcceptableType(f.type)) {
        return NextResponse.json(
          { error: `Format non supporté pour "${f.name}". Utilisez un PDF ou une image.` },
          { status: 400 },
        )
      }
      if (f.size > MAX_BYTES_PER_FILE) {
        return NextResponse.json(
          { error: `Fichier "${f.name}" trop volumineux (max 10 Mo).` },
          { status: 413 },
        )
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Service de génération non configuré.' },
        { status: 500 },
      )
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    console.log(`[extract-pdf] Démarrage extraction de ${files.length} PDF(s)`)

    // Extraction parallèle : chaque PDF a sa propre requête Claude Vision avec
    // son propre AbortController (timeout 60s). Promise.all rejette si UN
    // appel échoue — comportement voulu : si un PDF est corrompu, l'utilisateur
    // doit le savoir explicitement plutôt que de récupérer un résultat partiel.
    const parts = await Promise.all(
      files.map((f, i) => extractOne(anthropic, f, i, files.length)),
    )

    const merged = mergeStructures(parts)
    const totalTokens = parts.reduce((sum, p) => sum + ((p as any).tokensUsed ?? 0), 0)

    console.log(
      `[extract-pdf] Consolidation terminée : ${merged.epreuves?.length ?? 0} épreuves uniques ` +
      `(${parts.reduce((s, p) => s + (p.structure.epreuves?.length ?? 0), 0)} brutes), ` +
      `test=${merged.test_name ?? 'non identifié'}, ${totalTokens} tokens total`,
    )

    const legacyText = extractedToLegacyText(merged)

    return NextResponse.json({
      success: true,
      structure: merged,
      resultats: legacyText,
      detectedTest: merged.test_name ?? '',
      tokensUsed: totalTokens,
      filesProcessed: parts.length,
    })
  } catch (error: any) {
    logger.error('extract-pdf', error)

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: "L'extraction a dépassé 60 secondes pour un des PDFs. Documents trop volumineux ou API lente. Réessayez." },
        { status: 504 },
      )
    }
    if (isSupabaseUnavailable(error)) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
        { status: 503 },
      )
    }
    if (error?.status === 502) {
      return NextResponse.json(
        { error: error.message || "Aucune structure d'extraction exploitable n'a été produite." },
        { status: 502 },
      )
    }
    const anthropicHandled = handleAnthropicError(error, "l'import du PDF")
    if (anthropicHandled) return anthropicHandled
    return NextResponse.json(
      { error: "Erreur lors de l'extraction. Veuillez réessayer." },
      { status: 500 },
    )
  }
}
