import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isDisposableEmail } from '@/lib/disposable-emails'

/**
 * Vérifie si une inscription est autorisée AVANT que le client n'appelle
 * supabase.auth.signUp(). Pas de PII persisté tant qu'on n'a pas le feu vert.
 *
 * Bloque :
 *   - les emails sur domaines jetables connus (mailinator, yopmail, ...)
 *   - une IP qui a déjà créé > 2 comptes en 30 jours
 *
 * Toutes les tentatives bloquées sont loggées dans abuse_signals via RPC
 * SECURITY DEFINER (la table elle-même n'est pas accessible aux clients).
 */

export const maxDuration = 10

const MAX_SIGNUPS_PER_IP_30D = 2

/** Récupère l'IP cliente derrière le proxy Vercel. */
function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    // x-forwarded-for peut contenir une chaîne de proxies — la première IP
    // est celle du client réel.
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') ?? ''
    const supabase = createServerSupabaseClient()

    // 1) Email jetable
    if (isDisposableEmail(email)) {
      await supabase.rpc('log_abuse_signal', {
        p_ip: ip || null,
        p_user_agent: userAgent || null,
        p_email: email,
        p_user_id: null,
        p_event: 'blocked',
        p_reason: 'disposable_email',
      }).then(() => null, () => null)
      return NextResponse.json(
        { error: 'Veuillez utiliser votre adresse email professionnelle.' },
        { status: 400 },
      )
    }

    // 2) Limite IP (best-effort : si la RPC échoue, fail-open pour ne pas
    //    bloquer une vraie inscription en cas de problème côté DB).
    if (ip) {
      const { data: count, error: rpcErr } = await supabase.rpc(
        'count_recent_signups_by_ip',
        { p_ip: ip },
      )
      if (rpcErr) {
        console.error('[precheck-signup] count_recent_signups_by_ip:', rpcErr.message?.slice(0, 200))
      } else if ((count ?? 0) >= MAX_SIGNUPS_PER_IP_30D) {
        await supabase.rpc('log_abuse_signal', {
          p_ip: ip,
          p_user_agent: userAgent || null,
          p_email: email,
          p_user_id: null,
          p_event: 'blocked',
          p_reason: 'ip_rate_limit',
        }).then(() => null, () => null)
        return NextResponse.json(
          { error: 'Limite de comptes atteinte depuis cette adresse. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.' },
          { status: 429 },
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[precheck-signup] erreur:', {
      name: error?.name,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })
    // Fail-open : si notre route plante, on n'empêche pas une inscription légitime.
    return NextResponse.json({ ok: true, degraded: true })
  }
}
