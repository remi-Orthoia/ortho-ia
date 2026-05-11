/**
 * Vocabulaire perso — dictionnaire de substitutions textuelles appliqué
 * APRÈS génération IA et AVANT export Word.
 *
 * Cas d'usage : chaque ortho a ses préférences lexicales. L'une dit
 * toujours "enfant", jamais "patient". L'autre dit "décodage" et pas
 * "voie d'assemblage". L'IA propose une formulation neutre, ce module
 * la réécrit selon le style de l'ortho avant d'envoyer dans le Word.
 *
 * Stockage : localStorage (V1 beta). Migration trivial vers DB plus tard.
 * Indépendant des snippets : les snippets injectent à la frappe, le
 * vocabulaire perso ré-écrit en post-process le brouillon IA.
 *
 * Application : sur les champs narratifs uniquement (anamnèse, diagnostic,
 * recommandations, commentaires de domaine, points_forts, difficultés).
 * Ne touche PAS les noms d'épreuves, scores, médecin, etc. — données
 * structurelles à préserver.
 */

const STORAGE_KEY = 'orthoia.vocab-perso'
const EVENT = 'orthoia:vocab-changed'

export interface VocabRule {
  id: string
  /** Mot/expression que l'IA pourrait utiliser. Sera remplacé. */
  from: string
  /** Mot/expression préférée par l'ortho. */
  to: string
  /** Sensible à la casse (default false). */
  caseSensitive?: boolean
  /** Match en mot entier (default true) — évite que "patient" ne replace dans "patiente". */
  wholeWord?: boolean
  createdAt: string
}

function readAll(): VocabRule[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((r): r is VocabRule =>
      r && typeof r === 'object'
      && typeof r.id === 'string' && typeof r.from === 'string' && typeof r.to === 'string',
    )
  } catch {
    return []
  }
}

function writeAll(rules: VocabRule[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch (err) {
    console.warn('vocab writeAll failed:', err)
  }
}

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function listVocabRules(): VocabRule[] {
  return readAll()
}

export function createVocabRule(input: {
  from: string
  to: string
  caseSensitive?: boolean
  wholeWord?: boolean
}): VocabRule | null {
  const from = input.from.trim()
  const to = input.to.trim()
  if (!from || !to) return null
  if (from === to) return null
  const all = readAll()
  // Évite les doublons exacts sur `from`
  if (all.some(r => r.from.toLowerCase() === from.toLowerCase())) return null
  const rule: VocabRule = {
    id: genId(),
    from,
    to,
    caseSensitive: input.caseSensitive ?? false,
    wholeWord: input.wholeWord ?? true,
    createdAt: new Date().toISOString(),
  }
  writeAll([...all, rule])
  return rule
}

export function updateVocabRule(id: string, patch: Partial<Pick<VocabRule, 'from' | 'to' | 'caseSensitive' | 'wholeWord'>>): VocabRule | null {
  const all = readAll()
  const idx = all.findIndex(r => r.id === id)
  if (idx < 0) return null
  const next = { ...all[idx], ...patch }
  if (patch.from !== undefined) {
    const f = patch.from.trim()
    if (!f) return null
    if (all.some(r => r.id !== id && r.from.toLowerCase() === f.toLowerCase())) return null
    next.from = f
  }
  if (patch.to !== undefined) {
    const t = patch.to.trim()
    if (!t) return null
    next.to = t
  }
  all[idx] = next
  writeAll(all)
  return next
}

export function deleteVocabRule(id: string): boolean {
  const all = readAll()
  const next = all.filter(r => r.id !== id)
  if (next.length === all.length) return false
  writeAll(next)
  return true
}

/**
 * Échappe les caractères regex spéciaux dans un littéral à matcher.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Applique les règles de vocabulaire à un texte narratif.
 * Idempotent : appeler plusieurs fois ne change rien après la 1re passe
 * (tant que from ≠ to dans toutes les règles).
 */
export function applyVocabRules(text: string, rules?: VocabRule[]): string {
  if (!text) return text
  const list = rules ?? readAll()
  if (list.length === 0) return text
  let out = text
  for (const r of list) {
    const safe = escapeRegex(r.from)
    // Bordure de mot Unicode (cf. anonymizer.ts) — évite que "lecture"
    // remplace dans "relecture" tout en gérant les accents.
    const pattern = r.wholeWord !== false
      ? `(?<![\\p{L}\\p{N}])${safe}(?![\\p{L}\\p{N}])`
      : safe
    const flags = r.caseSensitive ? 'gu' : 'giu'
    try {
      out = out.replace(new RegExp(pattern, flags), r.to)
    } catch {
      // Regex invalide (rare) → on skip cette règle
    }
  }
  return out
}

/**
 * Applique les règles récursivement à tous les strings d'un objet.
 * Utile sur CRBOStructure pour réécrire toutes les sections narratives.
 */
export function applyVocabToObject<T>(obj: T, rules?: VocabRule[]): T {
  const list = rules ?? readAll()
  if (list.length === 0) return obj
  return walkAndApply(obj, list) as T
}

function walkAndApply(value: unknown, rules: VocabRule[]): unknown {
  if (value == null) return value
  if (typeof value === 'string') return applyVocabRules(value, rules)
  if (Array.isArray(value)) return value.map(v => walkAndApply(v, rules))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkAndApply(v, rules)
    }
    return out
  }
  return value
}

export function subscribeToVocab(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb()
  window.addEventListener('storage', handler)
  window.addEventListener(EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(EVENT, handler)
  }
}
