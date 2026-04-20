import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildSystemPrompt,
  buildCRBOPrompt,
  CRBO_TOOL,
  type CRBOStructure,
} from '@/lib/prompts'
import { anonymize, rehydrate } from '@/lib/anonymizer'

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

    const userPrompt = buildCRBOPrompt({
      ortho_nom: s(anonymized.ortho_nom),
      ortho_adresse: s(anonymized.ortho_adresse),
      ortho_cp: s(anonymized.ortho_cp),
      ortho_ville: s(anonymized.ortho_ville),
      ortho_tel: s(anonymized.ortho_tel),
      ortho_email: s(anonymized.ortho_email),
      patient_prenom: anonymized.patient_prenom,
      patient_nom: anonymized.patient_nom,
      patient_ddn: s(formData.patient_ddn), // DDN en clair pour calcul âge côté prompt
      patient_classe: s(anonymized.patient_classe),
      bilan_date: s(anonymized.bilan_date),
      bilan_type: s(anonymized.bilan_type),
      medecin_nom: s(anonymized.medecin_nom),
      medecin_tel: s(anonymized.medecin_tel),
      motif: s(anonymized.motif),
      anamnese: s(anonymized.anamnese),
      test_utilise: tests.join(', '),
      resultats: s(anonymized.resultats_manuels),
      notes_passation: s(anonymized.notes_passation),
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: buildSystemPrompt(tests),
      tools: [CRBO_TOOL],
      tool_choice: { type: 'tool', name: 'generate_crbo' },
      messages: [{ role: 'user', content: userPrompt }],
    })

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
    console.error('Erreur génération CRBO:', error)

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API Claude invalide' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du CRBO' },
      { status: 500 },
    )
  }
}
