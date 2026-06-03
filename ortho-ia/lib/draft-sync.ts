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

/** Aperçu d'un brouillon enrichi pour l'affichage en liste (Historique).
 *  Couvre les 3 kinds (langage / math-b-cm / math-b-cmado). */
export interface DraftListItem {
  kind: DraftKind
  step: number
  updatedAt: string
  /** Prénom du patient extrait du data du draft (peut être vide si l'ortho
   *  n'a pas encore rempli l'étape 1). */
  patientPrenom: string
  patientNom: string
  /** Date de naissance et classe si renseignées dans le draft, pour matcher
   *  le rendu de l'historique. */
  patientDdn?: string
  patientClasse?: string
  /** Test/grille utilisé (Exalang 8-11 / B-CM / B-CMado / etc.). Pour les
   *  drafts langage, valeur extraite de data.formData.test_utilise (string
   *  ou array). Pour math, dérivée du kind. */
  testUtilise: string
  /** URL de reprise selon le kind. */
  href: string
}

/**
 * Liste TOUS les brouillons d'un user (les 3 kinds) avec métadonnées
 * extraites du payload data — pour affichage dans la page Historique
 * à côté des CRBO finalisés.
 * Best-effort : retourne [] si la DB est inaccessible.
 */
export async function listDraftsForUser(userId: string): Promise<DraftListItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('crbo_drafts')
      .select('kind, data, step, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error || !data) return []
    return data.map((row): DraftListItem => {
      const kind = row.kind as DraftKind
      const d = (row.data as any) ?? {}
      // Extraction patient : structure différente entre langage et math.
      // - Langage : data.formData.patient_prenom + .patient_nom + .patient_ddn + .patient_classe
      //             + data.formData.test_utilise (string ou array).
      // - Math    : data.patient.prenom + .patient.nom + .patient.date_naissance + .patient.classe
      //             + grille déduite du kind (b-cm → B-CM, b-cmado → B-CMado).
      let patientPrenom = ''
      let patientNom = ''
      let patientDdn: string | undefined
      let patientClasse: string | undefined
      let testUtilise = ''
      let href = '/dashboard/nouveau-crbo'
      if (kind === 'langage') {
        const fd = d.formData ?? {}
        patientPrenom = (fd.patient_prenom ?? '').toString().trim()
        patientNom = (fd.patient_nom ?? '').toString().trim()
        patientDdn = fd.patient_ddn || undefined
        patientClasse = fd.patient_classe || undefined
        const tests = fd.test_utilise
        if (Array.isArray(tests)) testUtilise = tests.filter(Boolean).join(', ')
        else if (typeof tests === 'string') testUtilise = tests
        href = '/dashboard/nouveau-crbo?reprendre=1'
      } else if (kind === 'math-b-cm' || kind === 'math-b-cmado') {
        const p = d.patient ?? {}
        patientPrenom = (p.prenom ?? '').toString().trim()
        patientNom = (p.nom ?? '').toString().trim()
        patientDdn = p.date_naissance || undefined
        patientClasse = p.classe || undefined
        testUtilise = kind === 'math-b-cm' ? 'B-CM' : 'B-CMado'
        href = kind === 'math-b-cm' ? '/dashboard/bilan/b-cm' : '/dashboard/bilan/b-cmado'
      }
      return {
        kind,
        step: typeof row.step === 'number' ? row.step : 0,
        updatedAt: row.updated_at as string,
        patientPrenom,
        patientNom,
        patientDdn,
        patientClasse,
        testUtilise,
        href,
      }
    })
  } catch (err: any) {
    console.warn('[draft-sync] list error:', err?.message?.slice(0, 200))
    return []
  }
}
