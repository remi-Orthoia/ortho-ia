import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { CLASSES_OPTIONS, TESTS_OPTIONS } from '@/lib/types'

/**
 * POST /api/voice-command/parse
 * Body : { text: string }   (déjà transcrit via /api/transcribe)
 *
 * Reçoit la transcription d'une commande vocale type
 *   "Hé Ortho.ia, nouveau bilan Léa, CE2, motif lenteur lecture, Exalang 8-11"
 * et la transforme en champs structurés exploitables pour pré-remplir le
 * formulaire CRBO :
 *   { patient_prenom, patient_nom, patient_classe, bilan_type, motif, tests }
 *
 * Pas de PII transmise à Claude au-delà de ce que l'ortho dicte. Pas de
 * stockage côté serveur — le retour direct est posé dans sessionStorage
 * côté navigateur pour le handoff vers /nouveau-crbo.
 */

const VOICE_COMMAND_TOOL: Anthropic.Tool = {
  name: 'extract_voice_command',
  description:
    "Extrait les informations structurées d'une commande vocale d'orthophoniste " +
    "pour démarrer un nouveau bilan orthophonique (CRBO).",
  input_schema: {
    type: 'object',
    properties: {
      patient_prenom: {
        type: ['string', 'null'],
        description: "Prénom du patient mentionné. Capitalisé (ex: 'Léa'). null si absent.",
      },
      patient_nom: {
        type: ['string', 'null'],
        description: "Nom de famille si mentionné (souvent omis à l'oral). null sinon.",
      },
      patient_classe: {
        type: ['string', 'null'],
        description:
          "Niveau scolaire normalisé parmi : " + CLASSES_OPTIONS.join(', ') +
          ". L'ortho peut dire 'cinquième' → mapper à '5ème'. null si absent.",
      },
      bilan_type: {
        type: ['string', 'null'],
        enum: ['initial', 'renouvellement', null],
        description: "Type de bilan si dit explicitement (renouvellement / suivi → 'renouvellement'). Sinon 'initial' par défaut côté UI.",
      },
      motif: {
        type: ['string', 'null'],
        description:
          "Motif de consultation en quelques mots (ex: 'lenteur en lecture', 'suspicion de dyslexie'). " +
          "Garde la formulation exacte de l'ortho, ne reformule pas. null si absent.",
      },
      tests_utilises: {
        type: 'array',
        items: {
          type: 'string',
          enum: TESTS_OPTIONS as unknown as string[],
        },
        description:
          "Tests cités. Mapper aux libellés exacts du catalogue : " + TESTS_OPTIONS.slice(0, 8).join(', ') +
          "… L'ortho peut dire 'examang' → 'Exalang 8-11' (selon l'âge si déductible). " +
          "Tableau vide si rien cité.",
      },
      confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description:
          "Confiance globale dans l'extraction : 'high' si la commande est claire et complète, " +
          "'low' si peu d'éléments identifiables (ortho devra remplir manuellement).",
      },
      summary: {
        type: 'string',
        description:
          "Phrase courte résumant ce qui a été compris (ex: 'Bilan initial Léa CE2, motif lenteur lecture, Exalang 8-11'). " +
          "Affiché à l'ortho pour confirmation avant pré-remplissage.",
      },
    },
    required: ['confidence', 'summary'],
  },
}

const SYSTEM_PROMPT = `Tu es un assistant qui transforme une commande vocale d'orthophoniste en données structurées pour démarrer un CRBO (Compte Rendu de Bilan Orthophonique).

L'ortho parle naturellement, parfois en phrase complète, parfois en mots-clés. Exemples :
  - "Hé Ortho.ia, nouveau bilan pour Léa, CE2, motif lenteur en lecture, Exalang 8-11"
  - "Renouvellement Tom 4ème, suspicion dyslexie compensée, Exalang 11-15"
  - "Bilan initial Marie 7 ans GS, retard de langage"
  - "Examath 8-15 pour Léon, classe de CM2, calcul difficile"

Tu utilises l'outil \`extract_voice_command\` pour rendre la structure JSON. Règles :

1. **Prénom** : capitalisé (Léa, pas "léa"). Ignore le wake-word "ortho.ia" / "ortho ia" / "hé ortho" / "ok ortho".
2. **Classe** : normaliser vers la liste autorisée (PS/MS/GS/CP/CE1/CE2/CM1/CM2/6ème/5ème/4ème/3ème/2nde/1ère/Terminale/Adulte). "cinquième" → "5ème", "primaire" → null (trop vague), "maternelle" → null sauf si précis.
3. **Test** : matcher au catalogue exact. "exalang" sans précision + classe ≤ CE2 → "Exalang 5-8" ; "exalang" + CE2-CM2 → "Exalang 8-11" ; "exalang" + collège → "Exalang 11-15". "examath" → "Examath".
4. **Motif** : garder la formulation exacte de l'ortho. Ne reformule PAS. Ne déduis PAS de motif si pas dit.
5. **bilan_type** : 'renouvellement' UNIQUEMENT si l'ortho dit explicitement "renouvellement", "suivi", "deuxième bilan", "nouveau bilan de" + un patient déjà connu. Sinon laisser null (= initial par défaut côté UI).
6. **confidence** :
   - 'high' : prénom + au moins 2 autres champs identifiés sans ambiguïté
   - 'medium' : prénom + 1 autre champ
   - 'low' : commande peu claire, ortho doit compléter manuellement
7. **summary** : 1 phrase courte récapitulant ce qui a été extrait — affichée à l'ortho pour confirmation.

Anti-hallucination : si un champ n'est PAS dans la dictée, retourne null ou tableau vide. JAMAIS d'invention.`

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let body: { text?: unknown } = {}
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'Texte de commande manquant' }, { status: 400 })
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: 'Commande trop longue (max 2000 caractères)' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), 30_000)

  try {
    const message = await withRetry(
      () => anthropic.messages.create(
        {
          model: 'claude-haiku-4-5-20251001',
          // Haiku 4.5 suffit largement pour ce parsing structuré (gain de
          // latence ~3× vs Sonnet, coût négligeable). Pas besoin de la
          // puissance Sonnet pour extraire 4-5 champs d'une phrase.
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: [VOICE_COMMAND_TOOL],
          tool_choice: { type: 'tool', name: 'extract_voice_command' },
          messages: [{
            role: 'user',
            content: `Dictée de l'orthophoniste à analyser :\n\n"${text}"\n\nExtrais les champs structurés via l'outil.`,
          }],
        },
        { signal: abortController.signal },
      ),
      {
        maxAttempts: 2,
        initialDelayMs: 800,
        signal: abortController.signal,
      },
    )

    const toolUseBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    if (!toolUseBlock || toolUseBlock.name !== 'extract_voice_command') {
      return NextResponse.json(
        { error: "Aucune structure n'a pu être extraite de la commande." },
        { status: 502 },
      )
    }

    type Extracted = {
      patient_prenom: string | null
      patient_nom: string | null
      patient_classe: string | null
      bilan_type: 'initial' | 'renouvellement' | null
      motif: string | null
      tests_utilises?: string[]
      confidence: 'high' | 'medium' | 'low'
      summary: string
    }
    const extracted = toolUseBlock.input as Extracted

    // Filet de sécurité : ne renvoyer que les classes / tests dans le catalogue.
    if (extracted.patient_classe && !(CLASSES_OPTIONS as readonly string[]).includes(extracted.patient_classe)) {
      extracted.patient_classe = null
    }
    if (Array.isArray(extracted.tests_utilises)) {
      extracted.tests_utilises = extracted.tests_utilises.filter(
        (t): t is string => typeof t === 'string' && (TESTS_OPTIONS as readonly string[]).includes(t),
      )
    } else {
      extracted.tests_utilises = []
    }

    return NextResponse.json({
      success: true,
      transcript: text,
      extracted,
    })
  } catch (err: any) {
    logger.error('voice-command-parse', err)
    if (err?.name === 'AbortError') {
      return NextResponse.json({ error: "L'analyse de la commande vocale a échoué (timeout)." }, { status: 504 })
    }
    return NextResponse.json({ error: "Erreur d'analyse de la commande vocale." }, { status: 500 })
  } finally {
    clearTimeout(timeoutId)
  }
}
