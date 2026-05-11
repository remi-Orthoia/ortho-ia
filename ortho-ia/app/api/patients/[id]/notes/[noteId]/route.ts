import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/patients/[id]/notes/[noteId] — édite le body d'une note.
 * DELETE /api/patients/[id]/notes/[noteId] — supprime la note.
 */

const MAX_BODY_LENGTH = 4000

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  if (!/^[0-9a-f-]{36}$/i.test(params.noteId)) {
    return NextResponse.json({ error: 'ID note invalide' }, { status: 400 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const text = typeof (body as any)?.body === 'string' ? (body as any).body.trim() : ''
  if (!text) return NextResponse.json({ error: 'Texte vide' }, { status: 400 })
  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: `Note trop longue (max ${MAX_BODY_LENGTH} caractères)` }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('patient_notes')
    .update({ body: text })
    .eq('id', params.noteId)
    .eq('user_id', user.id)
    .select('id, body, created_at, updated_at')
    .single()

  if (error || !updated) {
    logger.error('patient-notes-update', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 404 })
  }
  return NextResponse.json({ note: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  if (!/^[0-9a-f-]{36}$/i.test(params.noteId)) {
    return NextResponse.json({ error: 'ID note invalide' }, { status: 400 })
  }

  const { data: deleted, error } = await supabase
    .from('patient_notes')
    .delete()
    .eq('id', params.noteId)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    logger.error('patient-notes-delete', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
