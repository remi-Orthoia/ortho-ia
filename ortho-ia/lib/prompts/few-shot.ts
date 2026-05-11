/**
 * Few-shot injection : récupère 1-2 exemples de bilan_references validés
 * par les orthophonistes (qualite_score >= 4) pour le même test_type +
 * tranche_age, et les formate pour injection en complément du prompt système.
 *
 * Côté serveur uniquement (utilise le service-role pour bypass RLS et lire
 * les références de tous les orthos beta — la base est commune pour le
 * calibrage cross-utilisateur).
 *
 * Si aucun exemple disponible pour le test_type → la fonction renvoie une
 * chaîne vide, le prompt système est utilisé tel quel (pas de dégradation).
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'

interface BilanReference {
  id: string
  test_type: string
  profil_type: string | null
  tranche_age: string | null
  input_scores: any
  input_notes: string | null
  output_crbo_cible: string | null
  output_crbo_genere: string | null
  valide_par: string | null
  qualite_score: number
  corrections: string | null
}

/**
 * Détermine la tranche d'âge clinique pertinente depuis la classe du patient.
 * Les références sont indexées par tranche pour matcher au plus juste.
 */
function classeToTranche(classe?: string | null): string | null {
  if (!classe) return null
  const c = classe.trim().toLowerCase()
  if (['ps', 'ms', 'gs'].includes(c)) return 'maternelle'
  if (['cp', 'ce1', 'ce2'].includes(c)) return 'cycle 2'
  if (['cm1', 'cm2'].includes(c)) return 'cycle 3'
  if (['6ème', '5ème'].includes(c)) return 'collège début'
  if (['4ème', '3ème'].includes(c)) return 'collège fin'
  if (['2nde', '1ère', 'terminale'].includes(c)) return 'lycée'
  if (c === 'adulte') return 'adulte'
  return null
}

/**
 * Récupère jusqu'à `limit` exemples de qualité (≥4) pour le test donné.
 * Stratégie de matching :
 *   1. Match exact test_type + tranche_age
 *   2. Sinon, match test_type seul (toutes tranches)
 *   3. Renvoie tableau vide si rien
 *
 * Trié par qualite_score DESC, created_at DESC (les meilleurs et récents d'abord).
 */
export async function fetchReferenceExamples(opts: {
  test_type: string
  patient_classe?: string | null
  limit?: number
}): Promise<BilanReference[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    // Pas de service role configuré → on ne peut pas requêter cross-user.
    // Plutôt que de chercher silencieusement les seules références de l'user
    // courant (et donc avoir 0 résultat sur les 1ers usages beta), on skip.
    return []
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const limit = opts.limit ?? 2
  const trancheAge = classeToTranche(opts.patient_classe)

  // Tentative 1 : exact test_type + tranche_age
  if (trancheAge) {
    const { data: exact } = await supabase
      .from('bilan_references')
      .select('*')
      .eq('test_type', opts.test_type)
      .eq('tranche_age', trancheAge)
      .gte('qualite_score', 4)
      .order('qualite_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (exact && exact.length > 0) return exact as BilanReference[]
  }

  // Tentative 2 : test_type seul
  const { data: fallback } = await supabase
    .from('bilan_references')
    .select('*')
    .eq('test_type', opts.test_type)
    .gte('qualite_score', 4)
    .order('qualite_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  return (fallback as BilanReference[]) ?? []
}

/**
 * Formate les exemples en bloc texte injectable dans le prompt système.
 * Renvoie '' si la liste est vide → le caller peut toujours concatener sans
 * vérifier (no-op gracieux).
 */
export function formatFewShotBlock(examples: BilanReference[]): string {
  if (!examples || examples.length === 0) return ''
  const sections = examples.map((ex, i) => {
    const lines: string[] = []
    lines.push(`### Exemple ${i + 1} — ${ex.profil_type ?? '(profil non renseigné)'}${ex.valide_par ? ' — validé par ' + ex.valide_par : ''}`)
    if (ex.tranche_age) lines.push(`**Tranche d'âge** : ${ex.tranche_age}`)
    if (ex.input_notes) {
      const truncated = ex.input_notes.length > 600
        ? ex.input_notes.slice(0, 600) + '…'
        : ex.input_notes
      lines.push(`**INPUT (notes anamnèse)** : ${truncated}`)
    }
    if (ex.input_scores) {
      try {
        const summary = summarizeScores(ex.input_scores)
        if (summary) lines.push(`**INPUT (scores résumés)** : ${summary}`)
      } catch {}
    }
    if (ex.output_crbo_cible) {
      const truncated = ex.output_crbo_cible.length > 1500
        ? ex.output_crbo_cible.slice(0, 1500) + '…'
        : ex.output_crbo_cible
      lines.push(`**OUTPUT CIBLE (CRBO de qualité, à imiter en style et structure)** :\n${truncated}`)
    } else if (ex.corrections) {
      // Pas de cible explicite mais on a des corrections → on les utilise
      // comme guide négatif → positif.
      lines.push(`**CORRECTIONS À RETENIR** (l'ortho a modifié ces aspects par rapport au draft IA) :\n${ex.corrections}`)
      if (ex.output_crbo_genere) {
        const truncatedGen = ex.output_crbo_genere.length > 600
          ? ex.output_crbo_genere.slice(0, 600) + '…'
          : ex.output_crbo_genere
        lines.push(`**ANCIEN DRAFT IA (à ne PAS reproduire)** :\n${truncatedGen}`)
      }
    }
    return lines.join('\n')
  })

  return `

---

## EXEMPLES DE RÉFÉRENCE VALIDÉS PAR DES ORTHOPHONISTES

Voici ${examples.length} cas de référence pour ce type de bilan, issus de la base de cas validés par des orthophonistes du réseau Ortho.ia. **Imite leur style, leur structure et leur niveau de détail clinique** — c'est ce que les orthos attendent comme rendu.

${sections.join('\n\n---\n\n')}

---

`
}

/**
 * Résume une structure de scores (input_scores JSONB) en quelques lignes
 * texte pour ne pas explose le prompt avec des centaines de lignes.
 */
function summarizeScores(scores: any): string | null {
  if (!Array.isArray(scores)) return null
  // Format attendu : domains[] avec epreuves[]
  const lines: string[] = []
  for (const d of scores) {
    if (!d?.nom || !Array.isArray(d?.epreuves)) continue
    const epreuvesCount = d.epreuves.length
    const deficitaires = d.epreuves.filter(
      (e: any) => typeof e?.percentile_value === 'number' && e.percentile_value <= 25,
    ).length
    lines.push(`  - ${d.nom} : ${epreuvesCount} épreuves, dont ${deficitaires} en fragilité/difficulté`)
  }
  return lines.length > 0 ? lines.join('\n') : null
}
