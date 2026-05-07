import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Enregistre le fingerprint d'inscription (IP + user agent + timestamp) sur
 * le profile, après que supabase.auth.signUp() + l'insertion du profile aient
 * réussi côté client. Le client ne peut pas écrire sa propre IP : seule cette
 * route serveur peut la lire depuis les en-têtes du proxy.
 *
 * Loggue aussi un événement 'signup' dans abuse_signals.
 *
 * Best-effort : si quelque chose échoue, on ne casse pas le flux d'inscription.
 */

export const maxDuration = 10

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') ?? ''

    // Met à jour le profile avec le fingerprint d'inscription. Idempotent —
    // si la route est rappelée, on écrase. RLS : l'utilisateur peut update son
    // propre profile.
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        signup_ip: ip || null,
        signup_user_agent: userAgent || null,
        signup_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateErr) {
      console.error('[finalize-signup] profile update:', updateErr.message?.slice(0, 200))
    }

    // Log abuse_signals (event = 'signup'). Sert de trace pour audit.
    await supabase.rpc('log_abuse_signal', {
      p_ip: ip || null,
      p_user_agent: userAgent || null,
      p_email: user.email ?? null,
      p_user_id: user.id,
      p_event: 'signup',
      p_reason: null,
    }).then(() => null, () => null)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[finalize-signup] erreur:', {
      name: error?.name,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })
    return NextResponse.json({ ok: true, degraded: true })
  }
}
