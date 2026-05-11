/**
 * Snippets persos — raccourcis textuels stockés en localStorage.
 *
 * V1 (beta) : tout en localStorage côté navigateur. Synchro automatique
 * entre les onglets via le storage event. Pas de partage entre appareils,
 * c'est assumé pour la beta — la migration vers une table Supabase est
 * triviale (interface identique).
 *
 * Usage typique :
 *   import { listSnippets, expandSnippetTrigger } from '@/lib/snippets'
 *   const snippets = listSnippets()
 *   // → [{ key: 'fatigue', body: 'L'enfant présente...' }, ...]
 *
 * Le composant SnippetTextarea (wrapper de <textarea>) détecte automatiquement
 * une frappe `/key` et propose la liste filtrée pour insertion.
 */

const STORAGE_KEY = 'orthoia.snippets'
const EVENT = 'orthoia:snippets-changed'

export interface Snippet {
  /** Identifiant unique stable. Généré au create. */
  id: string
  /** Raccourci tapé après le "/" — minuscules sans espace (validé). */
  key: string
  /** Contenu du snippet (peut faire plusieurs lignes). */
  body: string
  /** Description optionnelle pour mémoire. */
  description?: string
  /** ISO timestamp de création. */
  createdAt: string
  /** Nombre d'utilisations — utile pour ranger les plus fréquents en haut. */
  useCount?: number
}

// ============================================================================
// Snippets par défaut — pré-installés au 1er chargement
// ============================================================================

const DEFAULT_SNIPPETS: Array<Omit<Snippet, 'id' | 'createdAt' | 'useCount'>> = [
  {
    key: 'fatigue',
    body: "L'enfant présente une fatigabilité notable en fin de séance, avec une baisse de l'attention soutenue.",
    description: 'Fatigabilité observée en séance',
  },
  {
    key: 'anxiete',
    body: 'Une anxiété de performance est observée, particulièrement face aux épreuves chronométrées.',
    description: 'Anxiété face aux épreuves',
  },
  {
    key: 'encouragements',
    body: 'A nécessité de fréquents encouragements pour maintenir son engagement durant le bilan.',
    description: 'Encouragements nécessaires',
  },
  {
    key: 'empan-faible',
    body: "L'empan auditif s'avère réduit, ce qui peut impacter la mémorisation des consignes longues et complexes.",
    description: 'Empan auditif réduit',
  },
  {
    key: 'cooperant',
    body: "S'est montré·e coopérant·e et investi·e tout au long du bilan, malgré la durée et le coût cognitif des épreuves.",
    description: 'Coopération + investissement',
  },
  {
    key: 'concentration',
    body: 'Bonne capacité de concentration et de maintien attentionnel sur la durée complète du bilan.',
    description: 'Concentration préservée',
  },
  {
    key: 'lecture-haché',
    body: 'La lecture est hachée, avec de fréquentes hésitations sur les mots longs et un déchiffrage encore très laborieux.',
    description: 'Lecture hachée — déchiffrage',
  },
  {
    key: 'autocorrection',
    body: 'On observe de fréquentes autocorrections, témoignant d\'une vigilance orthographique préservée mais coûteuse.',
    description: 'Autocorrections fréquentes',
  },
]

// ============================================================================
// Helpers UUID-like sans dépendance
// ============================================================================

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback : timestamp + random
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ============================================================================
// CRUD storage
// ============================================================================

function readAll(): Snippet[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is Snippet =>
      s && typeof s === 'object'
      && typeof s.id === 'string' && typeof s.key === 'string'
      && typeof s.body === 'string',
    )
  } catch {
    return []
  }
}

function writeAll(snippets: Snippet[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
    // Notifier les autres composants ouverts dans la même page (le storage
    // event n'est PAS déclenché dans l'onglet qui écrit — d'où ce custom event).
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch (err) {
    console.warn('snippets writeAll failed:', err)
  }
}

/**
 * Initialise les snippets par défaut au 1er appel (idempotent : ne touche
 * pas la liste si elle existe déjà, même vide). Appelé depuis l'app au mount.
 */
export function ensureDefaultSnippets() {
  if (typeof window === 'undefined') return
  const initFlag = localStorage.getItem(`${STORAGE_KEY}.initialized`)
  if (initFlag === 'true') return
  const existing = readAll()
  if (existing.length > 0) {
    localStorage.setItem(`${STORAGE_KEY}.initialized`, 'true')
    return
  }
  const now = new Date().toISOString()
  const defaults: Snippet[] = DEFAULT_SNIPPETS.map(s => ({
    ...s,
    id: genId(),
    createdAt: now,
    useCount: 0,
  }))
  writeAll(defaults)
  localStorage.setItem(`${STORAGE_KEY}.initialized`, 'true')
}

export function listSnippets(): Snippet[] {
  return readAll()
}

/** Cherche un snippet par sa clé exacte (case-insensitive). */
export function findSnippetByKey(key: string): Snippet | null {
  const target = key.trim().toLowerCase()
  if (!target) return null
  return readAll().find(s => s.key.toLowerCase() === target) ?? null
}

/** Crée un snippet. Renvoie le snippet créé ou null si la clé existe déjà. */
export function createSnippet(input: { key: string; body: string; description?: string }): Snippet | null {
  const key = input.key.trim().toLowerCase().replace(/\s+/g, '-')
  if (!key) return null
  if (!input.body.trim()) return null
  if (!/^[a-z0-9-_]+$/.test(key)) return null
  const all = readAll()
  if (all.some(s => s.key.toLowerCase() === key)) return null // collision
  const snippet: Snippet = {
    id: genId(),
    key,
    body: input.body.trim(),
    description: input.description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    useCount: 0,
  }
  writeAll([...all, snippet])
  return snippet
}

/** Met à jour un snippet existant (par id). Renvoie le snippet mis à jour ou null. */
export function updateSnippet(id: string, patch: Partial<Pick<Snippet, 'key' | 'body' | 'description'>>): Snippet | null {
  const all = readAll()
  const idx = all.findIndex(s => s.id === id)
  if (idx < 0) return null
  const next = { ...all[idx] }
  if (patch.key !== undefined) {
    const k = patch.key.trim().toLowerCase().replace(/\s+/g, '-')
    if (!k || !/^[a-z0-9-_]+$/.test(k)) return null
    if (all.some(s => s.id !== id && s.key.toLowerCase() === k)) return null
    next.key = k
  }
  if (patch.body !== undefined) {
    if (!patch.body.trim()) return null
    next.body = patch.body.trim()
  }
  if (patch.description !== undefined) {
    next.description = patch.description.trim() || undefined
  }
  all[idx] = next
  writeAll(all)
  return next
}

export function deleteSnippet(id: string): boolean {
  const all = readAll()
  const next = all.filter(s => s.id !== id)
  if (next.length === all.length) return false
  writeAll(next)
  return true
}

/** Incrémente le compteur d'utilisation (best-effort). */
export function bumpSnippetUsage(id: string) {
  const all = readAll()
  const idx = all.findIndex(s => s.id === id)
  if (idx < 0) return
  all[idx] = { ...all[idx], useCount: (all[idx].useCount ?? 0) + 1 }
  writeAll(all)
}

/** Détecte un trigger `/keyword` à la position du caret et retourne le mot
 *  filtre + sa position. Utilisé par SnippetTextarea pour ouvrir le popup. */
export function detectSlashTrigger(text: string, caretPos: number): { keyword: string; start: number } | null {
  if (caretPos <= 0) return null
  // Cherche le "/" le plus récent avant le caret, qui :
  //   - est en début de ligne OU précédé d'un espace (évite les URLs)
  //   - est suivi de caractères alphanumériques + tirets uniquement
  let i = caretPos - 1
  while (i >= 0) {
    const c = text[i]
    if (c === '/') {
      // Vérifie que le caractère avant est début de chaîne, espace, ou newline
      const before = i > 0 ? text[i - 1] : ''
      if (before === '' || /\s/.test(before)) {
        const keyword = text.slice(i + 1, caretPos)
        // keyword doit être valide (alphanum + tiret + underscore)
        if (/^[a-zA-Z0-9-_]*$/.test(keyword)) {
          return { keyword: keyword.toLowerCase(), start: i }
        }
      }
      return null
    }
    if (/\s/.test(c)) return null // espace = trop loin
    i--
  }
  return null
}

/** Hook léger pour souscrire aux changements de snippets (multi-onglets + intra-page). */
export function subscribeToSnippets(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb()
  window.addEventListener('storage', handler)
  window.addEventListener(EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(EVENT, handler)
  }
}
