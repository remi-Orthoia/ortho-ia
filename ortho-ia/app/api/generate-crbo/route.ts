import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildSystemPrompt,
  buildCRBOPrompt,
  buildExtractPrompt,
  buildSynthesizePrompt,
  CRBO_TOOL,
  EXTRACT_CRBO_TOOL,
  SYNTHESIZE_TOOL,
  type CRBOPhase,
  type CRBOFormat,
  type CRBOStructure,
  type ExtractedCRBO,
  type SynthesizedCRBO,
} from '@/lib/prompts'
import { anonymize, rehydrate, buildScrubList, scrubText, scrubObjectStrings } from '@/lib/anonymizer'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'

// Vercel Pro / Enterprise : autorise jusqu'à 300s (vs 10s Hobby default).
// Bilans complexes (Exalang 8-11, Examath complet) peuvent prendre 90-150s.
export const maxDuration = 300

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

  if (structure.severite_globale) {
    lines.push(`Sévérité globale du profil : ${structure.severite_globale}`)
    lines.push('')
  }

  if (structure.comorbidites_detectees && structure.comorbidites_detectees.length > 0) {
    lines.push('COMORBIDITÉS / PROFILS ASSOCIÉS SUSPECTÉS')
    for (const c of structure.comorbidites_detectees) lines.push(`- ${c}`)
    lines.push('')
  }

  if (structure.synthese_evolution) {
    const ev = structure.synthese_evolution
    lines.push("SYNTHÈSE D'ÉVOLUTION DEPUIS LE DERNIER BILAN")
    lines.push(ev.resume.trim())
    if (ev.domaines_progres?.length > 0) {
      lines.push(`Progrès : ${ev.domaines_progres.join(', ')}`)
    }
    if (ev.domaines_stagnation?.length > 0) {
      lines.push(`Stagnation : ${ev.domaines_stagnation.join(', ')}`)
    }
    if (ev.domaines_regression?.length > 0) {
      lines.push(`Régression : ${ev.domaines_regression.join(', ')}`)
    }
    lines.push('')
  }

  lines.push('RECOMMANDATIONS')
  lines.push(structure.recommandations.trim())
  lines.push('')

  if (structure.pap_suggestions && structure.pap_suggestions.length > 0) {
    lines.push('AMÉNAGEMENTS SCOLAIRES PROPOSÉS (PAP)')
    for (const p of structure.pap_suggestions) lines.push(`- ${p}`)
    lines.push('')
  }

  lines.push('CONCLUSION')
  lines.push(structure.conclusion.trim())

  return lines.join('\n')
}

/** Détecte une erreur réseau/indisponibilité Supabase (ECONNREFUSED, fetch failed, DNS, etc.). */
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
    // ============ AUTH + QUOTA server-side (protection contre abus) ============
    const supabase = createServerSupabaseClient()
    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      if (isSupabaseUnavailable(err)) {
        console.error('Supabase indisponible (auth):', (err as any)?.message)
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
          { status: 503 },
        )
      }
      throw err
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 },
      )
    }

    let sub
    try {
      const res = await supabase
        .from('subscriptions')
        .select('crbo_limit, plan, status')
        .eq('user_id', user.id)
        .single()
      sub = res.data
    } catch (err) {
      if (isSupabaseUnavailable(err)) {
        console.error('Supabase indisponible (subscriptions):', (err as any)?.message)
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
          { status: 503 },
        )
      }
      // Autre erreur lecture sub : fail-open, on laisse passer comme plan free
      console.error('Erreur lecture subscription:', (err as any)?.message)
      sub = null
    }

    // Plan Pro / Team = illimité (crbo_limit = -1). Plan Free = quota mensuel
    // recalculé à chaque appel depuis `crbos.created_at >= date_trunc('month', NOW())` :
    // reset implicite au 1er du mois, pas de cron nécessaire.
    const isFreePlan = !sub || sub.plan === 'free'
    const effectiveLimit = sub?.crbo_limit === -1 ? Infinity : (sub?.crbo_limit ?? 10)

    if (isFreePlan && sub?.status !== 'canceled') {
      const { data: monthlyCount, error: countError } = await supabase.rpc(
        'get_monthly_crbo_count',
        { p_user_id: user.id },
      )
      if (countError) {
        console.error('Erreur lecture quota mensuel:', countError.message)
        // Fail-open : on ne bloque pas l'utilisatrice sur erreur Supabase
      } else if ((monthlyCount ?? 0) >= effectiveLimit) {
        return NextResponse.json(
          {
            error: `Vous avez atteint votre limite de ${effectiveLimit} CRBOs gratuits ce mois. Passez en Pro pour continuer.`,
          },
          { status: 429 },
        )
      }
    }

    const body = await request.json()
    const phase: CRBOPhase = (body.phase === 'extract' || body.phase === 'synthesize') ? body.phase : 'full'
    const format: CRBOFormat = body.format === 'synthetique' ? 'synthetique' : 'complet'
    const formData = body.formData as any
    const extracted = body.extracted as ExtractedCRBO | undefined
    const edits = body.edits as { anamnese: string; motif: string; ortho_comments?: Record<string, string> } | undefined

    // ============ Validation des champs requis ============
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'Données du formulaire manquantes' }, { status: 400 })
    }
    if (phase === 'synthesize' && !extracted) {
      return NextResponse.json(
        { error: 'Phase synthesize : payload "extracted" manquant.' },
        { status: 400 },
      )
    }
    const requiredFields: Array<[keyof typeof formData, string]> = [
      ['patient_prenom', 'Prénom du patient'],
      ['patient_nom', 'Nom du patient'],
      ['bilan_date', 'Date du bilan'],
    ]
    for (const [key, label] of requiredFields) {
      if (!formData[key] || typeof formData[key] !== 'string' || !String(formData[key]).trim()) {
        return NextResponse.json(
          { error: `Le champ "${label}" est requis.` },
          { status: 400 },
        )
      }
    }
    const tests = Array.isArray(formData.test_utilise)
      ? formData.test_utilise.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
      : (typeof formData.test_utilise === 'string' && formData.test_utilise.trim().length > 0)
        ? [formData.test_utilise]
        : []
    if (tests.length === 0) {
      return NextResponse.json(
        { error: 'Vous devez sélectionner au moins un test.' },
        { status: 400 },
      )
    }
    formData.test_utilise = tests

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json(
        { error: 'Service IA non configuré côté serveur. Veuillez contacter le support.' },
        { status: 500 },
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // ============ Anonymisation RGPD avant envoi API ============
    const { anonymized, reverseMap } = anonymize(formData)
    const s = (v: string | undefined) => v ?? ''

    // Phase synthesize : `extracted` (réhydraté en phase 1) et `edits` (saisi
    // par l'ortho sur la page résultats) peuvent contenir des noms réels —
    // notamment dans les commentaires qualitatifs ortho. On les anonymise
    // avec la même liste de tokens que pour formData → la rehydratation post-IA
    // les remettra en clair.
    const scrubList = buildScrubList(formData)
    const sanitizeFreeText = (t: string | undefined) => scrubText(t, scrubList) ?? ''
    const anonymizedExtracted: ExtractedCRBO | undefined = extracted
      ? {
          anamnese_redigee: sanitizeFreeText(extracted.anamnese_redigee),
          motif_reformule: sanitizeFreeText(extracted.motif_reformule),
          domains: (extracted.domains || []).map((d) => ({
            ...d,
            nom: d.nom, // codes A.1, B.2... pas de PII
            commentaire: sanitizeFreeText(d.commentaire),
            // épreuves : nom/score/percentile = données techniques, pas de PII
            epreuves: d.epreuves,
          })),
        }
      : undefined
    const anonymizedEdits = edits
      ? {
          anamnese: sanitizeFreeText(edits.anamnese),
          motif: sanitizeFreeText(edits.motif),
          ortho_comments: edits.ortho_comments
            ? Object.fromEntries(
                Object.entries(edits.ortho_comments).map(([k, v]) => [k, sanitizeFreeText(v)]),
              )
            : undefined,
        }
      : undefined
    // bilan_precedent_structure (renouvellement) : peut aussi contenir des
    // noms dans diagnostic / recommandations. On rehydrate récursivement
    // contre le même formData pour scrubber tous les strings.
    const anonymizedPrevStructure = formData.bilan_precedent_structure
      ? scrubObjectStrings(formData.bilan_precedent_structure, scrubList)
      : null

    // DDN jamais transmise à Claude : on ne passe que l'âge calendaire calculé
    const patientAge = computePatientAge(formData.patient_ddn, formData.bilan_date)

    // ============ Construction du user prompt selon la phase ============
    const baseInputs = {
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
      notes_analyse: s(anonymized.notes_analyse),
      comportement_seance: formData.comportement_seance,
      duree_seance_minutes: formData.duree_seance_minutes,
      evolution_notes: formData.evolution_notes,
      bilan_precedent_structure: formData.bilan_precedent_structure,
      bilan_precedent_date: formData.bilan_precedent_date ? formatDateFR(formData.bilan_precedent_date) : undefined,
      bilan_precedent_anamnese: formData.bilan_precedent_anamnese,
    }

    let userPrompt: string
    let toolToUse: Anthropic.Tool
    let toolNameExpected: string
    if (phase === 'extract') {
      userPrompt = buildExtractPrompt(baseInputs)
      toolToUse = EXTRACT_CRBO_TOOL
      toolNameExpected = 'extract_crbo_data'
    } else if (phase === 'synthesize') {
      // ⚠️ Tous les inputs free-text de phase 2 (extracted + edits + bilan
      // précédent) sont anonymisés avec la même scrubList que formData.
      // C'est le seul moyen d'éviter qu'un nom réel saisi par l'ortho dans
      // un commentaire qualitatif ne fuite vers Anthropic.
      const safeExtracted = anonymizedExtracted!
      const safeEdits = anonymizedEdits
      userPrompt = buildSynthesizePrompt({
        patient_prenom: baseInputs.patient_prenom,
        patient_nom: baseInputs.patient_nom,
        patient_age: baseInputs.patient_age,
        patient_classe: baseInputs.patient_classe,
        bilan_date_display: baseInputs.bilan_date_display,
        bilan_type: baseInputs.bilan_type,
        medecin_nom: baseInputs.medecin_nom,
        medecin_tel: baseInputs.medecin_tel,
        anamnese_validee: safeEdits?.anamnese?.trim() || safeExtracted.anamnese_redigee,
        motif_valide: safeEdits?.motif?.trim() || safeExtracted.motif_reformule || '',
        domains: safeExtracted.domains,
        ortho_comments: safeEdits?.ortho_comments,
        test_utilise: tests.join(', '),
        notes_analyse: baseInputs.notes_analyse,
        comportement_seance: baseInputs.comportement_seance,
        duree_seance_minutes: baseInputs.duree_seance_minutes,
        evolution_notes: baseInputs.evolution_notes,
        bilan_precedent_structure: anonymizedPrevStructure,
        bilan_precedent_date: baseInputs.bilan_precedent_date,
        bilan_precedent_anamnese: baseInputs.bilan_precedent_anamnese
          ? scrubText(baseInputs.bilan_precedent_anamnese, scrubList) ?? baseInputs.bilan_precedent_anamnese
          : undefined,
      })
      toolToUse = SYNTHESIZE_TOOL
      toolNameExpected = 'synthesize_crbo'
    } else {
      userPrompt = buildCRBOPrompt(baseInputs)
      toolToUse = CRBO_TOOL
      toolNameExpected = 'generate_crbo'
    }

    // Timeout : phase=extract est plus rapide (10-30s) ; synthesize/full peuvent
    // tourner 90-150s sur des bilans complexes.
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), phase === 'extract' ? 90_000 : 180_000)

    // Prompt caching sur system prompt : économise ~80% de coût en entrée sur
    // les requêtes successives (le prompt système pèse ~15k tokens avec les
    // référentiels tests). Cache TTL = 5 min par défaut.
    const systemBlocks = [
      {
        type: 'text' as const,
        text: buildSystemPrompt(tests, phase, format),
        cache_control: { type: 'ephemeral' as const },
      },
    ]

    let message
    try {
      // Retry auto (jusqu'à 3 tentatives) sur 429 / 5xx / erreurs réseau transitoires
      message = await withRetry(
        () => anthropic.messages.create(
          {
            model: 'claude-sonnet-4-6',
            max_tokens: phase === 'extract' ? 8192 : 16384,
            system: systemBlocks,
            tools: [toolToUse],
            tool_choice: { type: 'tool', name: toolNameExpected },
            messages: [{ role: 'user', content: userPrompt }],
          },
          { signal: abortController.signal },
        ),
        {
          maxAttempts: 3,
          initialDelayMs: 1500,
          signal: abortController.signal,
          onRetry: (attempt, error: any) => {
            console.log(`[retry ${attempt}/3] Claude ${phase} — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
          },
        },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUseBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (!toolUseBlock || toolUseBlock.name !== toolNameExpected) {
      return NextResponse.json(
        { error: "Notre IA n'a pas renvoyé de structure CRBO exploitable." },
        { status: 502 },
      )
    }

    // ============ Réponse selon la phase ============
    if (phase === 'extract') {
      const rawExtracted = toolUseBlock.input as ExtractedCRBO
      // rehydrate gère un sous-ensemble : on construit une CRBOStructure partielle
      const partialStructure: CRBOStructure = {
        anamnese_redigee: rawExtracted.anamnese_redigee || '',
        motif_reformule: rawExtracted.motif_reformule || '',
        domains: rawExtracted.domains || [],
        diagnostic: '',
        recommandations: '',
        conclusion: '',
      }
      const rehydrated = rehydrate(partialStructure, reverseMap)
      const result: ExtractedCRBO = {
        anamnese_redigee: rehydrated.anamnese_redigee,
        motif_reformule: rehydrated.motif_reformule || '',
        domains: rehydrated.domains,
      }
      return NextResponse.json({ success: true, phase: 'extract', extracted: result })
    }

    if (phase === 'synthesize') {
      const rawSynth = toolUseBlock.input as SynthesizedCRBO
      // Pour rehydrate, on injecte les champs synthèse dans une CRBOStructure
      // factice avec anamnese/motif/domains vides — la rehydratation ne touche
      // que les chaînes contenant les placeholders.
      const tempStruct: CRBOStructure = {
        anamnese_redigee: '',
        motif_reformule: '',
        domains: [],
        diagnostic: rawSynth.diagnostic || '',
        recommandations: rawSynth.recommandations || '',
        conclusion: rawSynth.conclusion || '',
        comorbidites_detectees: rawSynth.comorbidites_detectees,
        pap_suggestions: rawSynth.pap_suggestions,
        severite_globale: rawSynth.severite_globale ?? null,
        synthese_evolution: rawSynth.synthese_evolution ?? null,
      }
      const rehydrated = rehydrate(tempStruct, reverseMap)
      // domain_commentaires : array de {nom, commentaire}, rehydraté séparément
      // (chaque commentaire peut contenir des tokens patient anonymisés)
      const domain_commentaires = rehydrate(
        Array.isArray(rawSynth.domain_commentaires) ? rawSynth.domain_commentaires : [],
        reverseMap,
      )
      const result: SynthesizedCRBO = {
        diagnostic: rehydrated.diagnostic,
        recommandations: rehydrated.recommandations,
        conclusion: rehydrated.conclusion,
        comorbidites_detectees: rehydrated.comorbidites_detectees ?? [],
        pap_suggestions: rehydrated.pap_suggestions ?? [],
        domain_commentaires,
        severite_globale: rehydrated.severite_globale ?? null,
        synthese_evolution: rehydrated.synthese_evolution ?? null,
      }
      return NextResponse.json({ success: true, phase: 'synthesize', synthesized: result })
    }

    // phase = 'full' (legacy)
    const rawStructure = toolUseBlock.input as CRBOStructure
    const structure = rehydrate(rawStructure, reverseMap)
    const crbo = structureToText(structure)
    return NextResponse.json({ success: true, phase: 'full', crbo, structure })
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
        { error: 'La génération a dépassé 3 minutes. Réessayez ou réduisez la longueur de l\'anamnèse.' },
        { status: 504 },
      )
    }
    if (isSupabaseUnavailable(error)) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
        { status: 503 },
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
