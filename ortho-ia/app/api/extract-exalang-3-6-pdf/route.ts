import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  EXALANG36_EXTRACT_PROMPT,
  EXALANG36_EXTRACT_TOOL,
  type Exalang36Extracted,
} from '@/lib/prompts/extraction/exalang-3-6'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

/**
 * POST /api/extract-exalang-3-6-pdf — pattern identique a Exalang 5-8 / 8-11.
 * Specifique a Exalang 3-6, 11 epreuves / 4 groupes A.1 / A.2 / B.1 / C.1.
 */

export const maxDuration = 90

const MAX_BYTES = 10 * 1024 * 1024
const PER_FILE_TIMEOUT_MS = 60_000

function detectKind(file: File): 'pdf' | 'docx' | 'image' | 'unknown' {
  const m = file.type || ''
  const n = file.name || ''
  if (m.includes('pdf') || /\.pdf$/i.test(n)) return 'pdf'
  if (/\.docx?$/i.test(n) || m.includes('officedocument') || m === 'application/msword') return 'docx'
  if (m.includes('image')) return 'image'
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json({ error: 'Service de generation non configure.' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant (champ "file" attendu).' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} Mo).` }, { status: 400 })
    }
    const kind = detectKind(file)
    if (kind === 'docx' || kind === 'image') {
      return NextResponse.json(
        { error: "Exalang 3-6 n'accepte que le PDF a l'import. Convertissez votre document en PDF avant import." },
        { status: 400 },
      )
    }
    if (kind !== 'pdf') {
      return NextResponse.json({ error: 'Type de fichier non supporte. Seul le PDF est accepte.' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const content: Anthropic.MessageParam['content'] = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
      { type: 'text', text: EXALANG36_EXTRACT_PROMPT, cache_control: { type: 'ephemeral' as const } },
    ]

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), PER_FILE_TIMEOUT_MS)

    let message
    try {
      message = await withRetry(
        () => anthropic.messages.create(
          {
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            tools: [EXALANG36_EXTRACT_TOOL],
            tool_choice: { type: 'tool', name: 'extract_exalang_3_6_results' },
            messages: [{ role: 'user', content }],
          },
          { signal: abortController.signal },
        ),
        { maxAttempts: 3, signal: abortController.signal },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )
    if (!toolUse || toolUse.name !== 'extract_exalang_3_6_results') {
      logger.error('extract-exalang-3-6-pdf', new Error('Reponse Claude sans tool_use attendu'))
      return NextResponse.json({ error: 'Reponse IA invalide — reessayez.' }, { status: 502 })
    }

    const extracted = toolUse.input as Exalang36Extracted
    return NextResponse.json({
      success: true,
      extracted,
      tokens_used: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (err: any) {
    const handled = handleAnthropicError(err, "l'import du PDF Exalang 3-6")
    if (handled) {
      logger.warn('extract-exalang-3-6-pdf-anthropic', err?.message ?? 'erreur Anthropic')
      return handled
    }
    logger.error('extract-exalang-3-6-pdf', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur durant l\'extraction.' },
      { status: 500 },
    )
  }
}
