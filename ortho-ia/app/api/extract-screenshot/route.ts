import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  EXTRACTION_PROMPT,
  EXTRACT_TOOL,
  extractedToLegacyText,
  type ExtractedResults,
} from '@/lib/prompts/extraction'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isAnthropicCreditError } from '@/lib/anthropic-error'
import { withRetry } from '@/lib/retry'

// Vision Claude peut prendre 30-50s sur une grande image stitchée.
export const maxDuration = 60

// CORS headers — autorise l'extension Chrome (origin chrome-extension://…) et
// la prod ortho-ia. On reste permissif sur l'origin car les extensions ont un
// ID variable selon utilisateur. La sécurité tient par le Bearer token.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function jsonCORS(body: unknown, init: { status?: number } = {}) {
  return NextResponse.json(body, { status: init.status ?? 200, headers: CORS_HEADERS })
}

/**
 * Authentifie l'appelant en supportant deux flows :
 *  - cookies Supabase (web app standard)
 *  - Authorization: Bearer <jwt> (extension Chrome — pas de cookies cross-origin)
 */
async function getCallerUser(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearer) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data, error } = await supabase.auth.getUser(bearer)
    if (error || !data?.user) return null
    return data.user
  }
  // Fallback cookies (web)
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

const VISION_PROMPT_PREAMBLE = `Tu reçois UNE SEULE grande image qui correspond à plusieurs captures d'écran HappyNeuron empilées verticalement (l'utilisateur a scrollé pour voir tous les résultats). Lis l'image dans son ensemble — il peut y avoir des bordures de fenêtre Windows, des barres de défilement, et des zones répétées si la déduplication d'overlap a été imparfaite. Ignore ces artefacts et concentre-toi sur les tableaux de résultats.

`

export async function POST(request: NextRequest) {
  try {
    const user = await getCallerUser(request)
    if (!user) {
      return jsonCORS({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.image !== 'string' || body.image.length < 100) {
      return jsonCORS({ error: 'Champ "image" (base64 PNG) manquant ou invalide.' }, { status: 400 })
    }

    // Garde-fou taille — le base64 d'une image très haute peut peser plusieurs Mo.
    // 25 Mo de base64 ≈ 18 Mo binaire — suffisant pour 5-6 captures empilées.
    if (body.image.length > 25 * 1024 * 1024) {
      return jsonCORS(
        { error: 'Image trop volumineuse (>25 Mo base64). Réduisez le nombre de pages.' },
        { status: 413 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonCORS({ error: 'Service de génération non configuré.' }, { status: 500 })
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 60_000)

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
                  {
                    type: 'image',
                    source: { type: 'base64', media_type: 'image/png', data: body.image },
                  },
                  {
                    type: 'text',
                    text: VISION_PROMPT_PREAMBLE + EXTRACTION_PROMPT,
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
            console.log(`[retry ${attempt}/3] Claude extract-screenshot — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
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
      return jsonCORS(
        { error: "Aucune structure d'extraction exploitable n'a été produite." },
        { status: 502 },
      )
    }
    const structure = toolUseBlock.input as ExtractedResults

    // Normalisation percentile_value depuis percentile_raw (filet de sécurité)
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

    // Stocker une session de prefill — RLS garantit que seul l'utilisateur peut la lire.
    // L'écriture passe par le service role car la table peut interdire INSERT côté user.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1h
    const legacyText = extractedToLegacyText(structure)
    const sessionPayload = {
      user_id: user.id,
      data: {
        structure,
        resultats: legacyText,
        detectedTest: structure.test_name ?? null,
        sourceMeta: {
          pages: typeof body.pages === 'number' ? body.pages : null,
          width: typeof body.width === 'number' ? body.width : null,
          height: typeof body.height === 'number' ? body.height : null,
        },
      },
      source: 'screenshot',
      expires_at: expiresAt,
    }

    const { data: insertData, error: insertError } = await adminClient
      .from('prefill_sessions')
      .insert(sessionPayload)
      .select('id')
      .single()

    if (insertError || !insertData) {
      console.error('[extract-screenshot] insert prefill_sessions:', insertError)
      // Si le INSERT échoue (table pas migrée par ex.), on retourne quand même
      // les données pour que l'extension ait une voie de fallback (pas de prefill,
      // mais pas d'erreur fatale non plus).
      return jsonCORS({
        session_id: null,
        data: sessionPayload.data,
        warning: 'session non persistée (DB indisponible)',
      })
    }

    return jsonCORS({
      session_id: insertData.id,
      data: sessionPayload.data,
      tokensUsed:
        (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (error: any) {
    console.error('Erreur extract-screenshot:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })
    if (error?.name === 'AbortError') {
      return jsonCORS(
        { error: "L'analyse Vision a dépassé 60 secondes. Réessayez avec moins de pages." },
        { status: 504 },
      )
    }
    if (isAnthropicCreditError(error)) {
      return jsonCORS(
        {
          error:
            "Service IA temporairement indisponible (solde de crédits Anthropic à recharger). " +
            "Contactez l'administrateur ou réessayez plus tard.",
        },
        { status: 503 },
      )
    }
    if (error?.status === 429) {
      return jsonCORS({ error: 'Trop de demandes. Attendez une minute.' }, { status: 429 })
    }
    return jsonCORS(
      { error: error?.message || 'Erreur interne durant l\'extraction.' },
      { status: 500 },
    )
  }
}
