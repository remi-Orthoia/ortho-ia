'use client'

/**
 * Sync des brouillons CRBO entre localStorage (rapide, offline OK) et la
 * table Supabase `crbo_drafts` (filet de sécurité multi-device + cache vidé).
 *
 * Architecture :
 *  - localStorage reste la source PRIMAIRE pour l'auto-save (debounce 15s,
 *    synchrone, pas de latence réseau).
 *  - Supabase est mise à jour en BACKGROUND à chaque save local (upsert
 *    sur la contrainte unique user_id + kind). Si la DB est down, on
 *    log silencieusement et on continue — le localStorage tient seul.
 *  - Au mount du formulaire, on choisit la version la PLUS RÉCENTE entre
 *    localStorage et DB (compare savedAt / updated_at). Permet à l'ortho
 *    qui change d'appareil de récupérer son travail.
 *
 * Sécurité :
 *  - Toutes les opérations sont scopées par auth.uid() via RLS Supabase.
 *  - Une ortho ne peut JAMAIS lire/écrire le draft d'un autre user.
 *  - Le champ user_id de la table est rempli côté client mais RLS le
 *    valide côté serveur (WITH CHECK = auth.uid()).
 *
 * Best-effort :
 *  - Tous les appels DB sont try/catch silencieux. Si la table n'existe
 *    pas / la session expire / le réseau coupe, on retombe sur localStorage
 *    pur. L'ortho n'est jamais bloquée par un échec de sync DB.
 */

import { createClient } from '@/lib/supabase'

export type DraftKind = 'langage' | 'math-b-cm' | 'math-b-cmado'

export interface DraftDbPayload<T = unknown> {
  data: T
  /** Step courant du wizard (1-4 pour langage, 0 pour math). */
  step: number
  /** ISO timestamp de l'update DB (côté serveur via trigger). */
  updatedAt: string
}

/**
 * Upsert le draft en DB (insert si pas existant, update sinon). Scopée par
 * user.id + kind via contrainte UNIQUE. Best-effort : ne lève jamais
 * d'erreur, retourne true/false pour logging optionnel côté caller.
 */
export async function saveDraftToDb<T>(
  userId: string,
  kind: DraftKind,
  data: T,
  step: number = 0,
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('crbo_drafts')
      .upsert(
        {
          user_id: userId,
          kind,
          data: data as any,
          step,
        },
        { onConflict: 'user_id,kind' },
      )
    if (error) {
      // Log silencieux — la DB est en panne ou la table manque. Le
      // localStorage assure le filet seul pour cette session.
      console.warn('[draft-sync] upsert failed:', error.message?.slice(0, 200))
      return false
    }
    return true
  } catch (err: any) {
    console.warn('[draft-sync] upsert error:', err?.message?.slice(0, 200))
    return false
  }
}

/**
 * Charge le draft DB pour ce user + kind. Retourne null si :
 *  - aucun draft trouvé (premier formulaire ou draft purgé)
 *  - erreur réseau / table absente
 *  - session expirée
 */
export async function loadDraftFromDb<T>(
  userId: string,
  kind: DraftKind,
): Promise<DraftDbPayload<T> | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('crbo_drafts')
      .select('data, step, updated_at')
      .eq('user_id', userId)
      .eq('kind', kind)
      .maybeSingle()
    if (error || !data) return null
    return {
      data: data.data as T,
      step: typeof data.step === 'number' ? data.step : 0,
      updatedAt: data.updated_at as string,
    }
  } catch (err: any) {
    console.warn('[draft-sync] load error:', err?.message?.slice(0, 200))
    return null
  }
}

/**
 * Supprime le draft DB (après finalisation du CRBO ou suppression manuelle).
 * Best-effort : si l'appel échoue, le draft DB sera nettoyé par la purge
 * TTL mensuelle.
 */
export async function deleteDraftFromDb(
  userId: string,
  kind: DraftKind,
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('crbo_drafts')
      .delete()
      .eq('user_id', userId)
      .eq('kind', kind)
    return !error
  } catch {
    return false
  }
}

/**
 * Helper : compare timestamp DB vs timestamp localStorage pour décider
 * lequel charger au mount. Retourne 'db' si la DB est plus récente (ortho
 * a changé d'appareil), 'local' sinon (ou si DB absente).
 */
export function pickFreshestSource(
  localSavedAt: number | null,
  dbUpdatedAt: string | null,
): 'db' | 'local' {
  if (!dbUpdatedAt) return 'local'
  if (!localSavedAt) return 'db'
  const dbMs = new Date(dbUpdatedAt).getTime()
  return dbMs > localSavedAt ? 'db' : 'local'
}
