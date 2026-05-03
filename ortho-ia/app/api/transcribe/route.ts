import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Whisper accepte jusqu'à 25Mo. Pour de l'audio webm/mp3, ça représente
// ~30 minutes de dictée — suffisant pour une anamnèse complète.
export const maxDuration = 60

const MAX_AUDIO_BYTES = 25 * 1024 * 1024

// Hallucinations connues de Whisper sur des audios silencieux ou trop courts.
// Whisper a été entraîné sur des sous-titres YouTube → quand il "ne comprend
// rien" il recrache ces génériques. On les supprime systématiquement.
const WHISPER_HALLUCINATIONS = [
  /sous-?titres?\s+réalisés?\s+par\s+la\s+communauté\s+d['’]\s*amara\.org/gi,
  /sous-?titrage\s+(de\s+)?(la\s+)?soci[eé]t[eé]\s+radio-?canada/gi,
  /sous-?titres?\s+(faits?|réalisés?)\s+par\s+\S+/gi,
  /sous-?titrage\s+st['’]?\s*501/gi,
  /❤?\s*par\s+soustitreur\.com/gi,
  /merci\s+d['’]\s*avoir\s+regardé\s+(cette\s+)?(la\s+)?vidéo\.?/gi,
  /merci\s+d['’]\s*avoir\s+regardé\.?/gi,
  /n['’]oubliez\s+pas\s+de\s+vous\s+abonner/gi,
  /abonnez-?vous\s+(à\s+)?(ma\s+|notre\s+)?cha[iî]ne/gi,
  /like\s+et\s+abonne-?toi/gi,
  /générique/gi,
]

function sanitizeWhisperText(input: string): string {
  let s = (input || '').trim()
  if (!s) return ''
  for (const re of WHISPER_HALLUCINATIONS) s = s.replace(re, ' ')
  // Collapse les espaces multiples laissés par le filtrage
  s = s.replace(/\s+/g, ' ').trim()
  // Si après filtrage il ne reste qu'une ponctuation isolée, considère vide.
  if (/^[\s\.\,\;\:\-–—…]+$/.test(s)) return ''
  return s
}

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
    // Le hook envoie sous la clé `audio`. On accepte aussi `file` (au cas où
    // un autre client utilise la convention OpenAI directe) pour robustesse.
    const audio = (formData.get('audio') ?? formData.get('file')) as Blob | null
    if (!audio || typeof (audio as any).arrayBuffer !== 'function') {
      const keys: string[] = []
      formData.forEach((_v, k) => keys.push(k))
      console.warn('[transcribe] Fichier audio manquant — clés FormData :', keys)
      return NextResponse.json({ error: 'Fichier audio manquant.' }, { status: 400 })
    }
    console.log('[transcribe] reçu', {
      size: audio.size,
      type: audio.type,
      name: (audio as any).name || '(blob sans nom)',
    })
    if (audio.size === 0) {
      return NextResponse.json({ error: 'Audio vide (durée trop courte).' }, { status: 400 })
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
      // temperature: 0 → réponse déterministe, beaucoup moins d'hallucinations
      // sur les passages silencieux/peu sonores.
      temperature: 0,
      // Le `prompt` oriente le décodeur vers le bon vocabulaire ET réduit
      // drastiquement les hallucinations de générique YouTube ("sous-titres
      // réalisés par la communauté d'Amara.org", "merci d'avoir regardé"...).
      // On lui donne un mini-contexte orthophonie + les termes courants.
      prompt:
        "Transcription d'une dictée d'orthophoniste pour un compte rendu de bilan orthophonique (CRBO). " +
        "Vocabulaire : anamnèse, bilan, motif de consultation, langage oral, langage écrit, phonologie, " +
        "lexique, syntaxe, conscience phonologique, mémoire de travail, dyslexie, dysorthographie, dysphasie, " +
        "Exalang, EVALO, écart-type, percentile, déficitaire, pathologique, normé. " +
        "Patient, médecin prescripteur, école, classe, CP, CE1, CE2, CM1, CM2, maternelle.",
      response_format: 'text',
    })

    const rawText = typeof transcription === 'string' ? transcription : ((transcription as any)?.text ?? '')
    const text = sanitizeWhisperText(rawText)
    console.log('[transcribe] OK', {
      chars: text.length,
      rawChars: rawText.length,
      filtered: rawText.length !== text.length,
      preview: text.slice(0, 80),
    })

    if (!text) {
      // Soit silence total, soit 100% du texte renvoyé était une hallucination
      // connue. On le signale clairement plutôt que de retourner un texte vide.
      return NextResponse.json(
        { error: "Aucune parole détectée — parlez plus près du micro et réessayez." },
        { status: 422 },
      )
    }

    return NextResponse.json({ success: true, text })
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
