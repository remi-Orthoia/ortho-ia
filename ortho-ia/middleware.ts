import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware auth : protège toutes les routes /dashboard/* et /api/generate-crbo*.
 *
 * Fait deux choses :
 *  1. Refresh du JWT Supabase si expiré (cookies mis à jour dans la réponse).
 *  2. Redirection vers /auth/login si pas de session valide sur une route protégée.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  // getUser() peut throw si Supabase est injoignable (réseau, panne, DNS).
  // Sans try/catch, l'utilisatrice voit une 500 sans message clair. On retombe
  // sur "pas de user" → comportement identique à une session expirée
  // (redirect login pour /dashboard, JSON 401 pour /api/*).
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error('[middleware] supabase.auth.getUser failed:', (err as any)?.message?.slice?.(0, 200))
  }

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isApiProtected =
    pathname.startsWith('/api/generate-crbo') ||
    pathname.startsWith('/api/extract-pdf') ||
    pathname.startsWith('/api/transcribe') ||
    pathname.startsWith('/api/account/') ||
    // /api/calendar/upcoming + /api/calendar/disconnect doivent être auth.
    // /api/calendar/connect aussi, mais on laisse le matcher attraper tout
    // /api/calendar/* (le callback OAuth a sa propre validation par state).
    pathname.startsWith('/api/calendar/') ||
    pathname.startsWith('/api/patients/')
  // Pages /dev/* : outils internes — bloquées en prod, accessibles en dev local
  const isDevRoute = pathname.startsWith('/dev')
  const isProd = process.env.NODE_ENV === 'production'

  if (isDevRoute && isProd && !user) {
    // En prod, /dev/* exige auth. En local dev, accès libre pour itération rapide.
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if ((isDashboard || isApiProtected) && !user) {
    // Pour les routes API : 401 JSON propre (le frontend fait response.json()
    // et un 307 vers /auth/login renvoie du HTML qui crashe le parser).
    if (isApiProtected) {
      return NextResponse.json(
        { error: 'Session expirée. Reconnectez-vous pour continuer.' },
        { status: 401 },
      )
    }
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/generate-crbo/:path*',
    '/api/extract-pdf/:path*',
    '/api/transcribe/:path*',
    '/api/account/:path*',
    '/api/calendar/:path*',
    '/api/patients/:path*',
    '/dev/:path*',
  ],
}
