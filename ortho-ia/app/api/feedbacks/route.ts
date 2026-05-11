import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

/**
 * POST /api/feedbacks
 *
 * Reçoit le retour qualitatif d'un·e orthophoniste sur un CRBO généré :
 *   - score qualité 1-5
 *   - modifications apportées (texte libre)
 *   - sections modifiées (multi-checkbox)
 *
 * Comportements :
 *   1. Insère systématiquement dans ortho_feedbacks (capture statistique
 *      pour mesurer la qualité produit par profil de test).
 *   2. Si score ≤ 3 ET modifications non vides → copie aussi dans
 *      bilan_references (futur exemple négatif → positif pour few-shot).
 *
 * Body attendu :
 *   {
 *     crbo_id: string (UUID),
 *     qualite_score: 1 | 2 | 3 | 4 | 5,
 *     modifications?: string (≤ 1000 chars),
 *     sections_modifiees?: string[]   // ex ['anamnese', 'diagnostic']
 *   }
 */

const MAX_MODIFICATIONS = 1000
const VALID_SECTIONS = new Set([
  'anamnese',
  'diagnostic',
  'amenagements',
  'observations',
  'autre',
])

export async function POST(request: NextRequest) {
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

  const crboId = typeof body?.crbo_id === 'string' ? body.crbo_id : null
  const qualiteScore = typeof body?.qualite_score === 'number' ? body.qualite_score : null
  const modifications = typeof body?.modifications === 'string' ? body.modifications.trim() : ''
  const sectionsRaw = Array.isArray(body?.sections_modifiees) ? body.sections_modifiees : []
  const sectionsModifiees = sectionsRaw
    .filter((s: any): s is string => typeof s === 'string' && VALID_SECTIONS.has(s))

  if (!crboId || !/^[0-9a-f-]{36}$/i.test(crboId)) {
    return NextResponse.json({ error: 'crbo_id invalide' }, { status: 400 })
  }
  if (!qualiteScore || qualiteScore < 1 || qualiteScore > 5 || !Number.isInteger(qualiteScore)) {
    return NextResponse.json({ error: 'qualite_score doit être un entier entre 1 et 5' }, { status: 400 })
  }
  if (modifications.length > MAX_MODIFICATIONS) {
    return NextResponse.json(
      { error: `Texte trop long (max ${MAX_MODIFICATIONS} caractères)` },
      { status: 400 },
    )
  }

  // ============ Vérification ownership du CRBO ============
  // Évite qu'un user laisse un feedback sur un CRBO qui n'est pas le sien
  // (RLS le bloquerait aussi, mais pre-check = 404 clair).
  const { data: crbo, error: crboErr } = await supabase
    .from('crbos')
    .select('id, structure_json, test_utilise, anamnese, patient_classe')
    .eq('id', crboId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (crboErr) {
    logger.error('feedbacks-crbo-check', crboErr)
    return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
  }
  if (!crbo) {
    return NextResponse.json({ error: 'CRBO introuvable' }, { status: 404 })
  }

  // ============ Insert ortho_feedbacks ============
  const { error: insertErr } = await supabase
    .from('ortho_feedbacks')
    .insert({
      crbo_id: crboId,
      user_id: user.id,
      qualite_score: qualiteScore,
      modifications: modifications || null,
      sections_modifiees: sectionsModifiees.length > 0 ? sectionsModifiees : null,
    })

  if (insertErr) {
    logger.error('feedbacks-insert', insertErr)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
  }

  // ============ Copie vers bilan_references si pertinent ============
  // Condition : score ≤ 3 ET corrections renseignées
  // → ce CRBO a été significativement modifié, on capture le delta comme
  //   exemple d'apprentissage pour le few-shot futur.
  let createdReference = false
  if (qualiteScore <= 3 && modifications.length > 0) {
    try {
      // Test type : on prend le 1er test cité (test_utilise est stocké
      // comme string CSV en DB legacy).
      const firstTest = (crbo.test_utilise ?? '').split(',')[0]?.trim() || 'inconnu'
      const trancheAge = crbo.patient_classe ? `classe ${crbo.patient_classe}` : null
      const structure = crbo.structure_json ?? null
      // Profil_type : best effort, on prend la 1re ligne du diagnostic IA
      // pour avoir une étiquette grossière. Peut être affiné plus tard.
      let profilType: string | null = null
      if (structure?.diagnostic) {
        const firstLine = String(structure.diagnostic).split('\n')[0].trim()
        profilType = firstLine.length > 200 ? firstLine.slice(0, 200) + '…' : firstLine
      }
      // Output IA = le diagnostic + recommandations + commentaires du CRBO
      // tel que stocké dans structure_json (reflète l'output IA après
      // rehydratation et application vocab perso côté front).
      const outputCRBOGenere = structure
        ? [
            structure.anamnese_redigee && `## ANAMNÈSE\n${structure.anamnese_redigee}`,
            structure.diagnostic && `## DIAGNOSTIC\n${structure.diagnostic}`,
            structure.recommandations && `## RECOMMANDATIONS\n${structure.recommandations}`,
          ].filter(Boolean).join('\n\n')
        : ''

      const { error: refErr } = await supabase
        .from('bilan_references')
        .insert({
          test_type: firstTest,
          profil_type: profilType,
          tranche_age: trancheAge,
          input_scores: structure?.domains ?? null,
          input_notes: crbo.anamnese ?? null,
          output_crbo_cible: null, // l'ortho devra remplir si elle veut servir de référence
          output_crbo_genere: outputCRBOGenere || null,
          valide_par: user.email ?? null,
          qualite_score: qualiteScore,
          corrections: modifications,
          user_id: user.id,
        })
      if (refErr) {
        logger.warn('feedbacks-reference-copy', refErr.message)
      } else {
        createdReference = true
      }
    } catch (err) {
      logger.warn('feedbacks-reference-copy-exception', String(err))
    }
  }

  return NextResponse.json({
    success: true,
    referenceCreated: createdReference,
  })
}
