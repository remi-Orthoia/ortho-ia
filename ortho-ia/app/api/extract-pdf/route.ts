import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { EXTRACTION_PROMPT } from '@/lib/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
      model: 'claude-sonnet-4-6',
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
