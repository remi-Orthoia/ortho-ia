import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  EXTRACTION_PROMPT,
  EXTRACT_TOOL,
  extractedToLegacyText,
  type ExtractedResults,
} from '@/lib/prompts/extraction'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez un PDF ou une image.' },
        { status: 400 },
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo).' },
        { status: 413 },
      )
    }

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

    // Timeout 60s — l'extraction de PDF volumineux peut être lente
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 60_000)

    // Prompt caching : instructions stables → cache 5 min, ~80% d'économie
    let message
    try {
      message = await anthropic.messages.create(
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
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUseBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (!toolUseBlock || toolUseBlock.name !== 'extract_test_results') {
      return NextResponse.json(
        { error: "Claude n'a pas renvoyé de structure d'extraction exploitable." },
        { status: 502 },
      )
    }

    const structure = toolUseBlock.input as ExtractedResults

    // Fallback détection test si Claude a laissé test_name null : heuristique sur le nom de fichier.
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

    // Filet de sécurité : normaliser percentile_value à partir de percentile_raw si incohérent
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

    const legacyText = extractedToLegacyText(structure)

    return NextResponse.json({
      success: true,
      structure,
      resultats: legacyText, // Compat UI existante
      detectedTest: structure.test_name ?? '',
      tokensUsed:
        (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (error: any) {
    // Logging SANS payload — évite fuite de données patient
    console.error('Erreur extraction PDF:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: "L'extraction a dépassé 60 secondes. PDF trop volumineux ou API lente. Réessayez." },
        { status: 504 },
      )
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Trop de demandes. Attendez une minute et réessayez.' },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de l'extraction. Veuillez réessayer." },
      { status: 500 },
    )
  }
}
