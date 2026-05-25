import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
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
 * Recoit un PDF, une image ou un document Word (.docx) et retourne un objet
 * `EvaleoExtracted` typage strict, pret a pre-remplir le state du form
 * components/forms/Evaleo615ScoresInput.tsx.
 *
 * Sources acceptees :
 *  - PDF : rapport de cotation HappyNeuron, scan du cahier rempli → Claude
 *    Vision document.
 *  - Image (PNG/JPEG/WebP) : photo du cahier → Claude Vision image.
 *  - DOCX : bilan deja redige en Word → mammoth extrait le texte brut, Claude
 *    le structure (memes prompt + tool — pas de bloc vision).
 *
 * Body : FormData multipart avec champ `file` (max 10 Mo).
 *
 * Respecte la regle d'isolation CLAUDE.md : cette route est specifique a
 * EVALEO, n'est pas appelee par d'autres bilans. Elle reutilise les
 * utilitaires generiques (withRetry, handleAnthropicError, logger, mammoth)
 * mais ne les modifie pas.
 */

export const maxDuration = 90

const MAX_BYTES = 10 * 1024 * 1024 // 10 Mo
const PER_FILE_TIMEOUT_MS = 60_000
const DOCX_TRUNCATE = 80_000 // ~80k chars, large marge sur la limite tokens

const SUPPORTED_DOCX_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', // .doc legacy — on tente quand meme mammoth, sinon erreur
]

function detectKind(file: File): 'pdf' | 'image' | 'docx' | 'unknown' {
  const m = file.type || ''
  const n = file.name || ''
  if (m.includes('pdf') || /\.pdf$/i.test(n)) return 'pdf'
  if (SUPPORTED_DOCX_MIMES.includes(m) || /\.docx?$/i.test(n)) return 'docx'
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
    if (kind === 'unknown') {
      return NextResponse.json(
        { error: 'Type de fichier non supporte. Acceptes : PDF, image (PNG/JPEG/WebP), Word (.docx).' },
        { status: 400 },
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Construit le bloc de contenu adapte au format.
    // PDF/image -> bloc vision base64 ; DOCX -> mammoth -> texte injecte dans le prompt.
    let content: Anthropic.MessageParam['content']

    if (kind === 'pdf') {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      content = [
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
    } else if (kind === 'image') {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      let imageMediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
      if (file.type.includes('jpeg') || file.type.includes('jpg')) imageMediaType = 'image/jpeg'
      else if (file.type.includes('gif')) imageMediaType = 'image/gif'
      else if (file.type.includes('webp')) imageMediaType = 'image/webp'
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: imageMediaType, data: base64 },
        },
        {
          type: 'text',
          text: EVALEO_EXTRACT_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    } else {
      // DOCX : mammoth -> texte brut -> bloc texte uniquement.
      const buffer = Buffer.from(await file.arrayBuffer())
      let text = ''
      try {
        const result = await mammoth.extractRawText({ buffer })
        text = (result?.value || '').trim()
      } catch (e: any) {
        logger.error('extract-evaleo-pdf-mammoth', e)
        return NextResponse.json(
          { error: "Le document Word n'a pas pu etre lu. Reessayez avec un PDF." },
          { status: 422 },
        )
      }
      if (!text || text.length < 30) {
        return NextResponse.json(
          { error: 'Le document Word est vide ou illisible.' },
          { status: 422 },
        )
      }
      if (text.length > DOCX_TRUNCATE) {
        logger.warn(
          'extract-evaleo-pdf-docx-truncate',
          `DOCX tronque : ${text.length} -> ${DOCX_TRUNCATE} caracteres`,
        )
      }
      const truncated = text.length > DOCX_TRUNCATE
        ? text.slice(0, DOCX_TRUNCATE) + '\n\n[... document tronque ...]'
        : text
      content = [
        {
          type: 'text',
          text: `${EVALEO_EXTRACT_PROMPT}\n\n## DOCUMENT WORD A ANALYSER (texte extrait via mammoth)\n\n${truncated}`,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
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
