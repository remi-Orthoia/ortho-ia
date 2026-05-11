import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

const MAX_BODY = 10_000
const VALID_CATEGORIES = ['observation', 'idee', 'rappel', 'formation', 'autre'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const patch: Record<string, unknown> = {}
  const text = (body as any)?.body
  if (typeof text === 'string') {
    const trimmed = text.trim()
    if (!trimmed) return NextResponse.json({ error: 'Contenu vide' }, { status: 400 })
    if (trimmed.length > MAX_BODY) return NextResponse.json({ error: `Trop long (max ${MAX_BODY})` }, { status: 400 })
    patch.body = trimmed
  }
  const cat = (body as any)?.category
  if (cat === null) {
    patch.category = null
  } else if (typeof cat === 'string' && (VALID_CATEGORIES as readonly string[]).includes(cat)) {
    patch.category = cat
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('session_journal')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, body, category, created_at, updated_at')
    .single()

  if (error || !updated) {
    logger.error('journal-update', error)
    return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 404 })
  }
  return NextResponse.json({ entry: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  const { data: deleted, error } = await supabase
    .from('session_journal')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    logger.error('journal-delete', error)
    return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 })
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
