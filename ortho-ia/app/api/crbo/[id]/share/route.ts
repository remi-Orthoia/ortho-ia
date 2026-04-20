import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Crée un lien de partage temporaire (24h) pour un CRBO.
 * POST /api/crbo/:id/share → { token, url, expires_at }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  // Vérifie que le CRBO appartient bien à l'user (RLS le ferait aussi, mais on est explicite)
  const { data: crbo, error: crboError } = await supabase
    .from('crbos')
    .select('id, user_id')
    .eq('id', params.id)
    .single()

  if (crboError || !crbo || crbo.user_id !== user.id) {
    return NextResponse.json({ error: 'CRBO introuvable' }, { status: 404 })
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('crbo_share_links')
    .insert({
      crbo_id: params.id,
      user_id: user.id,
      expires_at: expiresAt,
    })
    .select('token, expires_at')
    .single()

  if (error || !data) {
    console.error('Erreur création share link:', error)
    return NextResponse.json({ error: 'Erreur création lien' }, { status: 500 })
  }

  // Construire l'URL publique — host dérivé de la requête
  const host = _request.headers.get('host') ?? ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/share/${data.token}`

  return NextResponse.json({
    token: data.token,
    url,
    expires_at: data.expires_at,
  })
}
