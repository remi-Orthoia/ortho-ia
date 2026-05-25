import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  EVALEO_EXTRACT_PROMPT,
  EVALEO_EXTRACT_TOOL,
  type EvaleoExtracted,
} from '@/lib/prompts/extraction/evaleo'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

/**
 * POST /api/extract-evaleo-pdf
 *
 * Recoit un PDF (rapport de cotation HappyNeuron ou scan cahier rempli) et
 * retourne un objet `EvaleoExtracted` typage strict, pret a pre-remplir le
 * state du form components/forms/Evaleo615ScoresInput.tsx.
 *
 * Body : FormData multipart avec champ `file` (PDF unique, max 10 Mo).
 *
 * Respecte la regle d'isolation CLAUDE.md : cette route est specifique a
 * EVALEO, n'est pas appelee par d'autres bilans. Elle reutilise les
 * utilitaires generiques (withRetry, handleAnthropicError, logger) mais ne
 * les modifie pas.
 */

export const maxDuration = 90

const MAX_BYTES = 10 * 1024 * 1024 // 10 Mo
const PER_FILE_TIMEOUT_MS = 60_000

function isAcceptableType(mime: string): boolean {
  return mime.includes('pdf') || mime.includes('image')
}

export async function POST(request: NextRequest) {
  try {
    // Auth requise (le PDF peut contenir des donnees patient).
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json(
        { error: 'Service de generation non configure. Contactez le support.' },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant (champ "file" attendu).' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} Mo).` }, { status: 400 })
    }
    if (!isAcceptableType(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporte (PDF ou image uniquement).' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
            max_tokens: 8192,
            tools: [EVALEO_EXTRACT_TOOL],
            tool_choice: { type: 'tool', name: 'extract_evaleo_results' },
            messages: [
              {
                role: 'user',
                content: [
                  contentBlock,
                  {
                    type: 'text',
                    text: EVALEO_EXTRACT_PROMPT,
                    cache_control: { type: 'ephemeral' as const },
                  },
                ],
              },
            ],
          },
          { signal: abortController.signal },
        ),
        { maxAttempts: 3 },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )
    if (!toolUse || toolUse.name !== 'extract_evaleo_results') {
      logger.error('extract-evaleo-pdf', new Error('Reponse Claude sans tool_use attendu'))
      return NextResponse.json({ error: 'Reponse IA invalide — reessayez.' }, { status: 502 })
    }

    const extracted = toolUse.input as EvaleoExtracted

    return NextResponse.json({
      success: true,
      extracted,
      tokens_used: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (err: any) {
    const handled = handleAnthropicError(err, "l'import du PDF EVALEO")
    if (handled) {
      logger.warn('extract-evaleo-pdf-anthropic', err?.message ?? 'erreur Anthropic')
      return handled
    }
    logger.error('extract-evaleo-pdf', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur durant l\'extraction.' },
      { status: 500 },
    )
  }
}
