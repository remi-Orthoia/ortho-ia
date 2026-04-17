import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de résultats de tests orthophoniques.

## TA MISSION
Extrais TOUS les résultats du document PDF fourni et retourne-les dans un format structuré.

## RÈGLES CRITIQUES

### RÈGLE 1 : Lis les percentiles EXACTEMENT comme ils sont écrits
- Si le PDF indique "Q1" → écris "Q1 (P25)"
- Si le PDF indique "Med" → écris "Med (P50)"
- Si le PDF indique "Q3" → écris "Q3 (P75)"
- Si le PDF indique "P5", "P10", "P90", "P95" → recopie tel quel

### RÈGLE 2 : Ne recalcule JAMAIS les percentiles
- NE JAMAIS convertir les É-T en percentiles
- Utilise UNIQUEMENT ce qui est écrit dans le document

### RÈGLE 3 : Extrait TOUTES les épreuves
- Chaque ligne du test doit être extraite
- Inclus les sous-épreuves (temps, ratio, score, etc.)

## FORMAT DE SORTIE

Pour chaque épreuve, retourne une ligne au format :
[Nom de l'épreuve] : [Score brut], É-T : [valeur], [Percentile tel qu'écrit]

Exemple de sortie correcte :
Empan auditif (endroit) : 6/7, É-T : 0.45, P90
Empan auditif (envers) : 4/6, É-T : -0.2, Q3 (P75)
Boucle phonologique : 16/25, É-T : -1.53, Q1 (P25)
Fluence phonétique : 4/16, É-T : -1.31, Q1 (P25)
Morphologie dérivationnelle : 10/16, É-T : -1.98, P5
Lecture de mots (score) : 99/100, É-T : 0.24, Q3 (P75)
Lecture recherche (temps) : TPS 480, É-T : -5.41, P5

## IMPORTANT
- N'ajoute PAS de commentaires ou d'explications
- Retourne UNIQUEMENT la liste des résultats
- Une épreuve par ligne
- Si une valeur est manquante, indique "—"`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez un PDF ou une image.' },
        { status: 400 }
      )
    }

    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Construire le contenu selon le type de fichier
    let contentBlock: Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam

    if (file.type.includes('pdf')) {
      // PDF → utiliser document block
      contentBlock = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      }
    } else {
      // Image → utiliser image block
      let imageMediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
      if (file.type.includes('jpeg') || file.type.includes('jpg')) imageMediaType = 'image/jpeg'
      else if (file.type.includes('gif')) imageMediaType = 'image/gif'
      else if (file.type.includes('webp')) imageMediaType = 'image/webp'

      contentBlock = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType,
          data: base64,
        },
      }
    }

    // Appeler Claude Vision
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    // Extraire le texte de la réponse
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    // Essayer de détecter le test utilisé
    let detectedTest = ''
    const testPatterns = [
      { pattern: /exalang\s*8[-\s]?11/i, name: 'Exalang 8-11' },
      { pattern: /exalang\s*11[-\s]?15/i, name: 'Exalang 11-15' },
      { pattern: /exalang\s*3[-\s]?6/i, name: 'Exalang 3-6' },
      { pattern: /evalo\s*2[-\s]?6/i, name: 'EVALO 2-6' },
      { pattern: /elo/i, name: 'ELO' },
      { pattern: /bale/i, name: 'BALE' },
      { pattern: /belec/i, name: 'BELEC' },
    ]

    for (const { pattern, name } of testPatterns) {
      if (pattern.test(responseText) || pattern.test(file.name)) {
        detectedTest = name
        break
      }
    }

    return NextResponse.json({
      success: true,
      resultats: responseText,
      detectedTest,
      tokensUsed: message.usage?.input_tokens + (message.usage?.output_tokens || 0),
    })

  } catch (error) {
    console.error('Erreur extraction PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'extraction. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
