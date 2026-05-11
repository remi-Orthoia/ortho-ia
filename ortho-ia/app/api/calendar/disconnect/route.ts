import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { disconnectUser, isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { logger } from '@/lib/logger'

/**
 * POST /api/calendar/disconnect
 * Révoque le token Google de l'utilisateur·rice et supprime la ligne en DB.
 */
export async function POST(_request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ success: true, alreadyDisconnected: true })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  try {
    await disconnectUser(user.id)
  } catch (err) {
    logger.error('calendar-disconnect', err)
    return NextResponse.json({ error: 'Erreur lors de la déconnexion' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
