import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

/**
 * GET /api/patients/[id]/notes — liste les notes du patient (ordre antéchronologique).
 * POST /api/patients/[id]/notes — crée une note. Body : { body: string }.
 *
 * RLS filtre déjà strictement sur user_id côté DB (cf. supabase-patient-notes.sql).
 * On vérifie aussi côté API pour fail-fast + erreurs claires.
 */

const MAX_BODY_LENGTH = 4000

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  if (!params.id || !/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'ID patient invalide' }, { status: 400 })
  }

  // Vérification d'accès : RLS garantit déjà que l'user ne voit que ses
  // patients, mais on retourne un 404 si pas trouvé pour ne pas leak
  // l'existence d'un patient d'un autre user.
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  }

  const { data: notes, error } = await supabase
    .from('patient_notes')
    .select('id, body, created_at, updated_at')
    .eq('patient_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('patient-notes-list', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des notes' }, { status: 500 })
  }

  return NextResponse.json({ notes: notes ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  if (!params.id || !/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'ID patient invalide' }, { status: 400 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const text = typeof (body as any)?.body === 'string' ? (body as any).body.trim() : ''
  if (!text) return NextResponse.json({ error: 'Texte de la note manquant' }, { status: 400 })
  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Note trop longue (max ${MAX_BODY_LENGTH} caractères)` },
      { status: 400 },
    )
  }

  // Pre-check ownership (la policy RLS le fait aussi mais avec une erreur
  // moins parlante).
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  }

  const { data: created, error } = await supabase
    .from('patient_notes')
    .insert({ patient_id: params.id, user_id: user.id, body: text })
    .select('id, body, created_at, updated_at')
    .single()

  if (error || !created) {
    logger.error('patient-notes-create', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la note' }, { status: 500 })
  }

  return NextResponse.json({ note: created }, { status: 201 })
}
