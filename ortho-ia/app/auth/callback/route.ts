import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Callback OAuth/email Supabase (PKCE flow).
 *
 * Supabase envoie l'utilisatrice ici apres :
 *   - confirmation de l'email d'inscription (lien dans le mail de bienvenue)
 *   - magic link / OTP (si on en ajoute un jour)
 *
 * L'URL contient `?code=...` ou `?error_description=...`. On echange le code
 * contre une session puis on redirige vers /dashboard avec un flag confirmed=1
 * pour declencher le toast de bienvenue (et /auth/login si echec).
 *
 * IMPORTANT : cette route DOIT etre configuree comme Redirect URL dans le
 * Supabase Dashboard (Auth → URL Configuration → Redirect URLs) :
 *   https://ortho-ia.vercel.app/auth/callback
 *   https://ortho-ia.com/auth/callback (si domaine custom)
 *   http://localhost:3000/auth/callback (dev local)
 *
 * Sinon Supabase refuse de rediriger l'utilisatrice ici apres confirmation.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const errorDescription = url.searchParams.get('error_description')
  // `next` permet de rediriger ailleurs si fourni (par exemple si on a un
  // jour des magic links vers une page specifique). Defaut : dashboard.
  const next = url.searchParams.get('next') || '/dashboard?confirmed=1'

  // Cas erreur : Supabase nous renvoie ici avec un message d'erreur en clair
  // (lien expire, deja consomme, etc.). On dirige vers login avec un message.
  if (errorDescription) {
    const loginUrl = new URL('/auth/login', url.origin)
    loginUrl.searchParams.set('error', errorDescription.slice(0, 200))
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    // Pas de code, pas d'erreur explicite : on retombe sur la home (acces direct
    // a /auth/callback sans parametre n'a pas de sens utilisateur).
    return NextResponse.redirect(new URL('/auth/login', url.origin))
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession:', error.message?.slice(0, 200))
    const loginUrl = new URL('/auth/login', url.origin)
    loginUrl.searchParams.set('error', 'Le lien de confirmation est invalide ou a deja ete utilise.')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
