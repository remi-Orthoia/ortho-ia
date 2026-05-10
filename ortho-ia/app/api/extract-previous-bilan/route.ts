import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import {
  EXTRACT_PREVIOUS_TOOL,
  EXTRACT_PROMPT_PDF,
  EXTRACT_PROMPT_DOCX,
} from '@/lib/prompts/previous-bilan'

/**
 * Extraction d'un compte-rendu de bilan orthophonique EXTERNE (rédigé en
 * dehors d'ortho-ia) au moment d'un renouvellement.
 *
 * Flow :
 *  1. L'ortho uploade un PDF ou DOCX du bilan initial.
 *  2. Côté serveur :
 *      - PDF → Claude Vision (block document, base64).
 *      - DOCX → mammoth extrait le texte brut, Claude le structure.
 *  3. Claude renvoie une structure compatible CRBOStructure (épreuves,
 *     percentiles, diagnostic, aménagements).
 *  4. On persiste dans `previous_bilans` (RLS user-scoped) et on renvoie
 *     l'extraction au client, qui la pose dans `formData.bilan_precedent_structure`.
 *  5. À la génération CRBO, le pipeline existant injecte cette structure
 *     dans le prompt + le rendu Word comparatif (déjà supporté).
 *
 * Sécurité : pas de PII nominatives extraites ni envoyées à Claude
 * autrement qu'à travers le document lui-même — l'orthophoniste reste
 * responsable de ce qu'elle uploade. Pas de logs avec payload.
 */

export const maxDuration = 90

const SUPPORTED_PDF = ['application/pdf']
const SUPPORTED_DOCX = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', // .doc legacy — on tente quand même mammoth, sinon error
]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// Tool + prompts vivent dans lib/prompts/previous-bilan.ts pour pouvoir être
// importés tels quels par le script de test scripts/test-extract-previous.ts
// (test de complétude de l'extraction sur un fichier réel).

function isSupabaseUnavailable(err: any): boolean {
  if (!err) return false
  const code = err?.code ?? err?.cause?.code
  if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true
  const msg = String(err?.message ?? '').toLowerCase()
  if (msg.includes('fetch failed') || msg.includes('network')) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    // ========== AUTH ==========
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

    // ========== FILE ==========
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const patientIdRaw = formData.get('patient_id')
    const patientId =
      typeof patientIdRaw === 'string' && /^[0-9a-f-]{36}$/i.test(patientIdRaw)
        ? patientIdRaw
        : null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const isPdf = SUPPORTED_PDF.includes(file.type) || /\.pdf$/i.test(file.name)
    const isDocx =
      SUPPORTED_DOCX.includes(file.type) ||
      /\.docx?$/i.test(file.name)

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: 'Format non supporté. Importez un PDF ou un document Word (.docx).' },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo).' },
        { status: 413 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service de génération non configuré.' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // ========== CONTENU PASSÉ À CLAUDE ==========
    let content: Anthropic.MessageParam['content']
    let promptText: string

    if (isPdf) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        {
          type: 'text',
          text: EXTRACT_PROMPT_PDF,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
      promptText = EXTRACT_PROMPT_PDF
    } else {
      // DOCX → mammoth → texte brut.
      const buffer = Buffer.from(await file.arrayBuffer())
      let text = ''
      try {
        const result = await mammoth.extractRawText({ buffer })
        text = (result?.value || '').trim()
      } catch (e: any) {
        console.error('[extract-previous-bilan] mammoth error:', e?.message?.slice(0, 200))
        return NextResponse.json(
          { error: "Le document Word n'a pas pu être lu. Réessayez avec un PDF." },
          { status: 422 },
        )
      }
      if (!text || text.length < 30) {
        return NextResponse.json(
          { error: 'Le document Word est vide ou illisible.' },
          { status: 422 },
        )
      }
      // Tronque à ~80k caractères (large marge sur la limite de tokens) pour
      // éviter qu'un document anormalement long ne fasse exploser le coût.
      const TRUNCATE = 80_000
      const truncated = text.length > TRUNCATE ? text.slice(0, TRUNCATE) + '\n\n[... document tronqué ...]' : text
      promptText = `${EXTRACT_PROMPT_DOCX}\n\n## DOCUMENT À ANALYSER\n\n${truncated}`
      content = [
        {
          type: 'text',
          text: promptText,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    }

    // ========== APPEL CLAUDE ==========
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 75_000)

    // Streaming OBLIGATOIRE : avec max_tokens > ~21k le SDK refuse l'appel
    // non-streamé ("Streaming is strongly recommended for operations that
    // may take longer than 10 minutes"). On utilise messages.stream().finalMessage()
    // qui rend la même structure qu'un create() classique mais consomme le
    // flux SSE en arrière-plan.
    let message
    try {
      message = await withRetry(
        () => anthropic.messages.stream(
          {
            model: 'claude-sonnet-4-6',
            // 32k pour absorber un Exalang 8-11 / 11-15 complet (30-40 épreuves
            // avec sous-modalités — ~15k tokens de JSON minimum). 8k tronquait
            // systématiquement les batteries longues, qui ressortaient ensuite
            // marquées "✦ Nouvelle" dans la synthèse comparative.
            max_tokens: 32_768,
            tools: [EXTRACT_PREVIOUS_TOOL],
            tool_choice: { type: 'tool', name: 'extract_previous_bilan' },
            messages: [{ role: 'user', content }],
          },
          { signal: abortController.signal },
        ).finalMessage(),
        {
          maxAttempts: 2,
          initialDelayMs: 1500,
          signal: abortController.signal,
          onRetry: (attempt, error: any) => {
            console.log(`[retry ${attempt}/2] extract-previous-bilan — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
          },
        },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    // Détection précoce d'une troncature de sortie : si Claude a atteint
    // max_tokens, le JSON est probablement coupé et le tool_use échouera ou
    // sera incomplet. On le logue explicitement pour debug.
    if (message.stop_reason === 'max_tokens') {
      console.warn('[extract-previous-bilan] ⚠ stop_reason=max_tokens — extraction probablement incomplète')
    }

    const toolUseBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    if (!toolUseBlock || toolUseBlock.name !== 'extract_previous_bilan') {
      return NextResponse.json(
        { error: "Le bilan précédent n'a pas pu être structuré automatiquement." },
        { status: 502 },
      )
    }

    type ExtractedPreviousBilan = {
      bilan_date: string
      tests_utilises: string[]
      anamnese_redigee?: string
      domains: Array<{
        nom: string
        epreuves: Array<{
          nom: string
          score: string
          et: string | null
          percentile: string
          percentile_value: number
          interpretation: string
        }>
        commentaire?: string
      }>
      diagnostic: string
      amenagements?: string[]
    }
    const extracted = toolUseBlock.input as ExtractedPreviousBilan

    const totalEpreuves = (extracted.domains ?? []).reduce(
      (sum, d) => sum + (d.epreuves?.length ?? 0),
      0,
    )
    console.log(
      `[extract-previous-bilan] ${file.name?.slice(0, 80)} → ${extracted.domains?.length ?? 0} domaines, ` +
      `${totalEpreuves} épreuves (test=${extracted.tests_utilises?.[0] ?? 'inconnu'}, ` +
      `bilan_date=${extracted.bilan_date || 'inconnue'}, ` +
      `${(message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)} tokens, ` +
      `stop=${message.stop_reason})`,
    )

    // ========== FILET DE SÉCURITÉ — SOUS-EXTRACTION ==========
    // Si l'extraction renvoie un nombre d'épreuves suspicieusement faible
    // pour le test détecté, on prévient l'orthophoniste plutôt que de la
    // laisser découvrir le problème dans la table comparative du Word
    // (où 19 épreuves manquantes apparaîtront à tort en "✦ Nouvelle").
    //
    // Seuils calibrés sur les batteries complètes — un Exalang 8-11 typique
    // contient ≈30 épreuves (sous-modalités score/temps/ratio incluses).
    // Conservateur : on n'alerte que si on est largement sous le minimum
    // attendu, jamais sur les batteries courtes ou les tests partiels.
    const MIN_EPREUVES_PAR_TEST: Record<string, number> = {
      'Exalang 8-11': 18,
      'Exalang 11-15': 18,
      'Exalang 5-8': 12,
      'Exalang 3-6': 8,
      'Examath': 15,
      'Examath 8-15': 15,
      'BALE': 12,
      'BELEC': 10,
      'EVALEO 6-15': 15,
      'EVALO 2-6': 10,
      'BILO': 10,
      'ELO': 8,
      'N-EEL': 10,
      'BETL': 10,
      'MoCA': 5,
    }
    const detectedTest = extracted.tests_utilises?.[0] ?? null
    const minExpected = detectedTest ? MIN_EPREUVES_PAR_TEST[detectedTest] : null
    const extraction_warning =
      minExpected != null && totalEpreuves < minExpected
        ? `Seulement ${totalEpreuves} épreuves extraites du bilan précédent (${detectedTest}, minimum attendu : ~${minExpected}). ` +
          `Certaines épreuves risquent d'apparaître à tort comme "nouvelles" dans la table comparative. ` +
          `Vérifiez que toutes les pages du document ont bien été incluses, ou réessayez l'import.`
        : null
    if (extraction_warning) {
      console.warn(`[extract-previous-bilan] ⚠ ${extraction_warning}`)
    }

    // ========== PERSISTANCE ==========
    const bilanDateForRow =
      extracted.bilan_date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.bilan_date)
        ? extracted.bilan_date
        : null

    const { data: insertRows, error: insertErr } = await supabase
      .from('previous_bilans')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        extracted_data: extracted,
        original_filename: file.name?.slice(0, 200) ?? null,
        source_format: isPdf ? 'pdf' : 'docx',
        bilan_date: bilanDateForRow,
      })
      .select('id, created_at')
      .single()

    if (insertErr) {
      console.error('[extract-previous-bilan] insert error:', insertErr.message?.slice(0, 200))
      // Best-effort : on renvoie quand même l'extraction si l'insert échoue —
      // l'ortho peut quand même générer son CRBO sans persistance.
    }

    return NextResponse.json({
      success: true,
      previousBilanId: insertRows?.id ?? null,
      extracted,
      tokensUsed:
        (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
      // Compteurs pour permettre au front d'afficher "X domaines / Y épreuves
      // extraites" sans recompter, et de surfacer un avertissement si la
      // sous-extraction est suspectée.
      stats: {
        domains: extracted.domains?.length ?? 0,
        epreuves: totalEpreuves,
        detected_test: detectedTest,
        min_expected: minExpected,
      },
      warning: extraction_warning,
    })
  } catch (error: any) {
    console.error('Erreur extract-previous-bilan:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: "L'extraction a dépassé 75 secondes. Réessayez avec un document plus court." },
        { status: 504 },
      )
    }
    if (isSupabaseUnavailable(error)) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
        { status: 503 },
      )
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Trop de demandes. Attendez une minute et réessayez.' },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de l'extraction du bilan précédent." },
      { status: 500 },
    )
  }
}
