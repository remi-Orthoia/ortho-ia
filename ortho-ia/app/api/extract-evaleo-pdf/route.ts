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
 * Recoit un PDF et retourne un objet `EvaleoExtracted` typage strict, pret a
 * pre-remplir le state du form components/forms/Evaleo615ScoresInput.tsx.
 *
 * **EVALEO PDF UNIQUEMENT** : la cotation EVALEO encode les classes (1 a 7)
 * dans des tableaux ou la cellule de la classe atteinte est marquee X.
 * L'extraction texte d'un .docx (via mammoth) ou d'une image (via Vision)
 * fait perdre la position en colonne du X et conduit a des erreurs de
 * cotation sur des epreuves multi-sous-scores (Evalouette, Mouette, Stroop,
 * Lecture de pseudomots). Seule la lecture PDF par Claude Vision document
 * preserve la grille tabulaire. Si l'ortho dispose d'un .docx, elle doit le
 * convertir en PDF avant import.
 *
 * Body : FormData multipart avec champ `file` (max 10 Mo).
 *
 * Respecte la regle d'isolation CLAUDE.md : cette route est specifique a
 * EVALEO, n'est pas appelee par d'autres bilans.
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
    const kind = detectKind(file)
    if (kind === 'docx' || kind === 'image') {
      return NextResponse.json(
        {
          error:
            "EVALEO 6-15 n'accepte que le PDF a l'import : les tableaux Word ou les images ne permettent pas de detecter de facon fiable la position des marques de classe (X dans les colonnes 1 a 7). Convertissez votre document en PDF avant import (Word > Fichier > Exporter > PDF).",
        },
        { status: 400 },
      )
    }
    if (kind !== 'pdf') {
      return NextResponse.json(
        { error: 'Type de fichier non supporte. Seul le PDF est accepte pour EVALEO 6-15.' },
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
        text: EVALEO_EXTRACT_PROMPT,
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
            tools: [EVALEO_EXTRACT_TOOL],
            tool_choice: { type: 'tool', name: 'extract_evaleo_results' },
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
