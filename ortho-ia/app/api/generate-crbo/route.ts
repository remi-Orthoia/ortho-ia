import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildSystemPrompt,
  buildCRBOPrompt,
  CRBO_TOOL,
  type CRBOStructure,
} from '@/lib/prompts'
import { anonymize, rehydrate } from '@/lib/anonymizer'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/** Calcule l'âge "X ans Y mois" à partir de DDN et date du bilan (ou date du jour). */
function computePatientAge(ddnISO: string, bilanISO?: string): string {
  if (!ddnISO) return ''
  const ddn = new Date(ddnISO)
  if (isNaN(ddn.getTime())) return ''
  const ref = bilanISO ? new Date(bilanISO) : new Date()
  if (isNaN(ref.getTime())) return ''
  let years = ref.getFullYear() - ddn.getFullYear()
  let months = ref.getMonth() - ddn.getMonth()
  if (ref.getDate() < ddn.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years <= 0) return `${Math.max(0, months)} mois`
  return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
}

/** Formate une date ISO en DD/MM/YYYY, ou chaîne vide si invalide. */
function formatDateFR(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR')
}

function structureToText(structure: CRBOStructure): string {
  const lines: string[] = []
  lines.push('ANAMNÈSE')
  lines.push(structure.anamnese_redigee.trim())
  lines.push('')

  for (const domain of structure.domains) {
    lines.push(`## ${domain.nom.toUpperCase()}`)
    lines.push('')
    lines.push('| Épreuve | Score | É-T | Centile | Interprétation |')
    lines.push('|---------|-------|-----|---------|----------------|')
    for (const e of domain.epreuves) {
      lines.push(
        `| ${e.nom} | ${e.score} | ${e.et ?? '—'} | ${e.percentile} | ${e.interpretation} |`,
      )
    }
    lines.push('')
    if (domain.commentaire) {
      lines.push(domain.commentaire.trim())
      lines.push('')
    }
  }

  lines.push('DIAGNOSTIC ORTHOPHONIQUE')
  lines.push(structure.diagnostic.trim())
  lines.push('')
  lines.push('RECOMMANDATIONS')
  lines.push(structure.recommandations.trim())
  lines.push('')
  lines.push('CONCLUSION')
  lines.push(structure.conclusion.trim())

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    // ============ AUTH + QUOTA server-side (protection contre abus) ============
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 },
      )
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('crbo_count, crbo_limit, plan, status')
      .eq('user_id', user.id)
      .single()

    if (sub && sub.status === 'active' && sub.crbo_count >= sub.crbo_limit) {
      return NextResponse.json(
        {
          error:
            sub.plan === 'free'
              ? `Quota de ${sub.crbo_limit} CRBO gratuits atteint. Passez à l'offre Pro pour continuer.`
              : `Quota mensuel de ${sub.crbo_limit} CRBO atteint.`,
        },
        { status: 429 },
      )
    }

    const { formData } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json(
        { error: 'Clé API Claude non configurée. Veuillez ajouter votre clé ANTHROPIC_API_KEY dans le fichier .env.local' },
        { status: 500 },
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const tests: string[] = Array.isArray(formData.test_utilise)
      ? formData.test_utilise
      : [formData.test_utilise]

    // ============ Anonymisation RGPD avant envoi API ============
    const { anonymized, reverseMap } = anonymize(formData)
    const s = (v: string | undefined) => v ?? ''

    // DDN jamais transmise à Claude : on ne passe que l'âge calendaire calculé
    const patientAge = computePatientAge(formData.patient_ddn, formData.bilan_date)

    const userPrompt = buildCRBOPrompt({
      ortho_nom: s(anonymized.ortho_nom),
      ortho_adresse: s(anonymized.ortho_adresse),
      ortho_cp: s(anonymized.ortho_cp),
      ortho_ville: s(anonymized.ortho_ville),
      ortho_tel: s(anonymized.ortho_tel),
      ortho_email: s(anonymized.ortho_email),
      patient_prenom: anonymized.patient_prenom,
      patient_nom: anonymized.patient_nom,
      patient_age: patientAge,
      patient_classe: s(anonymized.patient_classe),
      bilan_date_display: formatDateFR(formData.bilan_date),
      bilan_type: s(anonymized.bilan_type),
      medecin_nom: s(anonymized.medecin_nom),
      medecin_tel: s(anonymized.medecin_tel),
      motif: s(anonymized.motif),
      anamnese: s(anonymized.anamnese),
      test_utilise: tests.join(', '),
      resultats: s(anonymized.resultats_manuels),
      notes_passation: s(anonymized.notes_passation),
    })

    // Timeout explicite — 45s max (Claude API met parfois 20-30s sur gros prompts)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 45_000)

    let message
    try {
      message = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: buildSystemPrompt(tests),
          tools: [CRBO_TOOL],
          tool_choice: { type: 'tool', name: 'generate_crbo' },
          messages: [{ role: 'user', content: userPrompt }],
        },
        { signal: abortController.signal },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUseBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (!toolUseBlock || toolUseBlock.name !== 'generate_crbo') {
      return NextResponse.json(
        { error: "Claude n'a pas renvoyé de structure CRBO exploitable." },
        { status: 502 },
      )
    }

    // ============ Réhydratation après réponse API ============
    const rawStructure = toolUseBlock.input as CRBOStructure
    const structure = rehydrate(rawStructure, reverseMap)
    const crbo = structureToText(structure)

    return NextResponse.json({ success: true, crbo, structure })
  } catch (error: any) {
    // Logging SANS payload — évite fuite DDN / anamnèse / résultats dans les logs
    console.error('Erreur génération CRBO:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'La génération a dépassé le délai de 45 secondes. Veuillez réessayer.' },
        { status: 504 },
      )
    }
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible.' },
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
      { error: 'Erreur lors de la génération du CRBO. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
