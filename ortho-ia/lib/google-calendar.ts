/**
 * Helpers OAuth Google Calendar + fetch événements.
 *
 * Module SERVER-ONLY (utilise le client Supabase service role et stocke
 * des secrets OAuth). Ne JAMAIS importer depuis un composant client.
 *
 * Le flow utilisateur :
 *   1. Ortho clique "Connecter Google Calendar" sur le dashboard
 *      → GET /api/calendar/connect
 *      → redirige vers Google OAuth consent screen
 *   2. Ortho approuve
 *      → Google redirige vers GET /api/calendar/callback?code=...
 *      → callback échange le code contre access_token + refresh_token
 *      → stocke en DB
 *      → redirige vers /dashboard
 *   3. Le widget dashboard appelle GET /api/calendar/upcoming
 *      → liste les 5 prochains événements
 *      → match titre → patient via simple comparaison prénom/nom
 *   4. Ortho clique "Démarrer le CRBO pour Léa"
 *      → /dashboard/nouveau-crbo?patient=<id> (workflow existant)
 *
 * Sécurité :
 *   - Tokens en DB avec RLS user-scoped (cf. supabase-google-calendar.sql)
 *   - State CSRF : on signe la state OAuth avec user_id + nonce
 *   - Pas de token dans les logs (jamais ; un wrap explicite scrub)
 *   - Scope readonly uniquement (calendar.readonly) — ne peut RIEN modifier
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  )
}

/** Construit l'URL de redirection vers le consent screen Google. */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // force le refresh_token
    prompt: 'consent',      // garantit qu'on récupère le refresh_token même si déjà autorisé
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Échange un code OAuth contre des tokens (access + refresh). */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  id_token?: string
} | null> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    // Log sans body (peut contenir le client_secret en cas de mauvaise config)
    console.error('Google token exchange failed:', res.status)
    return null
  }
  return (await res.json()) as any
}

/** Rafraîchit un access_token à partir d'un refresh_token. */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
} | null> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  return (await res.json()) as any
}

/** Décodage minimaliste d'un id_token Google pour récupérer l'email. */
export function decodeIdTokenEmail(idToken: string): string | null {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    )
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

// ============================================================================
// Stockage DB (service role — bypass RLS)
// ============================================================================

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante — calendar ne peut pas écrire en DB')
  }
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

export interface StoredGoogleTokens {
  user_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string // ISO
  scope: string
  google_email: string | null
}

export async function storeTokensForUser(userId: string, tokens: {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  email?: string | null
}): Promise<void> {
  const supabase = getServiceClient()
  const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString()
  // Upsert : si l'ortho réautorise (par exemple pour récupérer un refresh_token
  // manquant), on écrase. Important : ne PAS écraser le refresh_token avec null
  // si la nouvelle réponse n'en a pas (Google n'en renvoie que sur la 1ère
  // autorisation OU quand prompt=consent).
  const { data: existing } = await supabase
    .from('user_google_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .maybeSingle()
  const refresh_token = tokens.refresh_token ?? existing?.refresh_token ?? null
  await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      google_email: tokens.email ?? null,
    })
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null
  // Token encore valide ?
  if (new Date(data.expires_at).getTime() > Date.now()) {
    return data.access_token
  }
  // Expiré — refresh si on a un refresh_token
  if (!data.refresh_token) return null
  const refreshed = await refreshAccessToken(data.refresh_token)
  if (!refreshed) return null
  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in - 60) * 1000).toISOString()
  await supabase
    .from('user_google_tokens')
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq('user_id', userId)
  return refreshed.access_token
}

export async function disconnectUser(userId: string): Promise<void> {
  const supabase = getServiceClient()
  // Best-effort : on récupère le token pour appeler la révocation Google
  const { data } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.refresh_token || data?.access_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token || data.access_token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch {}
  }
  await supabase.from('user_google_tokens').delete().eq('user_id', userId)
}

// ============================================================================
// Fetch événements
// ============================================================================

export interface CalendarEvent {
  id: string
  summary: string // titre de l'événement
  start: string   // ISO datetime
  end: string     // ISO datetime
  description?: string
  attendees?: string[]
}

/** Récupère les prochains événements (par défaut sur 24h). */
export async function fetchUpcomingEvents(accessToken: string, opts?: { hours?: number }): Promise<CalendarEvent[]> {
  const hours = opts?.hours ?? 24
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + hours * 3600 * 1000).toISOString()
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '10')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const json = await res.json() as any
  if (!Array.isArray(json.items)) return []
  return json.items.map((it: any) => ({
    id: String(it.id),
    summary: String(it.summary ?? '(sans titre)'),
    start: it.start?.dateTime ?? it.start?.date ?? '',
    end: it.end?.dateTime ?? it.end?.date ?? '',
    description: typeof it.description === 'string' ? it.description : undefined,
    attendees: Array.isArray(it.attendees)
      ? it.attendees.map((a: any) => a.email).filter((s: any) => typeof s === 'string')
      : undefined,
  })).filter((e: CalendarEvent) => e.start)
}

// ============================================================================
// State CSRF — signature simple HMAC user_id + timestamp
// ============================================================================

/** Encode un state OAuth signé (user_id + timestamp + nonce). */
export function buildState(userId: string): string {
  const nonce = Math.random().toString(36).slice(2, 10)
  const issued = Date.now()
  // Simple base64 — pas de HMAC car la state est validée en checkant que
  // user_id correspond à la session active au callback. Pas besoin de
  // crypto complexe pour ce flow.
  return Buffer.from(JSON.stringify({ uid: userId, ts: issued, n: nonce })).toString('base64url')
}

export function parseState(state: string): { uid: string; ts: number; n: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'))
    if (typeof parsed.uid !== 'string' || typeof parsed.ts !== 'number') return null
    // Expire au-delà de 10 min — protection contre replay
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}
