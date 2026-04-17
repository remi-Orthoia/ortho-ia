import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT_CRBO, buildCRBOPrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { formData } = await request.json()

    // Vérifier que la clé API est configurée
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json(
        { error: 'Clé API Claude non configurée. Veuillez ajouter votre clé ANTHROPIC_API_KEY dans le fichier .env.local' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Construire le prompt utilisateur
    const userPrompt = buildCRBOPrompt({
      ortho_nom: formData.ortho_nom,
      ortho_adresse: formData.ortho_adresse,
      ortho_cp: formData.ortho_cp,
      ortho_ville: formData.ortho_ville,
      ortho_tel: formData.ortho_tel,
      ortho_email: formData.ortho_email,
      patient_prenom: formData.patient_prenom,
      patient_nom: formData.patient_nom,
      patient_ddn: formData.patient_ddn,
      patient_classe: formData.patient_classe,
      bilan_date: formData.bilan_date,
      bilan_type: formData.bilan_type,
      medecin_nom: formData.medecin_nom,
      medecin_tel: formData.medecin_tel,
      motif: formData.motif,
      anamnese: formData.anamnese,
      test_utilise: formData.test_utilise.join(', '),
      resultats: formData.resultats_manuels,
      notes_passation: formData.notes_passation,
    })

    // Appeler Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT_CRBO,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extraire le texte de la réponse
    const crbo = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    return NextResponse.json({ success: true, crbo })
  } catch (error: any) {
    console.error('Erreur génération CRBO:', error)
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API Claude invalide' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du CRBO' },
      { status: 500 }
    )
  }
}
