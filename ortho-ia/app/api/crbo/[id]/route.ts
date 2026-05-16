import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * PATCH /api/crbo/:id
 *
 * Sauvegarde partielle d'un CRBO depuis la page de prévisualisation. L'ortho
 * édite les sections une par une (auto-save debounced) et chaque modification
 * arrive ici via ce endpoint.
 *
 * Body : { updates: Record<string, any> }
 *   Les clés sont des CHEMINS DOT-PATH dans `structure_json` :
 *     - "anamnese_redigee"             → string (markdown bold autorisé)
 *     - "motif_reformule"              → string
 *     - "points_forts"                 → string
 *     - "difficultes_identifiees"      → string
 *     - "diagnostic"                   → string
 *     - "recommandations"              → string
 *     - "axes_therapeutiques"          → string
 *     - "conclusion"                   → string
 *     - "pap_suggestions"              → string[]
 *     - "comorbidites_detectees"       → string[]
 *     - "synthese_evolution.resume"    → string
 *     - "domains.{i}.commentaire"      → string  (commentaire d'un domaine)
 *     - "domains.{i}.epreuves.{j}.commentaire" → string (MoCA / PREDIMEM)
 *
 * Réponse : { structure: CRBOStructure } — la structure complète après merge.
 *
 * Sécurité : RLS + check explicite user_id. Whitelist stricte des chemins
 * éditables pour empêcher l'écriture de champs non prévus (severite_globale,
 * domains[].epreuves[].percentile_value, etc. — qui doivent rester immutables
 * pour ne pas corrompre l'historique clinique).
 */

const EDITABLE_LEAF_FIELDS = new Set([
  'anamnese_redigee',
  'motif_reformule',
  'points_forts',
  'difficultes_identifiees',
  'diagnostic',
  'recommandations',
  'axes_therapeutiques',
  'conclusion',
  'pap_suggestions',
  'comorbidites_detectees',
])

/** Reconnaît les chemins éditables (root + nested). Retourne true si OK. */
function isEditablePath(path: string): boolean {
  if (EDITABLE_LEAF_FIELDS.has(path)) return true
  if (path === 'synthese_evolution.resume') return true
  // domains.{i}.commentaire
  if (/^domains\.\d+\.commentaire$/.test(path)) return true
  // domains.{i}.epreuves.{j}.commentaire (MoCA / PREDIMEM)
  if (/^domains\.\d+\.epreuves\.\d+\.commentaire$/.test(path)) return true
  return false
}

/** Pose `value` au chemin `path` dans `obj`. Mutates et retourne `obj`.
 *  Crée les sous-objets manquants si nécessaire (synthese_evolution: {} → { resume: "..." }). */
function setByPath(obj: any, path: string, value: any): any {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (!(k in cur) || cur[k] == null || typeof cur[k] !== 'object') {
      // Si le segment suivant est un index numérique, on crée un tableau ; sinon un objet.
      const nextIsIndex = /^\d+$/.test(parts[i + 1])
      cur[k] = nextIsIndex ? [] : {}
    }
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
  return obj
}

export async function PATCH(
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

  const updates = body?.updates
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return NextResponse.json(
      { error: 'Body attendu : { updates: { path: value, ... } }' },
      { status: 400 },
    )
  }

  // Whitelist : chaque clé doit être un chemin éditable.
  for (const path of Object.keys(updates)) {
    if (!isEditablePath(path)) {
      return NextResponse.json(
        { error: `Chemin non éditable : ${path}` },
        { status: 400 },
      )
    }
  }

  // Charge le CRBO actuel + check ownership.
  const { data: crbo, error: fetchError } = await supabase
    .from('crbos')
    .select('id, user_id, structure_json')
    .eq('id', params.id)
    .single()

  if (fetchError || !crbo) {
    return NextResponse.json({ error: 'CRBO introuvable' }, { status: 404 })
  }
  if (crbo.user_id !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Merge des updates dans la structure.
  const structure = crbo.structure_json ? JSON.parse(JSON.stringify(crbo.structure_json)) : {}
  for (const [path, value] of Object.entries(updates)) {
    setByPath(structure, path, value)
  }

  // Persiste.
  const { error: updateError } = await supabase
    .from('crbos')
    .update({ structure_json: structure })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('PATCH crbo update failed:', updateError)
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ structure })
}
