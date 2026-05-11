import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildAuthUrl, buildState, isGoogleCalendarConfigured } from '@/lib/google-calendar'

/**
 * GET /api/calendar/connect — démarre le flow OAuth Google Calendar.
 * Redirige l'utilisateur vers le consent screen Google.
 */
export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Intégration Google Calendar non configurée côté serveur.' },
      { status: 503 },
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const state = buildState(user.id)
  return NextResponse.redirect(buildAuthUrl(state))
}
