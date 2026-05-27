import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email/send'
import { renderBetaWelcome } from '@/lib/email-templates/beta-welcome'

/**
 * Enregistre le fingerprint d'inscription (IP + user agent + timestamp) sur
 * le profile, après que supabase.auth.signUp() + l'insertion du profile aient
 * réussi côté client. Le client ne peut pas écrire sa propre IP : seule cette
 * route serveur peut la lire depuis les en-têtes du proxy.
 *
 * Loggue aussi un événement 'signup' dans abuse_signals.
 *
 * Envoie l'email de bienvenue Ortho.ia (template beta-welcome) via Resend si
 * RESEND_API_KEY est configurée. Best-effort : si l'envoi echoue (clé absente,
 * Resend en panne, etc.), le signup réussit quand même — l'email n'est jamais
 * bloquant.
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

    // Email de bienvenue Ortho.ia — non bloquant. Si l'envoi échoue (clé
    // Resend absente, domaine non vérifié, etc.) le signup réussit quand
    // même. On lit le prénom depuis le profile (vient d'être inséré côté
    // client juste avant cet appel).
    if (user.email) {
      try {
        const { data: freshProf } = await supabase
          .from('profiles')
          .select('prenom')
          .eq('id', user.id)
          .single()
        const prenom = (freshProf?.prenom?.trim() || user.email.split('@')[0] || 'là').trim()
        // URL de login absolue : on utilise l'origin du request pour rester
        // cohérent entre prod (ortho-ia.com), preview Vercel et dev local.
        const origin = request.headers.get('origin')
          ?? process.env.NEXT_PUBLIC_APP_URL
          ?? 'https://ortho-ia.vercel.app'
        const loginUrl = `${origin}/auth/login`
        const { subject, html, text } = renderBetaWelcome({
          prenom,
          loginUrl,
          siteUrl: origin,
        })
        // Fire-and-forget : on n'attend pas le résultat pour répondre à
        // l'utilisateur. L'envoi log lui-même son succès/échec côté serveur.
        sendEmail({ to: user.email, subject, html, text }).catch(() => null)
      } catch (mailErr: any) {
        console.error('[finalize-signup] preparation email:', mailErr?.message?.slice(0, 200))
      }
    }

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
