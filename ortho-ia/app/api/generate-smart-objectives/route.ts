import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  anonymize,
  rehydrate,
  buildScrubList,
  scrubObjectStrings,
} from '@/lib/anonymizer'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'
import { logger } from '@/lib/logger'
import { handleAnthropicError } from '@/lib/anthropic-error'
import type { CRBOStructure } from '@/lib/prompts'
import type { CRBOFormData } from '@/lib/types'

export const maxDuration = 120

export interface SmartObjective {
  domaine: string
  intitule: string
  ligne_de_base: string
  critere_maitrise: string
  delai: string
  entrainement: string[]
  reevaluation: string
}

export interface SmartObjectivesPayload {
  objectifs: SmartObjective[]
  strategies_ebp: string[]
  prochaine_evaluation: string
}

const SMART_TOOL: Anthropic.Tool = {
  name: 'generate_smart_objectives',
  description:
    "Génère une fiche d'objectifs thérapeutiques SMART à partir des scores de bilan orthophonique.",
  input_schema: {
    type: 'object',
    properties: {
      objectifs: {
        type: 'array',
        description:
          'Maximum 3 objectifs ciblés sur les domaines les plus déficitaires du bilan.',
        items: {
          type: 'object',
          properties: {
            domaine: {
              type: 'string',
              description:
                "Domaine clinique ciblé (ex: 'Voie d'adressage', 'Conscience phonologique', 'Fluence de lecture').",
            },
            intitule: {
              type: 'string',
              description:
                "Objectif précis, mesurable, formulé positivement. Ex: 'Lire correctement 8/10 mots irréguliers présentés isolément'.",
            },
            ligne_de_base: {
              type: 'string',
              description:
                "Score actuel chiffré au bilan, avec date entre parenthèses. Ex: '3/10 (bilan du 15 mars 2026)'.",
            },
            critere_maitrise: {
              type: 'string',
              description:
                "Critère objectif d'atteinte. Ex: '8/10 sur 2 séances consécutives'.",
            },
            delai: {
              type: 'string',
              description: 'Délai court terme : 3 à 4 semaines.',
            },
            entrainement: {
              type: 'array',
              description:
                'Exercices ciblés evidence-based. 2 à 4 items, formulés concrètement.',
              items: { type: 'string' },
            },
            reevaluation: {
              type: 'string',
              description:
                "Modalité de réévaluation. Ex: 'Liste de 10 mots étalonnée, séance 6'.",
            },
          },
          required: [
            'domaine',
            'intitule',
            'ligne_de_base',
            'critere_maitrise',
            'delai',
            'entrainement',
            'reevaluation',
          ],
        },
      },
      strategies_ebp: {
        type: 'array',
        description:
          "3 à 5 stratégies evidence-based pertinentes pour ce profil (Elkonin, dictée sans erreur Cèbe & Goigoux, fluence par répétition, décodage syllabique progressif, lecture partagée parent-enfant, etc.). Format court : nom de la méthode + 1 phrase de précision.",
        items: { type: 'string' },
      },
      prochaine_evaluation: {
        type: 'string',
        description:
          "Date suggérée de la prochaine évaluation formelle (échéance 3 à 6 mois selon l'intensité du suivi). Format : 'Septembre 2026 — réévaluation des compétences en lecture'.",
      },
    },
    required: ['objectifs', 'strategies_ebp', 'prochaine_evaluation'],
  },
}

function buildSmartPrompt(input: {
  patient_prenom: string
  patient_age: string
  patient_classe: string
  test_utilise: string
  bilan_date_fr: string
  structure_json: any
}): string {
  return `Tu es un orthophoniste expert en evidence-based practice.
À partir des résultats de bilan suivants, génère une fiche d'objectifs thérapeutiques SMART pour les 3-4 semaines à venir.

RÈGLES IMPÉRATIVES :
- Maximum 3 objectifs, ciblés sur les domaines les plus déficitaires (percentiles ≤ P25 en priorité)
- Chaque objectif doit être SMART : Spécifique, Mesurable, Atteignable, Réaliste, Temporel
- Pour chaque objectif :
  * intitulé précis et chiffré
  * ligne de base = score réel relevé dans le bilan (avec date)
  * critère de maîtrise mesurable (ex: 8/10 sur 2 séances)
  * délai 3 à 4 semaines
  * entraînement ciblé EBP (2-4 exercices concrets)
  * modalité de réévaluation
- Objectifs réalistes et motivants — small wins, progression visible
- Stratégies basées sur l'evidence : Elkonin, décodage syllabique progressif, fluence par répétition, dictée sans erreur (Cèbe & Goigoux), lecture partagée parent-enfant, méthode des alphas, etc.
- Formulations positives et encourageantes
- Vocabulaire accessible à l'orthophoniste ET compréhensible par les parents si la fiche est partagée
- Pas de jargon médical lourd, pas de codes diagnostiques

PATIENT
- Prénom : ${input.patient_prenom}
- Âge : ${input.patient_age || 'non renseigné'}
- Classe : ${input.patient_classe || 'non renseigné'}

BILAN
- Test : ${input.test_utilise}
- Date : ${input.bilan_date_fr}

DONNÉES DU BILAN (JSON) :
${JSON.stringify(input.structure_json, null, 2)}

Génère la fiche en appelant l'outil generate_smart_objectives.`
}

function computeAge(ddnISO: string | null | undefined, refISO: string | null | undefined): string {
  if (!ddnISO) return ''
  const ddn = new Date(ddnISO)
  if (isNaN(ddn.getTime())) return ''
  const ref = refISO ? new Date(refISO) : new Date()
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

function formatDateFR(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const crboId: string | undefined = body?.crbo_id
    const force: boolean = body?.force === true
    if (!crboId || typeof crboId !== 'string') {
      return NextResponse.json({ error: 'crbo_id manquant.' }, { status: 400 })
    }

    const { data: crbo, error: crboErr } = await supabase
      .from('crbos')
      .select('*')
      .eq('id', crboId)
      .eq('user_id', user.id)
      .single()

    if (crboErr || !crbo) {
      return NextResponse.json({ error: 'CRBO introuvable.' }, { status: 404 })
    }

    // Cache : si la fiche existe deja en BDD et que l'ortho ne force pas la
    // regeneration, on relit sans rappeler Claude. Garantit la reproductibilite
    // (meme contenu d'une session a l'autre) et evite le cout Claude.
    if (!force && crbo.smart_objectives) {
      return NextResponse.json({
        success: true,
        smart: crbo.smart_objectives as SmartObjectivesPayload,
        cached: true,
        generated_at: crbo.smart_objectives_generated_at ?? null,
      })
    }

    const testList = (crbo.test_utilise ? String(crbo.test_utilise).split(',').map((t: string) => t.trim()) : [])
    const isMocaOnly = testList.length === 1 && testList[0] === 'MoCA'
    if (isMocaOnly) {
      return NextResponse.json(
        { error: "La fiche d'objectifs SMART n'est pas disponible pour le MoCA." },
        { status: 400 },
      )
    }

    const structure: CRBOStructure | null = crbo.structure_json ?? null
    if (!structure || !Array.isArray(structure.domains) || structure.domains.length === 0) {
      return NextResponse.json(
        { error: 'Ce CRBO ne contient pas de scores structurés exploitables.' },
        { status: 400 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
      return NextResponse.json(
        { error: 'Service de génération non configuré côté serveur.' },
        { status: 500 },
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const minimalForm: Pick<CRBOFormData, 'patient_prenom' | 'patient_nom' | 'medecin_nom' | 'ortho_nom'> = {
      patient_prenom: crbo.patient_prenom || '',
      patient_nom: crbo.patient_nom || '',
      medecin_nom: crbo.medecin_nom || '',
      ortho_nom: '',
    }
    const scrubList = buildScrubList(minimalForm)
    const anonStructure = scrubObjectStrings(structure, scrubList)

    const anonResult = anonymize({
      ...(minimalForm as any),
      patient_ddn: crbo.patient_ddn ?? undefined,
    } as CRBOFormData)
    const reverseMap = anonResult.reverseMap

    const patientAge = computeAge(crbo.patient_ddn, crbo.bilan_date)
    const bilanDateFr = formatDateFR(crbo.bilan_date)

    const userPrompt = buildSmartPrompt({
      patient_prenom: anonResult.anonymized.patient_prenom || '',
      patient_age: patientAge,
      patient_classe: crbo.patient_classe || '',
      test_utilise: testList.join(', '),
      bilan_date_fr: bilanDateFr,
      structure_json: anonStructure,
    })

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 90_000)

    let message
    try {
      message = await withRetry(
        () =>
          anthropic.messages.create(
            {
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: [
                {
                  type: 'text',
                  text:
                    "Tu es un orthophoniste senior, expert en evidence-based practice. Tu produis des fiches d'objectifs thérapeutiques SMART, courtes, motivantes et cliniquement rigoureuses. Tu réponds toujours en français professionnel.",
                  cache_control: { type: 'ephemeral' },
                },
              ],
              tools: [SMART_TOOL],
              tool_choice: { type: 'tool', name: 'generate_smart_objectives' },
              messages: [{ role: 'user', content: userPrompt }],
            },
            { signal: abortController.signal },
          ),
        {
          maxAttempts: 3,
          initialDelayMs: 1500,
          signal: abortController.signal,
        },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const toolUseBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    if (!toolUseBlock || toolUseBlock.name !== 'generate_smart_objectives') {
      return NextResponse.json(
        { error: "Aucune fiche SMART exploitable n'a été produite." },
        { status: 502 },
      )
    }

    const raw = toolUseBlock.input as SmartObjectivesPayload
    const rehydrated = rehydrate(raw, reverseMap) as SmartObjectivesPayload

    // Persistance : best-effort. Si l'UPDATE echoue (RLS, colonne pas encore
    // migree...), on log mais on renvoie quand meme la fiche a l'ortho — elle
    // l'a vue generee a l'ecran, on ne veut pas la perdre. Le pire scenario :
    // au prochain clic, on regenere (cout ~0,02€) plutot que de relire le cache.
    const generatedAt = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('crbos')
      .update({
        smart_objectives: rehydrated,
        smart_objectives_generated_at: generatedAt,
      })
      .eq('id', crboId)
      .eq('user_id', user.id)

    if (updateErr) {
      logger.warn('smart-objectives-persist-failed', String(updateErr.message ?? updateErr).slice(0, 200))
    }

    return NextResponse.json({
      success: true,
      smart: rehydrated,
      cached: false,
      generated_at: generatedAt,
    })
  } catch (error: any) {
    logger.error('generate-smart-objectives', error)
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Génération trop longue, réessayez.' },
        { status: 504 },
      )
    }
    const anthropicHandled = handleAnthropicError(error, 'la génération de la fiche SMART')
    if (anthropicHandled) return anthropicHandled
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la fiche SMART.' },
      { status: 500 },
    )
  }
}
