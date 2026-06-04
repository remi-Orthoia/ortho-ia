import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  PREDIFEX_EXTRACT_PROMPT,
  PREDIFEX_EXTRACT_TOOL,
  type PrediFexExtracted,
} from '@/lib/prompts/extraction/predifex'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

/**
 * POST /api/extract-predifex-pdf — extracteur PDF dedie PrediFex.
 *
 * Specifique a PrediFex (HappyNeuron — gamme PREDI, fonctions executives).
 * 10 epreuves / 4 zones HappyNeuron / stratification age × NSC obligatoire.
 *
 * Pattern identique aux autres extracteurs dedies.
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
        { error: "PrediFex n'accepte que le PDF a l'import. Convertissez votre document en PDF avant import." },
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
      { type: 'text', text: PREDIFEX_EXTRACT_PROMPT, cache_control: { type: 'ephemeral' as const } },
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
            tools: [PREDIFEX_EXTRACT_TOOL],
            tool_choice: { type: 'tool', name: 'extract_predifex_results' },
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
    if (!toolUse || toolUse.name !== 'extract_predifex_results') {
      logger.error('extract-predifex-pdf', new Error('Reponse Claude sans tool_use attendu'))
      return NextResponse.json({ error: 'Reponse IA invalide — reessayez.' }, { status: 502 })
    }

    const extracted = toolUse.input as PrediFexExtracted
    return NextResponse.json({
      success: true,
      extracted,
      tokens_used: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (err: any) {
    const handled = handleAnthropicError(err, "l'import du PDF PrediFex")
    if (handled) {
      logger.warn('extract-predifex-pdf-anthropic', err?.message ?? 'erreur Anthropic')
      return handled
    }
    logger.error('extract-predifex-pdf', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur durant l\'extraction.' },
      { status: 500 },
    )
  }
}
