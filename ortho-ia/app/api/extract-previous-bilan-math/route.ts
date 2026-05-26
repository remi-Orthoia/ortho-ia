import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'

/**
 * Extraction du TEXTE BRUT d'un compte-rendu de bilan math (B-CM / B-CMado)
 * EXTERNE (redige par une autre ortho ou bilan papier scanne).
 *
 * Difference avec /api/extract-previous-bilan (route langage) :
 *  - PAS d'extraction structuree (percentiles, scores numeriques) car les
 *    bilans math sont qualitatifs et n'ont pas de schema percentile.
 *  - Retourne UNIQUEMENT le texte fidele du CRBO precedent, que le
 *    moteur de generation utilise comme contexte prose pour formuler
 *    les evolutions sans inventer.
 *
 * Flow :
 *  1. Upload PDF ou DOCX (max 10 MB).
 *  2. PDF → Claude Vision (document block base64) → texte fidele markdown.
 *  3. DOCX → mammoth extrait le texte brut → renvoye tel quel sans LLM.
 *  4. Reponse : { text: string, charCount: number }
 *
 * Pas de persistance DB : le client pose le texte dans
 * draft.renouvellement.bilanPrecedentTexteExterne et c'est tout.
 */

export const maxDuration = 90

const SUPPORTED_PDF = ['application/pdf']
const SUPPORTED_DOCX = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const EXTRACT_PROMPT = `Tu es un assistant d'extraction. L'utilisateur te fournit un compte rendu de bilan orthophonique de cognition mathematique (B-CM enfant ou B-CMado ado, methode Elsa DALL'AGNOL ou equivalent).

Ta mission : extraire le TEXTE FIDELE du document, sans reformulation. Reproduis exactement ce qui est ecrit, en preservant la structure (titres de sections, sous-titres d'epreuves, paragraphes, listes).

Regles :
- Output en markdown plain : titres avec **gras**, listes avec - .
- Ne reformule RIEN. Ne resume RIEN. Reproduis l'integralite du texte du CRBO.
- Ignore l'en-tete cabinet (nom ortho, adresse, telephone) et le bloc patient (Prenom, Nom, DDN, Classe) — commence directement par "**Motif**" ou la 1re section significative.
- Ignore les eventuelles signatures, mentions confidentielles, pieds de page.
- Si le document n'est pas un CRBO de bilan math (autre type de bilan), retourne simplement le texte brut quand meme — le moteur en aval se chargera du contexte.

Pas de preambule. Pas de "voici l'extraction". Commence directement par le contenu.`

export async function POST(request: NextRequest) {
  try {
    // ========== AUTH ==========
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // ========== PARSE FORM ==========
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (>10 Mo).' }, { status: 413 })
    }

    const mime = file.type || 'application/octet-stream'
    const isPdf = SUPPORTED_PDF.includes(mime) || file.name.toLowerCase().endsWith('.pdf')
    const isDocx = SUPPORTED_DOCX.includes(mime) || /\.(docx?|odt)$/i.test(file.name)

    if (!isPdf && !isDocx) {
      return NextResponse.json({ error: 'Format non supporte. Utilisez PDF ou Word (.docx).' }, { status: 415 })
    }

    // ========== DOCX → mammoth (extraction directe, pas besoin de LLM) ==========
    if (isDocx) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await mammoth.extractRawText({ buffer })
        const text = (result.value ?? '').trim()
        if (!text) {
          return NextResponse.json({ error: 'Le fichier Word semble vide.' }, { status: 422 })
        }
        return NextResponse.json({ text, charCount: text.length, source: 'docx' })
      } catch (err: any) {
        logger.error('extract-previous-bilan-math docx', err)
        return NextResponse.json({ error: 'Impossible de lire le Word.' }, { status: 500 })
      }
    }

    // ========== PDF → Claude Vision ==========
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service indisponible cote serveur.' }, { status: 500 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    try {
      const message = await withRetry(
        () => anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              { type: 'text', text: EXTRACT_PROMPT },
            ],
          }],
        }),
        { maxAttempts: 2 },
      )
      const block = message.content.find(b => b.type === 'text')
      const text = block && block.type === 'text' ? block.text.trim() : ''
      if (!text) {
        return NextResponse.json({ error: 'Aucun texte extrait du PDF.' }, { status: 422 })
      }
      return NextResponse.json({ text, charCount: text.length, source: 'pdf' })
    } catch (error) {
      const handled = handleAnthropicError(error, "l'extraction du PDF")
      if (handled) return handled
      logger.error('extract-previous-bilan-math pdf', error)
      return NextResponse.json({ error: 'Erreur lors de l\'extraction PDF.' }, { status: 500 })
    }
  } catch (err: any) {
    logger.error('extract-previous-bilan-math unexpected', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue.' }, { status: 500 })
  }
}
