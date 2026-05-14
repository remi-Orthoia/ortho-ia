/**
 * Extraction d'une feuille de cotation MoCA manuscrite via Claude Vision.
 *
 * L'ortho photographie sa feuille papier (cotation faite à la main) et on
 * récupère les 7 scores par domaine + observations + total éventuel. Pas de
 * percentiles MoCA (le test n'en a pas), uniquement des scores bruts.
 *
 * Pourquoi une route dédiée plutôt que `extract-pdf` :
 *   - schéma de sortie totalement différent (7 scores fixes au lieu d'une
 *     liste d'épreuves génériques),
 *   - le prompt rappelle explicitement le barème Nasreddine 2005 pour aider
 *     Claude à interpréter les annotations manuscrites courantes (ex. cases
 *     barrées, ratures, "11h10" sur l'horloge, indices catégoriels mémoire).
 *
 * Couplage : appelée par `components/forms/MocaScoresInput.tsx` (bouton
 * "Téléverser une photo MoCA"). La réponse pré-remplit les 7 inputs du
 * composant ; l'ortho relit et corrige avant de générer le CRBO.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'

// Vision sur une photo de feuille A4 = 15-30s. 45s laisse de la marge en cas
// de retry transitoire.
export const maxDuration = 45

const MAX_BYTES = 10 * 1024 * 1024 // 10 Mo
const PER_FILE_TIMEOUT_MS = 40_000

const EXTRACT_MOCA_TOOL: Anthropic.Tool = {
  name: 'extract_moca_scores',
  description:
    "Extrait les scores MoCA depuis une photo de feuille de cotation manuscrite. " +
    "Renvoie un score (entier) par domaine, plus d'éventuelles observations cliniques " +
    "et le total inscrit s'il est visible.",
  input_schema: {
    type: 'object',
    properties: {
      scores: {
        type: 'object',
        description:
          "Score brut par domaine. null si le domaine est illisible ou non rempli. " +
          "Chaque score doit respecter son maximum officiel.",
        properties: {
          visuospatial: { type: ['integer', 'null'], minimum: 0, maximum: 5 },
          denomination: { type: ['integer', 'null'], minimum: 0, maximum: 3 },
          memoire:      { type: ['integer', 'null'], minimum: 0, maximum: 5 },
          attention:    { type: ['integer', 'null'], minimum: 0, maximum: 6 },
          langage:      { type: ['integer', 'null'], minimum: 0, maximum: 3 },
          abstraction:  { type: ['integer', 'null'], minimum: 0, maximum: 2 },
          orientation:  { type: ['integer', 'null'], minimum: 0, maximum: 6 },
        },
        required: [
          'visuospatial', 'denomination', 'memoire', 'attention',
          'langage', 'abstraction', 'orientation',
        ],
      },
      observations: {
        type: 'object',
        description:
          "Notes manuscrites en marge décrivant la qualité de la réponse " +
          "(ex. \"horloge: aiguilles inversées\", \"rappel libre 2, +indice 4\"). " +
          "Chaîne vide si rien d'annoté.",
        properties: {
          visuospatial: { type: 'string' },
          denomination: { type: 'string' },
          memoire:      { type: 'string' },
          attention:    { type: 'string' },
          langage:      { type: 'string' },
          abstraction:  { type: 'string' },
          orientation:  { type: 'string' },
        },
        required: [
          'visuospatial', 'denomination', 'memoire', 'attention',
          'langage', 'abstraction', 'orientation',
        ],
      },
      scolarite_courte: {
        type: ['boolean', 'null'],
        description:
          "true si la case \"≤ 12 ans de scolarité\" est cochée (ajout +1 point officiel). " +
          "false si non cochée. null si non visible / non identifiable sur la photo.",
      },
      total_lu: {
        type: ['integer', 'null'],
        minimum: 0,
        maximum: 30,
        description:
          "Total /30 inscrit en bas de la feuille s'il est visible. null sinon. " +
          "Ce total est INDICATIF : il sert juste à valider la somme calculée côté UI.",
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Liste d'avertissements : domaine illisible, ambiguïté de lecture, " +
          "score qui dépasse le max théorique, etc.",
      },
    },
    required: ['scores', 'observations', 'warnings'],
  },
}

const MOCA_VISION_PROMPT = `Tu reçois une PHOTO d'une feuille de cotation MoCA (Montreal Cognitive Assessment, Nasreddine et al. 2005) remplie à la main par un·e orthophoniste.

Ton rôle : lire la feuille et extraire les **scores bruts par domaine** (entiers), les éventuelles **annotations manuscrites en marge**, l'état de la **case scolarité**, et le **total** s'il est inscrit.

## Les 7 domaines de la MoCA et leurs scores max

| Domaine | Max |
|---------|-----|
| Visuospatial / Exécutif | 5 |
| Dénomination (animaux) | 3 |
| Attention | 6 |
| Langage | 3 |
| Abstraction | 2 |
| Mémoire (rappel différé) | 5 |
| Orientation | 6 |
| **TOTAL** | **30** |

## Comment les scores sont notés sur la feuille papier officielle

- Chaque ITEM réussi est généralement marqué d'une **coche, croix, ou "1"** dans une petite case à droite.
- Le **sous-total du domaine** est reporté en bout de ligne ou de section, souvent dans un cadre numéroté du type "___ /5".
- Le **total** apparaît en bas, parfois encadré, type "___ /30".
- La **case scolarité** ("≤ 12 ans" ou "Education ≤ 12 years") se trouve en bas de feuille avec une mention "+1".

## Règles d'extraction

1. **Lis CHAQUE domaine séparément**. Pour chaque domaine, identifie le score total écrit par l'ortho dans le cadre du domaine. C'est cette valeur qui doit être renvoyée dans \`scores\`.
2. **Si tu ne vois pas clairement le total d'un domaine**, ne tente PAS de le recalculer en comptant les coches. Mets \`null\` et ajoute un warning.
3. **Respecte les maximums** : visuo ≤ 5, dénomination ≤ 3, attention ≤ 6, langage ≤ 3, abstraction ≤ 2, mémoire ≤ 5, orientation ≤ 6. Si tu lis un score qui dépasse → warning + null.
4. **Annotations en marge** : si l'ortho a noté quelque chose à côté d'un domaine (ex. "rappel libre 2, indice +2", "horloge mal dessinée", "100-7 → 93, 85, 78"), reporte CE TEXTE TEL QUEL dans \`observations[domaine]\`. Sinon chaîne vide.
5. **Case scolarité** : true si cochée, false si visible mais non cochée, null si non identifiable.
6. **Total** : si le total /30 est inscrit en bas de la feuille, reporte-le dans \`total_lu\`. Sinon null.
7. **NE JAMAIS inventer** : en cas d'ambiguïté, mets null + warning explicite. L'ortho relira et corrigera dans l'UI.
8. **Cas particulier rappel différé (mémoire)** : si la feuille montre plusieurs colonnes ("rappel libre", "indice catégoriel", "choix multiple"), seul le **rappel libre** compte dans le score MoCA officiel. Les autres vont dans \`observations.memoire\`.

## Format de sortie

Appelle exclusivement la fonction \`extract_moca_scores\` avec un objet JSON conforme au schéma.`

function isSupabaseUnavailable(err: any): boolean {
  if (!err) return false
  const code = err?.code ?? err?.cause?.code
  if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true
  const msg = String(err?.message ?? '').toLowerCase()
  if (msg.includes('fetch failed') || msg.includes('network')) return true
  return false
}

interface MocaScores {
  visuospatial: number | null
  denomination: number | null
  memoire: number | null
  attention: number | null
  langage: number | null
  abstraction: number | null
  orientation: number | null
}

interface ExtractedMoca {
  scores: MocaScores
  observations: Record<keyof MocaScores, string>
  scolarite_courte: boolean | null
  total_lu: number | null
  warnings: string[]
}

const DOMAIN_MAX: Record<keyof MocaScores, number> = {
  visuospatial: 5,
  denomination: 3,
  memoire: 5,
  attention: 6,
  langage: 3,
  abstraction: 2,
  orientation: 6,
}

/**
 * Filet de sécurité côté serveur : Claude peut occasionnellement renvoyer un
 * score hors-borne malgré la contrainte du schéma. On clampe + warn pour ne
 * jamais propager une valeur incohérente à l'UI.
 */
function sanitize(input: ExtractedMoca): ExtractedMoca {
  const warnings = [...(input.warnings ?? [])]
  const scores = { ...input.scores }
  for (const key of Object.keys(DOMAIN_MAX) as (keyof MocaScores)[]) {
    const max = DOMAIN_MAX[key]
    const v = scores[key]
    if (v == null) continue
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
      warnings.push(`Score ${key} invalide (${v}), ignoré.`)
      scores[key] = null
    } else if (v > max) {
      warnings.push(`Score ${key} = ${v} dépasse le max officiel (${max}), clampé.`)
      scores[key] = max
    } else {
      scores[key] = Math.round(v)
    }
  }
  return { ...input, scores, warnings }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      if (isSupabaseUnavailable(err)) {
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
          { status: 503 },
        )
      }
      throw err
    }
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Format non supporté. Téléversez une image (JPEG, PNG, HEIC converti).' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image trop volumineuse (max 10 Mo). Réduisez la résolution.' },
        { status: 413 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Service de génération non configuré.' },
        { status: 500 },
      )
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    let imageMediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
    if (file.type.includes('jpeg') || file.type.includes('jpg')) imageMediaType = 'image/jpeg'
    else if (file.type.includes('gif')) imageMediaType = 'image/gif'
    else if (file.type.includes('webp')) imageMediaType = 'image/webp'

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), PER_FILE_TIMEOUT_MS)

    const t0 = Date.now()
    let message
    try {
      message = await withRetry(
        () => anthropic.messages.create(
          {
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            tools: [EXTRACT_MOCA_TOOL],
            tool_choice: { type: 'tool', name: 'extract_moca_scores' },
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: { type: 'base64', media_type: imageMediaType, data: base64 },
                  },
                  {
                    type: 'text',
                    text: MOCA_VISION_PROMPT,
                    cache_control: { type: 'ephemeral' as const },
                  },
                ],
              },
            ],
          },
          { signal: abortController.signal },
        ),
        {
          maxAttempts: 3,
          initialDelayMs: 1500,
          signal: abortController.signal,
          onRetry: (attempt, error: any) => {
            console.log(`[extract-moca] retry ${attempt}/3 — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
          },
        },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUseBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )
    if (!toolUseBlock || toolUseBlock.name !== 'extract_moca_scores') {
      return NextResponse.json(
        { error: "Aucune structure exploitable n'a été produite par la lecture de la photo." },
        { status: 502 },
      )
    }

    const raw = toolUseBlock.input as ExtractedMoca
    const result = sanitize(raw)

    const tokensUsed =
      (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)
    const dt = Date.now() - t0
    const filled = Object.values(result.scores).filter((v) => v != null).length
    console.log(
      `[extract-moca] OK : ${filled}/7 domaines extraits, total_lu=${result.total_lu}, ` +
      `scolarité=${result.scolarite_courte}, ${tokensUsed} tokens, ${dt}ms`,
    )

    return NextResponse.json({ success: true, ...result, tokensUsed })
  } catch (error: any) {
    logger.error('extract-moca', error)

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: "La lecture de la photo a dépassé 40 secondes. Photo trop lourde ou API lente. Réessayez avec une image plus petite." },
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
      return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Trop de demandes. Attendez une minute et réessayez.' },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de la lecture de la photo. Veuillez réessayer." },
      { status: 500 },
    )
  }
}
