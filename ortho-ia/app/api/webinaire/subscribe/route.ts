import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/webinaire/subscribe
 *
 * Inscription publique au webinaire de lancement Ortho.ia (début juillet 2026).
 * Pas d'authentification requise — la landing /webinaire est ouverte à toutes
 * les orthophonistes libérales.
 *
 * Body :
 *   { prenom: string, email: string, ville?: string }
 *
 * Réponse :
 *   200 { success: true, alreadyRegistered?: boolean }
 *   400 { error: string } — validation
 *   500 { error: string } — erreur serveur
 *
 * Sécurité :
 *  - Validation format email côté serveur (en plus du client)
 *  - Utilise la service_role pour bypass RLS (RLS empêche le SELECT anon mais
 *    autorise l'INSERT — on insère, on ne lit pas en retour)
 *  - Si l'email existe déjà : on renvoie alreadyRegistered=true (UX gentille,
 *    pas d'erreur frontale)
 */

export const maxDuration = 30

/** Validation basique d'email — pattern usuel, on n'a pas besoin d'être strict. */
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const prenom = typeof body?.prenom === 'string' ? body.prenom.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const ville = typeof body?.ville === 'string' ? body.ville.trim() : ''

  if (!prenom) {
    return NextResponse.json({ error: 'Merci d\'indiquer votre prénom.' }, { status: 400 })
  }
  if (prenom.length > 80) {
    return NextResponse.json({ error: 'Le prénom est trop long.' }, { status: 400 })
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Merci d\'indiquer un email professionnel valide.' },
      { status: 400 },
    )
  }
  if (email.length > 200 || ville.length > 100) {
    return NextResponse.json({ error: 'Champs trop longs.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    // Fallback : on accepte l'inscription côté anon-key si SERVICE_ROLE_KEY
    // n'est pas configurée. La RLS autorise l'INSERT public donc ça marche.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Service indisponible côté serveur.' },
        { status: 500 },
      )
    }
    const sb = createClient(supabaseUrl, anonKey)
    const { error } = await sb
      .from('webinaire_inscriptions')
      .insert({ prenom, email, ville: ville || null })
    if (error) {
      if (error.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ success: true, alreadyRegistered: true })
      }
      console.error('webinaire-subscribe (anon) error:', error.message)
      return NextResponse.json(
        { error: 'Une erreur est survenue. Réessayez ou écrivez à contact@ortho-ia.fr' },
        { status: 500 },
      )
    }
    return NextResponse.json({ success: true })
  }

  // Chemin nominal : service_role bypass RLS (utile si on durcit la policy plus tard).
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await sb
    .from('webinaire_inscriptions')
    .insert({ prenom, email, ville: ville || null })

  if (error) {
    if (error.message?.toLowerCase().includes('duplicate')) {
      return NextResponse.json({ success: true, alreadyRegistered: true })
    }
    console.error('webinaire-subscribe error:', error.message)
    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessayez ou écrivez à contact@ortho-ia.fr' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
