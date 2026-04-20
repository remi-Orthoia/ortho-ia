import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Endpoint public (pas d'auth requis) pour afficher les stats agrégées
 * sur la landing — nombre de CRBO générés ce mois, total, etc.
 *
 * N'expose aucune donnée patient ni personnelle — uniquement des compteurs.
 * Réponse cachée 5 min côté edge (via Cache-Control) pour éviter de spammer
 * Supabase depuis la landing.
 */

export const revalidate = 300 // Next.js : re-génère la réponse toutes les 5 min

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Appelle une RPC SECURITY DEFINER qui contourne RLS
    // (sinon anon voit 0 CRBO à cause du Row-Level Security)
    const { data, error } = await supabase.rpc('get_public_stats')

    if (error) {
      console.error('stats rpc error', error)
      return NextResponse.json({ this_month: 0, total: 0 })
    }

    const row = Array.isArray(data) && data.length > 0 ? data[0] : null
    return NextResponse.json(
      {
        this_month: Number(row?.this_month ?? 0),
        total: Number(row?.total ?? 0),
      },
      {
        headers: {
          // CDN cache 5 min, stale-while-revalidate 10 min
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('Erreur /api/stats:', error)
    return NextResponse.json(
      { this_month: 0, total: 0 },
      { status: 200 }, // Dégradation silencieuse sur la landing
    )
  }
}
