import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Whisper accepte jusqu'à 25Mo. Pour de l'audio webm/mp3, ça représente
// ~30 minutes de dictée — suffisant pour une anamnèse complète.
export const maxDuration = 60

const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // ============ AUTH ============
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // ============ Récupération du fichier audio ============
    const formData = await request.formData()
    const audio = formData.get('audio') as Blob | null
    if (!audio || typeof (audio as any).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Fichier audio manquant.' }, { status: 400 })
    }
    if (audio.size === 0) {
      return NextResponse.json({ error: 'Audio vide.' }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'Audio trop volumineux (max 25 Mo).' },
        { status: 413 },
      )
    }

    // ============ Whisper ============
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée côté serveur.' },
        { status: 500 },
      )
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // L'API attend un File-like. On normalise en File pour garantir un nom + type.
    const fileName = (audio as any).name || 'audio.webm'
    const fileType = audio.type || 'audio/webm'
    const file = new File([audio], fileName, { type: fileType })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'fr',
      // Format response_format: text → string brut. Plus simple que json.
      response_format: 'text',
    })

    // SDK retourne déjà un string quand response_format = 'text'.
    const text = typeof transcription === 'string' ? transcription : ((transcription as any)?.text ?? '')

    return NextResponse.json({ success: true, text: text.trim() })
  } catch (error: any) {
    console.error('Erreur transcription Whisper:', {
      name: error?.name,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Service de transcription indisponible.' }, { status: 503 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques secondes.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: 'Erreur lors de la transcription audio.' },
      { status: 500 },
    )
  }
}
