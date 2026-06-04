import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  EXALANG58_EXTRACT_PROMPT,
  EXALANG58_EXTRACT_TOOL,
  type Exalang58Extracted,
} from '@/lib/prompts/extraction/exalang-5-8'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

/**
 * POST /api/extract-exalang-5-8-pdf
 *
 * Recoit un PDF Exalang 5-8 et retourne un objet `Exalang58Extracted` typage
 * strict, pret a pre-remplir le state du form
 * components/forms/Exalang58ScoresInput.tsx.
 *
 * Source attendue : rapport du module resultats HappyNeuron Pro (Exalang 5-8)
 * OU scan du cahier de passation rempli a la main. Le format docx/image est
 * refuse : la grille tabulaire et les barres colorees de percentile se
 * perdent en extraction texte (mammoth) ou Vision image et conduisent a des
 * erreurs de bande percentile. Seul le PDF preserve l'integralite via le
 * mode "document" de Claude Vision.
 *
 * Body : FormData multipart avec champ `file` (max 10 Mo).
 *
 * Respecte la regle d'isolation CLAUDE.md : cette route est specifique a
 * Exalang 5-8, n'est pas appelee par d'autres bilans.
 */

export const maxDuration = 90

const MAX_BYTES = 10 * 1024 * 1024 // 10 Mo
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
    const kind = detectKind(file)
    if (kind === 'docx' || kind === 'image') {
      return NextResponse.json(
        {
          error:
            "Exalang 5-8 n'accepte que le PDF a l'import : les tableaux Word ou les images font perdre la grille tabulaire et la position des bandes de percentile. Convertissez votre document en PDF avant import (Word > Fichier > Exporter > PDF).",
        },
        { status: 400 },
      )
    }
    if (kind !== 'pdf') {
      return NextResponse.json(
        { error: 'Type de fichier non supporte. Seul le PDF est accepte pour Exalang 5-8.' },
        { status: 400 },
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const content: Anthropic.MessageParam['content'] = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
      {
        type: 'text',
        text: EXALANG58_EXTRACT_PROMPT,
        cache_control: { type: 'ephemeral' as const },
      },
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
            tools: [EXALANG58_EXTRACT_TOOL],
            tool_choice: { type: 'tool', name: 'extract_exalang_5_8_results' },
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
    if (!toolUse || toolUse.name !== 'extract_exalang_5_8_results') {
      logger.error('extract-exalang-5-8-pdf', new Error('Reponse Claude sans tool_use attendu'))
      return NextResponse.json({ error: 'Reponse IA invalide — reessayez.' }, { status: 502 })
    }

    const extracted = toolUse.input as Exalang58Extracted

    return NextResponse.json({
      success: true,
      extracted,
      tokens_used: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (err: any) {
    const handled = handleAnthropicError(err, "l'import du PDF Exalang 5-8")
    if (handled) {
      logger.warn('extract-exalang-5-8-pdf-anthropic', err?.message ?? 'erreur Anthropic')
      return handled
    }
    logger.error('extract-exalang-5-8-pdf', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur durant l\'extraction.' },
      { status: 500 },
    )
  }
}
