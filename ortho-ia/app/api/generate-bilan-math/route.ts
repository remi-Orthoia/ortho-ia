import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildScrubList, scrubText, rehydrate } from '@/lib/anonymizer'
import { handleAnthropicError } from '@/lib/anthropic-error'
import { withRetry } from '@/lib/retry'
import {
  SYSTEM_PROMPT_BILAN_MATH_CRBO,
  buildBilanMathCRBOUserPrompt,
  type BilanMathCRBOContext,
  type DomaineInput,
  type EpreuveInput,
} from '@/lib/prompts/bilan-math-crbo'
import type { PastilleEtat } from '@/lib/bilans/math/types'

/**
 * POST /api/generate-bilan-math
 *
 * Génère le CRBO complet d'un bilan B-CM / B-CMado.
 * Ne sauvegarde PAS en base — le client appelle ensuite supabase.from('crbos').insert()
 * pour garder le contrôle UI (afficher le texte, le laisser éditer, save sur demande).
 *
 * Anonymisation RGPD (prénom/nom patient + nom ortho → tokens) avant Claude,
 * rehydratation au retour. Pas de DDN brute transmise — uniquement l'âge calculé.
 *
 * Quota mensuel vérifié côté serveur AVANT l'appel Claude (fail-fast).
 */

export const maxDuration = 300

const ALLOWED_COLORS: readonly PastilleEtat[] = ['gris', 'vert', 'orange', 'rouge']

function isPastilleEtat(v: unknown): v is PastilleEtat {
  return typeof v === 'string' && (ALLOWED_COLORS as readonly string[]).includes(v)
}

function computeAge(ddnISO: string): string {
  if (!ddnISO) return ''
  const ddn = new Date(ddnISO)
  if (isNaN(ddn.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - ddn.getFullYear()
  let months = now.getMonth() - ddn.getMonth()
  if (now.getDate() < ddn.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years <= 0) return `${Math.max(0, months)} mois`
  return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
}

interface PayloadBody {
  bilanType: 'b-cm' | 'b-cmado'
  mode: 'initial' | 'renouvellement'
  patient: {
    prenom: string
    nom: string
    date_naissance: string
    classe: string
  }
  motif?: string
  anamnese?: string
  domaines: Array<{
    domaineLabel: string
    epreuves: Array<{
      epreuveLabel: string
      parentColor: PastilleEtat
      sousEpreuves: Array<{ label: string; color: PastilleEtat }>
      direct?: PastilleEtat
      notes: string
      iaText: string
    }>
  }>
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  // ---- Quota mensuel (free plan uniquement) ----
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('crbo_limit, plan, status')
    .eq('user_id', user.id)
    .single()

  const isFreePlan = !sub || sub.plan === 'free'
  const effectiveLimit = sub?.crbo_limit === -1 ? Infinity : (sub?.crbo_limit ?? 10)

  if (isFreePlan && sub?.status !== 'canceled') {
    const { data: monthlyCount } = await supabase.rpc(
      'get_monthly_crbo_count',
      { p_user_id: user.id },
    )
    if ((monthlyCount ?? 0) >= effectiveLimit) {
      return NextResponse.json(
        {
          error: `Vous avez atteint votre limite de ${effectiveLimit} CRBOs gratuits ce mois. Passez en Pro pour continuer.`,
        },
        { status: 429 },
      )
    }
  }

  // ---- Validation payload ----
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  if (body?.bilanType !== 'b-cm' && body?.bilanType !== 'b-cmado') {
    return NextResponse.json({ error: 'bilanType invalide' }, { status: 400 })
  }
  if (body?.mode !== 'initial' && body?.mode !== 'renouvellement') {
    return NextResponse.json({ error: 'mode invalide' }, { status: 400 })
  }
  if (!Array.isArray(body?.domaines) || body.domaines.length === 0) {
    return NextResponse.json({ error: 'domaines manquants' }, { status: 400 })
  }

  // Nettoyage / validation des domaines + épreuves (refuse les pastilles invalides).
  const cleanDomaines: DomaineInput[] = []
  for (const dom of body.domaines as any[]) {
    if (typeof dom?.domaineLabel !== 'string') continue
    const epreuves: EpreuveInput[] = []
    if (Array.isArray(dom.epreuves)) {
      for (const ep of dom.epreuves) {
        if (typeof ep?.epreuveLabel !== 'string') continue
        if (!isPastilleEtat(ep.parentColor)) continue
        // Nouveau format : cellules détaillées par niveau × test × critère.
        const cellules = Array.isArray(ep.cellules)
          ? ep.cellules
              .filter((c: any) =>
                typeof c?.niveau === 'string' &&
                typeof c?.test === 'string' &&
                typeof c?.critere === 'string' &&
                isPastilleEtat(c?.color),
              )
              .map((c: any) => ({
                niveau: c.niveau,
                test: c.test,
                critere: c.critere,
                color: c.color as PastilleEtat,
              }))
          : []
        // Compat legacy : sous-épreuves avec couleur agrégée.
        const sousEpreuves = Array.isArray(ep.sousEpreuves)
          ? ep.sousEpreuves
              .filter((s: any) => typeof s?.label === 'string' && isPastilleEtat(s?.color))
              .map((s: any) => ({ label: s.label, color: s.color as PastilleEtat }))
          : []
        epreuves.push({
          epreuveLabel: ep.epreuveLabel,
          parentColor: ep.parentColor as PastilleEtat,
          cellules,
          sousEpreuves,
          notes: typeof ep.notes === 'string' ? ep.notes : '',
          iaText: typeof ep.iaText === 'string' ? ep.iaText : '',
        })
      }
    }
    cleanDomaines.push({ domaineLabel: dom.domaineLabel, epreuves })
  }

  // ---- Anonymisation ----
  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, nom')
    .eq('id', user.id)
    .single()
  const orthoNom = profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : ''

  const patient = body.patient ?? {}
  const scrubList = buildScrubList({
    patient_prenom: typeof patient.prenom === 'string' ? patient.prenom : '',
    patient_nom: typeof patient.nom === 'string' ? patient.nom : '',
    ortho_nom: orthoNom,
  })

  const safeDomaines: DomaineInput[] = cleanDomaines.map((dom) => ({
    domaineLabel: dom.domaineLabel,
    epreuves: dom.epreuves.map((ep) => ({
      ...ep,
      notes: scrubText(ep.notes, scrubList) ?? '',
      iaText: scrubText(ep.iaText, scrubList) ?? '',
      // Anonymise aussi les critères et niveaux libellés (au cas où un prénom
      // ait été utilisé comme critère, peu probable mais robuste).
      cellules: ep.cellules.map((c) => ({
        ...c,
        critere: scrubText(c.critere, scrubList) ?? '',
      })),
    })),
  }))

  // ---- Anthropic ----
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
    return NextResponse.json(
      { error: 'Service de génération non configuré côté serveur.' },
      { status: 500 },
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Prénom anonymisé pour le prompt — sert d'ancrage textuel dans le CRBO
  // ("[Prénom] maîtrise la numération…"). Sera rehydraté au retour.
  const safePrenom = scrubText(
    typeof patient.prenom === 'string' ? patient.prenom : '',
    scrubList,
  ) ?? ''

  // Anonymise aussi motif + anamnèse avant envoi à Claude (peuvent contenir
  // des prénoms/noms d'autres patients ou du personnel scolaire). Si vides
  // après nettoyage on omet de la sortie.
  const rawMotif = typeof body.motif === 'string' ? body.motif : ''
  const rawAnamnese = typeof body.anamnese === 'string' ? body.anamnese : ''
  const safeMotif = scrubText(rawMotif, scrubList) ?? ''
  const safeAnamnese = scrubText(rawAnamnese, scrubList) ?? ''

  const ctx: BilanMathCRBOContext = {
    bilanType: body.bilanType,
    mode: body.mode,
    patientPrenom: safePrenom,
    patientAge: computeAge(typeof patient.date_naissance === 'string' ? patient.date_naissance : ''),
    patientClasse: typeof patient.classe === 'string' ? patient.classe : '',
    motif: safeMotif,
    anamnese: safeAnamnese,
    domaines: safeDomaines,
  }
  const userPrompt = buildBilanMathCRBOUserPrompt(ctx)

  const reverseMap = {
    tokens: {
      '__P_PRENOM__': typeof patient.prenom === 'string' ? patient.prenom : '',
      '__P_NOM__': typeof patient.nom === 'string' ? patient.nom : '',
      '__O_NOM__': orthoNom,
    },
  }

  // ============ Streaming SSE (opt-in via ?stream=1) ============
  // Output texte simple (markdown) — on stream les `text_delta` au fil de la
  // génération + rehydratation des tokens d'anonymisation à la volée. Le
  // client accumule, le rendu se fait en direct (sections markdown
  // remplies progressivement).
  //
  // Format SSE :
  //   { type: "start" }
  //   { type: "delta", text: "<partial>" }    (rehydraté)
  //   { type: "complete", text: "<full>" }    (texte final, sécurité)
  //   { type: "error", message: "..." }
  const isStream = request.nextUrl.searchParams.get('stream') === '1'

  if (isStream) {
    const encoder = new TextEncoder()
    const tokenPairs: Array<[string, string]> = Object.entries(reverseMap.tokens)
      .sort((a, b) => b[0].length - a[0].length)
    const rehydratePartial = (s: string): string => {
      let out = s
      for (const [token, value] of tokenPairs) {
        if (value && out.indexOf(token) >= 0) out = out.split(token).join(value)
      }
      return out
    }

    const sseStream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
          } catch {
            // Client déconnecté.
          }
        }

        try {
          send({ type: 'start' })

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 8000,
            temperature: 0.4,
            system: SYSTEM_PROMPT_BILAN_MATH_CRBO,
            messages: [{ role: 'user', content: userPrompt }],
          })

          let accumulated = ''
          for await (const event of stream as any) {
            if (
              event?.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta' &&
              typeof event.delta.text === 'string'
            ) {
              const piece = rehydratePartial(event.delta.text)
              accumulated += piece
              send({ type: 'delta', text: piece })
            }
          }

          const final = await stream.finalMessage()
          const block = final.content.find((b: any) => b.type === 'text')
          const fullText = block && block.type === 'text'
            ? rehydrate(block.text.trim(), reverseMap)
            : accumulated.trim()

          send({ type: 'complete', text: fullText })
        } catch (err: any) {
          console.error('generate-bilan-math (stream) error:', err)
          send({
            type: 'error',
            message: err?.message?.slice(0, 200) || 'Erreur de streaming',
          })
        } finally {
          try { controller.close() } catch {}
        }
      },
    })

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  // ============ Mode non-stream (fallback) ============
  let safeText: string
  try {
    const message = await withRetry(
      () => anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        temperature: 0.4,
        system: SYSTEM_PROMPT_BILAN_MATH_CRBO,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      { maxAttempts: 2 },
    )
    const block = message.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: 'Réponse Claude vide.' }, { status: 500 })
    }
    safeText = block.text.trim()
  } catch (error) {
    const handled = handleAnthropicError(error, 'la génération du CRBO')
    if (handled) return handled
    console.error('generate-bilan-math unexpected error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération.' }, { status: 500 })
  }

  const text = rehydrate(safeText, reverseMap)
  return NextResponse.json({ text })
}
