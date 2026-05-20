import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildScrubList, scrubText, rehydrate } from '@/lib/anonymizer'
import { handleAnthropicError } from '@/lib/anthropic-error'
import { withRetry } from '@/lib/retry'
import {
  SYSTEM_PROMPT_BILAN_MATH_EPREUVE,
  buildEpreuveUserPrompt,
  type EpreuveContext,
} from '@/lib/prompts/bilan-math-epreuve'
import type { PastilleEtat } from '@/lib/bilans/math/types'

/**
 * POST /api/generate-bilan-math-epreuve
 *
 * Génère un paragraphe clinique pour UNE épreuve d'un bilan B-CM / B-CMado.
 * Pas de sauvegarde côté serveur — le client récupère le texte et l'affiche
 * dans un textarea éditable. L'ortho a le dernier mot avant d'intégrer au CRBO.
 *
 * Anonymisation : prénom/nom patient + nom ortho remplacés par tokens avant
 * envoi à Claude (RGPD — Anthropic héberge hors UE), puis rehydratés au retour.
 *
 * Body attendu :
 *   {
 *     bilanType: 'b-cm' | 'b-cmado',
 *     mode: 'initial' | 'renouvellement',
 *     patient: { prenom, nom, date_naissance: 'yyyy-mm-dd', classe },
 *     epreuve: {
 *       domaineLabel, epreuveLabel,
 *       parentColor: PastilleEtat,
 *       sousEpreuves: Array<{label, color}>,
 *       direct?: PastilleEtat,
 *       notes: string
 *     },
 *     contexteBilan: Array<{ domaineLabel, epreuveLabel, color }>
 *   }
 *
 * Réponse : { text: string }
 */

export const maxDuration = 60

/** Calcule l'âge "X ans Y mois" depuis une DDN ISO. Vide si invalide. */
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

const ALLOWED_COLORS: readonly PastilleEtat[] = ['gris', 'vert', 'orange', 'rouge']
const ALLOWED_BILAN_TYPES = new Set(['b-cm', 'b-cmado'])
const ALLOWED_MODES = new Set(['initial', 'renouvellement'])

function isPastilleEtat(v: unknown): v is PastilleEtat {
  return typeof v === 'string' && (ALLOWED_COLORS as readonly string[]).includes(v)
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  // ---- Validation stricte (le client est source non sûre, on ne fait pas confiance) ----
  const bilanType = body?.bilanType
  if (!ALLOWED_BILAN_TYPES.has(bilanType)) {
    return NextResponse.json({ error: 'bilanType invalide' }, { status: 400 })
  }
  const mode = body?.mode
  if (!ALLOWED_MODES.has(mode)) {
    return NextResponse.json({ error: 'mode invalide' }, { status: 400 })
  }
  const patient = body?.patient ?? {}
  const ep = body?.epreuve ?? {}
  if (typeof ep?.epreuveLabel !== 'string' || !ep.epreuveLabel.trim()) {
    return NextResponse.json({ error: 'epreuve.epreuveLabel manquant' }, { status: 400 })
  }
  if (typeof ep?.domaineLabel !== 'string') {
    return NextResponse.json({ error: 'epreuve.domaineLabel manquant' }, { status: 400 })
  }
  if (!isPastilleEtat(ep.parentColor)) {
    return NextResponse.json({ error: 'epreuve.parentColor invalide' }, { status: 400 })
  }

  const sousEpreuves: Array<{ label: string; color: PastilleEtat }> = Array.isArray(ep.sousEpreuves)
    ? ep.sousEpreuves
        .filter((s: any) => typeof s?.label === 'string' && isPastilleEtat(s?.color))
        .map((s: any) => ({ label: s.label, color: s.color as PastilleEtat }))
    : []

  const direct: PastilleEtat | undefined = isPastilleEtat(ep.direct) ? ep.direct : undefined
  const notes: string = typeof ep.notes === 'string' ? ep.notes : ''

  const contexteBilan: EpreuveContext['contexteBilan'] = Array.isArray(body?.contexteBilan)
    ? body.contexteBilan
        .filter((c: any) =>
          typeof c?.domaineLabel === 'string' &&
          typeof c?.epreuveLabel === 'string' &&
          isPastilleEtat(c?.color) &&
          c.color !== 'gris',
        )
        .map((c: any) => ({
          domaineLabel: c.domaineLabel,
          epreuveLabel: c.epreuveLabel,
          color: c.color as PastilleEtat,
        }))
    : []

  // ---- Charge le profil ortho pour l'anonymisation ----
  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, nom')
    .eq('id', user.id)
    .single()
  const orthoNom = profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : ''

  // ---- Anonymisation ----
  const scrubList = buildScrubList({
    patient_prenom: typeof patient.prenom === 'string' ? patient.prenom : '',
    patient_nom: typeof patient.nom === 'string' ? patient.nom : '',
    ortho_nom: orthoNom,
  })
  const safeNotes = scrubText(notes, scrubList) ?? ''

  // ---- Court-circuit cas "rien à dire" (économise un appel Claude) ----
  // Si aucune sous-épreuve cotée, aucune pastille directe non-grise, et notes
  // vides : on retourne directement le squelette "Épreuve non passée".
  const aucuneCotation = sousEpreuves.every(s => s.color === 'gris') && (!direct || direct === 'gris')
  if (aucuneCotation && !safeNotes.trim()) {
    return NextResponse.json({ text: 'Épreuve non passée.' })
  }

  // ---- Anthropic ----
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
    return NextResponse.json(
      { error: 'Service de génération non configuré côté serveur.' },
      { status: 500 },
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const ctx: EpreuveContext = {
    bilanType,
    mode,
    patientAge: computeAge(typeof patient.date_naissance === 'string' ? patient.date_naissance : ''),
    patientClasse: typeof patient.classe === 'string' ? patient.classe : '',
    domaineLabel: ep.domaineLabel,
    epreuveLabel: ep.epreuveLabel,
    parentColor: ep.parentColor,
    sousEpreuves,
    direct,
    notesBrutes: safeNotes,
    contexteBilan,
  }
  const userPrompt = buildEpreuveUserPrompt(ctx)

  let safeText: string
  try {
    const message = await withRetry(
      () => anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        temperature: 0.4,
        system: SYSTEM_PROMPT_BILAN_MATH_EPREUVE,
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
    const handled = handleAnthropicError(error, "la génération de l'épreuve")
    if (handled) return handled
    console.error('generate-bilan-math-epreuve unexpected error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération.' }, { status: 500 })
  }

  // ---- Rehydratation ----
  const reverseMap = {
    tokens: {
      '__P_PRENOM__': typeof patient.prenom === 'string' ? patient.prenom : '',
      '__P_NOM__': typeof patient.nom === 'string' ? patient.nom : '',
      '__O_NOM__': orthoNom,
    },
  }
  const text = rehydrate(safeText, reverseMap)

  return NextResponse.json({ text })
}
