import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Suppression du compte utilisateur (droit à l'effacement RGPD).
 *
 * Stratégie :
 *  1. Auth : vérifier que la requête provient bien de l'utilisateur connecté.
 *  2. Supprimer toutes les données utilisateur dans les tables (RLS user-owned :
 *     l'utilisateur a le droit de delete ses propres rows). Cascade implicite via
 *     les FK ON DELETE CASCADE quand elles existent.
 *  3. Tenter de supprimer la ligne auth.users via le service role (si disponible)
 *     — sinon le compte auth subsiste mais sans aucune donnée associée. Dans ce cas
 *     on signale au client que le compte doit être supprimé manuellement par
 *     l'admin (cron / job différé).
 *  4. Sign-out la session pour empêcher l'utilisation post-suppression.
 *
 * Cette route n'est pas idempotente côté auth.users : un retry peut échouer si
 * la 1ère tentative a déjà supprimé l'utilisateur.
 */

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }
    const userId = user.id

    // 1) Suppression des données utilisateur (en parallèle — RLS scope chaque
    //    delete par auth.uid()=user_id ou id). Best-effort : on log les erreurs
    //    individuelles mais on ne bloque pas l'effacement final.
    const tables = ['crbos', 'patients', 'medecins', 'subscriptions', 'feedbacks']
    const results = await Promise.allSettled(
      tables.map(async (t) => {
        const { error } = await supabase.from(t).delete().eq('user_id', userId)
        if (error) throw error
      }),
    )
    const failures: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        // Log côté serveur, ne fuit pas le détail au client
        console.error(`[delete-account] échec table ${tables[i]}:`, (r.reason as any)?.message?.slice(0, 200))
        failures.push(tables[i])
      }
    })

    // Le profil utilise `id` comme PK (pas user_id) — delete séparé.
    const { error: profileErr } = await supabase.from('profiles').delete().eq('id', userId)
    if (profileErr) {
      console.error('[delete-account] échec profil:', profileErr.message?.slice(0, 200))
      failures.push('profiles')
    }

    // 2) Tentative de suppression de auth.users via service role (si configuré).
    //    Sans service role, seul un admin manuel peut supprimer la ligne auth.
    let authDeleted = false
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceRoleKey,
          { auth: { persistSession: false } },
        )
        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
        if (deleteErr) {
          console.error('[delete-account] auth.admin.deleteUser error:', deleteErr.message?.slice(0, 200))
        } else {
          authDeleted = true
        }
      } catch (e: any) {
        console.error('[delete-account] admin client error:', e?.message?.slice(0, 200))
      }
    }

    // 3) Sign-out la session (best-effort)
    await supabase.auth.signOut().catch(() => {})

    return NextResponse.json({
      success: true,
      authDeleted,
      // Si la ligne auth subsiste, on indique que l'admin doit finaliser.
      pendingAdminDeletion: !authDeleted,
      tableFailures: failures,
    })
  } catch (error: any) {
    console.error('Erreur suppression compte:', {
      name: error?.name,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte. Contactez le support.' },
      { status: 500 },
    )
  }
}
