import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildScrubList, scrubText, rehydrate } from '@/lib/anonymizer'
import { handleAnthropicError } from '@/lib/anthropic-error'
import { withRetry } from '@/lib/retry'

/**
 * POST /api/crbo/:id/regenerate-section
 *
 * Régénération ciblée d'UNE section d'un CRBO (diagnostic, recommandations,
 * conclusion, points_forts, difficultes, anamnese_redigee...) selon une
 * instruction libre de l'orthophoniste ("rends-le plus concis", "ajoute la
 * mention du TDAH", "reformule pour insister sur les compétences").
 *
 * Le serveur retourne UNIQUEMENT le texte régénéré — la sauvegarde reste à
 * la charge du client (via le PATCH existant /api/crbo/:id), pour laisser à
 * l'ortho le contrôle final.
 *
 * Body :
 *   {
 *     section_name: string,   // ex: "diagnostic", "recommandations", ...
 *     section_label: string,  // libellé humain pour le prompt ("Diagnostic")
 *     current_text: string,   // contenu actuel de la section
 *     instruction: string,    // demande libre de l'orthophoniste
 *   }
 *
 * Réponse : { regenerated: string }
 */

export const maxDuration = 60

const ALLOWED_SECTIONS = new Set([
  'anamnese_redigee',
  'motif_reformule',
  'points_forts',
  'difficultes_identifiees',
  'diagnostic',
  'recommandations',
  'axes_therapeutiques',
  'conclusion',
])

const SECTION_GUIDANCE: Record<string, string> = {
  anamnese_redigee:
    'Récit clinique de l\'anamnèse, ton professionnel, paragraphes structurés, intègre les éléments biographiques et antécédents.',
  motif_reformule:
    '1-2 phrases formulant le motif de consultation en termes cliniques.',
  points_forts:
    'Synthèse des points forts du patient (3-5 lignes, ton positif et factuel).',
  difficultes_identifiees:
    'Synthèse des difficultés (3-5 lignes, ton clinique, sans jugement).',
  diagnostic:
    'Diagnostic orthophonique formulé selon les règles cliniques de l\'app (jamais de code Fxxx ; modalisation "compatible avec / suggère / à confirmer").',
  recommandations:
    'Recommandations cliniques en 3-5 lignes, axées sur la suite (rééducation, bilans complémentaires, suivis).',
  axes_therapeutiques:
    'Liste 1-4 axes thérapeutiques numérotés, une ligne par axe. Renvoie un texte avec un axe par ligne (pas de bullet markdown).',
  conclusion:
    'Mention médico-légale de conclusion, courte (1-2 phrases), ton neutre et clinique.',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const section_name = typeof body?.section_name === 'string' ? body.section_name.trim() : ''
  const section_label = typeof body?.section_label === 'string' ? body.section_label.trim() : section_name
  const current_text = typeof body?.current_text === 'string' ? body.current_text : ''
  const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : ''

  if (!section_name || !ALLOWED_SECTIONS.has(section_name)) {
    return NextResponse.json(
      { error: `Section non régénérable : ${section_name}` },
      { status: 400 },
    )
  }
  if (!instruction) {
    return NextResponse.json(
      { error: 'Indiquez une instruction pour la régénération.' },
      { status: 400 },
    )
  }

  // Charge le CRBO pour le contexte d'anonymisation (patient, médecin, ortho).
  const { data: crbo, error: crboError } = await supabase
    .from('crbos')
    .select('id, user_id, patient_prenom, patient_nom, medecin_nom')
    .eq('id', params.id)
    .single()

  if (crboError || !crbo) {
    return NextResponse.json({ error: 'CRBO introuvable' }, { status: 404 })
  }
  if (crbo.user_id !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Charge le profil ortho pour compléter la liste de scrub.
  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, nom')
    .eq('id', user.id)
    .single()

  const orthoNom = profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : ''

  // Anonymisation : remplace les noms réels par des tokens stables avant envoi à Claude.
  const scrubList = buildScrubList({
    patient_prenom: crbo.patient_prenom,
    patient_nom: crbo.patient_nom,
    medecin_nom: crbo.medecin_nom ?? undefined,
    ortho_nom: orthoNom,
  })
  const safeCurrent = scrubText(current_text, scrubList) ?? ''
  const safeInstruction = scrubText(instruction, scrubList) ?? ''

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('VOTRE_CLE')) {
    return NextResponse.json(
      { error: 'Service de génération non configuré côté serveur.' },
      { status: 500 },
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Prompt focalisé : on garde l'ancien texte en référence + l'instruction de
  // l'ortho. On exige uniquement le texte de la section régénérée, sans
  // markdown structuré inattendu (la section sera replongée dans le rendu
  // existant qui gère **bold**, listes numérotées et lignes vides).
  const guidance = SECTION_GUIDANCE[section_name] ?? ''

  const systemPrompt = `Tu es un orthophoniste senior français. Tu réécris une section ciblée d'un CRBO (Compte Rendu de Bilan Orthophonique) selon l'instruction donnée par l'orthophoniste qui te délègue cette retouche.

Règles cliniques absolues :
- Pas d'em-dash (—) ; préférer la virgule.
- Pas de codes CIM-10 (F80, F81, F82...).
- Modalisation : "compatible avec", "suggère", "évoque", "à confirmer", "ouvre la piste de" (jamais "le patient présente un trouble X" sans nuance).
- Style sobre, professionnel, lisible par un médecin prescripteur et par les parents/le patient.
- Pas de jargon non expliqué. Pas de formulations alarmantes ("déclin", "détérioration", "dégénérescence") sauf si elles sont déjà dans le texte source ET cliniquement justifiées.
- Respecter l'orientation imposée par la section : ${guidance}

Format de sortie :
- Retourne UNIQUEMENT le texte régénéré de la section, rien d'autre. Pas de balises, pas de préambule, pas d'explications.
- Tu peux utiliser **gras** pour les sous-titres ou termes importants.
- Listes numérotées "1. ..." si pertinent.
- Lignes vides pour séparer les paragraphes.`

  const userPrompt = `Section à régénérer : **${section_label}**

Contenu actuel de la section :
"""
${safeCurrent || '(section vide)'}
"""

Instruction de l'orthophoniste :
"""
${safeInstruction}
"""

Régénère la section selon cette instruction. Retourne UNIQUEMENT le texte régénéré.`

  let regeneratedSafe: string
  try {
    const message = await withRetry(
      () => anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      { maxAttempts: 2 },
    )

    const block = message.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: "Réponse Claude vide." }, { status: 500 })
    }
    regeneratedSafe = block.text.trim()
  } catch (error) {
    const handled = handleAnthropicError(error, 'la régénération de la section')
    if (handled) return handled
    console.error('regenerate-section unexpected error:', error)
    return NextResponse.json({ error: 'Erreur lors de la régénération.' }, { status: 500 })
  }

  // Rehydrate : remet les vraies valeurs (patient, médecin, ortho) en clair.
  const reverseMap = {
    tokens: {
      '__P_PRENOM__': crbo.patient_prenom,
      '__P_NOM__': crbo.patient_nom,
      '__M_NOM__': crbo.medecin_nom ?? '',
      '__O_NOM__': orthoNom,
    },
  }
  const regenerated = rehydrate(regeneratedSafe, reverseMap)

  return NextResponse.json({ regenerated })
}
