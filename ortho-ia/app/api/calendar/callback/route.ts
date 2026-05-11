import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  exchangeCodeForTokens,
  storeTokensForUser,
  parseState,
  decodeIdTokenEmail,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar'
import { logger } from '@/lib/logger'

/**
 * GET /api/calendar/callback?code=...&state=...
 * Réception du callback OAuth Google après autorisation.
 * Échange le code contre des tokens, stocke en DB, redirige vers /dashboard.
 */
export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Intégration Google Calendar non configurée côté serveur.' },
      { status: 503 },
    )
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const errorParam = request.nextUrl.searchParams.get('error')

  // L'utilisateur·rice a refusé l'autorisation
  if (errorParam) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = '?calendar=denied'
    return NextResponse.redirect(url)
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Paramètres OAuth manquants' }, { status: 400 })
  }

  const parsedState = parseState(state)
  if (!parsedState) {
    return NextResponse.json({ error: 'State OAuth invalide ou expirée' }, { status: 400 })
  }

  // Vérification : le user authentifié doit être celui qui a démarré le flow.
  // Évite qu'un attaquant utilise un state intercepté pour lier son compte Google
  // à la session d'une victime.
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== parsedState.uid) {
    return NextResponse.json({ error: 'Session non concordante' }, { status: 403 })
  }

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens) {
    logger.error('calendar-callback', new Error('exchangeCodeForTokens returned null'))
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = '?calendar=error'
    return NextResponse.redirect(url)
  }

  const email = tokens.id_token ? decodeIdTokenEmail(tokens.id_token) : null

  try {
    await storeTokensForUser(user.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      email,
    })
  } catch (err) {
    logger.error('calendar-callback-store', err)
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = '?calendar=storage_error'
    return NextResponse.redirect(url)
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/dashboard'
  redirectUrl.search = '?calendar=connected'
  return NextResponse.redirect(redirectUrl)
}
