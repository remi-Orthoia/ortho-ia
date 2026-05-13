/**
 * Glossaire CRBO — banque de termes spécifiques à l'orthophonie qui sont
 * souvent mal retranscrits par la dictée vocale (Whisper, Dragon, clavier mobile).
 *
 * Exemples typiques :
 *   "ulysse" → "ULIS"  (Unités Localisées pour l'Inclusion Scolaire)
 *   "à valeau" → "EVALO"  (test orthophonique)
 *   "ex à lent" → "Exalang"
 *
 * Différent du vocabulaire perso (lib/vocab-perso.ts) :
 *   - vocab-perso = préférences stylistiques de l'ortho (subjectif)
 *   - glossaire   = corrections factuelles de mistranscriptions (objectif)
 *
 * Application : sur la sortie Whisper (avant que le texte n'arrive dans le
 * textarea) ET sur les drafts IA (avant export Word), pour rattraper les cas
 * où l'IA aurait repris une mistranscription.
 *
 * Données :
 *   - BUILTIN_GLOSSARY : liste curée, toujours active, livrée avec l'app.
 *   - User entries : ajouts perso stockés en localStorage.
 *
 * Décision V1 : pas de "désactivation" des built-ins. Ce sont des corrections
 * factuelles que personne ne devrait vouloir désactiver. Si un cas réel
 * apparaît, on ajoutera un flag plus tard.
 */

const STORAGE_KEY = 'orthoia.glossaire'
const EVENT = 'orthoia:glossaire-changed'

export interface GlossaireEntry {
  id: string
  /** Forme canonique correcte (ex: "ULIS"). */
  term: string
  /** Mistranscriptions courantes à remplacer par `term` (ex: ["ulysse", "uliss"]). */
  aliases: string[]
  /** Catégorie pour le regroupement UI. */
  category?: GlossaireCategory
  createdAt: string
}

export type GlossaireCategory =
  | 'acronyme'   // ULIS, AESH, MDPH...
  | 'test'       // Exalang, EVALO, Belec...
  | 'clinique'   // dysphasie, dyspraxie, métaphonologie...
  | 'autre'

/**
 * Glossaire intégré : termes CRBO récurrents que Whisper rate souvent.
 * Toujours appliqué, sans intervention de l'ortho.
 *
 * Les aliases sont des mistranscriptions OBSERVÉES (Whisper-1 français,
 * audio téléphone/laptop). Garder cette liste conservatrice : un alias trop
 * permissif peut corrompre du texte légitime.
 */
export const BUILTIN_GLOSSARY: ReadonlyArray<Omit<GlossaireEntry, 'id' | 'createdAt'>> = [
  // ============ Acronymes scolaires & médico-sociaux ============
  { term: 'ULIS', aliases: ['ulysse', 'uliss', 'Ulysse', 'Uliss', 'u liss', 'U lisse'], category: 'acronyme' },
  { term: 'AESH', aliases: ['a e s h', 'A.E.S.H', 'a.e.s.h', 'aèsh', 'A e s h'], category: 'acronyme' },
  { term: 'MDPH', aliases: ['m d p h', 'M.D.P.H', 'm.d.p.h', 'M d p h'], category: 'acronyme' },
  { term: 'PPS', aliases: ['p p s', 'P.P.S', 'p.p.s'], category: 'acronyme' },
  { term: 'PAP', aliases: ['p a p', 'P.A.P', 'p.a.p'], category: 'acronyme' },
  { term: 'PPRE', aliases: ['p p r e', 'P.P.R.E', 'p.p.r.e', 'pépéerre'], category: 'acronyme' },
  { term: 'RASED', aliases: ['rasèd', 'Rased', 'R.A.S.E.D', 'r.a.s.e.d'], category: 'acronyme' },
  { term: 'SEGPA', aliases: ['ségpa', 'Ségpa', 'S.E.G.P.A'], category: 'acronyme' },
  { term: 'ATSEM', aliases: ['atsème', 'Atsème', 'a t s e m', 'A.T.S.E.M'], category: 'acronyme' },
  { term: 'CMPP', aliases: ['c m p p', 'C.M.P.P', 'c.m.p.p'], category: 'acronyme' },
  { term: 'CAMSP', aliases: ['camsp', 'c a m s p', 'C.A.M.S.P', 'kams pé'], category: 'acronyme' },
  { term: 'SESSAD', aliases: ['sessade', 'cessad', 'S.E.S.S.A.D'], category: 'acronyme' },
  { term: 'IME', aliases: ['i m e', 'I.M.E', 'i.m.e'], category: 'acronyme' },
  { term: 'ITEP', aliases: ['itèpe', 'Itèpe', 'I.T.E.P', 'i.t.e.p'], category: 'acronyme' },
  { term: 'AVS', aliases: ['a v s', 'A.V.S', 'a.v.s'], category: 'acronyme' },
  { term: 'TSA', aliases: ['t s a', 'T.S.A', 't.s.a'], category: 'acronyme' },
  { term: 'TDAH', aliases: ['t d a h', 'T.D.A.H', 't.d.a.h', 'tédah'], category: 'acronyme' },
  { term: 'TDI', aliases: ['t d i', 'T.D.I', 't.d.i'], category: 'acronyme' },
  { term: 'TDL', aliases: ['t d l', 'T.D.L', 't.d.l'], category: 'acronyme' },
  { term: 'CRBO', aliases: ['c r b o', 'C.R.B.O', 'c.r.b.o', 'cerbo', 'césébéo'], category: 'acronyme' },

  // ============ Tests orthophoniques ============
  { term: 'Exalang', aliases: ['exalan', 'ex à lent', 'éxalang', 'Éxalang', 'EXALANG', 'exa lang'], category: 'test' },
  { term: 'EVALO', aliases: ['évalo', 'évaleau', 'à valeau', 'et valeau', 'Évalo', 'évalo 2-6', 'évalo 6'], category: 'test' },
  { term: 'BMTi', aliases: ['b m t i', 'BMT i', 'bémété i', 'B.M.T.I'], category: 'test' },
  { term: 'Belec', aliases: ['bélec', 'Bélec', 'belèque', 'belek'], category: 'test' },
  { term: 'Examath', aliases: ['examate', 'éxamath', 'ex à math', 'EXAMATH'], category: 'test' },
  { term: 'BETL', aliases: ['b e t l', 'BÊTL', 'bétèle', 'B.E.T.L'], category: 'test' },
  { term: 'ODEDYS', aliases: ['odédys', 'Odédys', 'au des dyss', 'odé dis'], category: 'test' },
  { term: 'BALE', aliases: ['bal', 'Bal', 'balle', 'b a l e'], category: 'test' },
  { term: 'ECLA', aliases: ['é c l a', 'éclat', 'E.C.L.A', 'écla'], category: 'test' },
  { term: 'L2MA', aliases: ['l 2 m a', 'L2 M A', 'L.2.M.A', 'el deux èm a'], category: 'test' },
  { term: 'EVALEO', aliases: ['évaléo', 'évaleo', 'à valéo', 'et valéo'], category: 'test' },

  // ============ Terminologie clinique ============
  { term: 'dysphasie', aliases: ['dis phasie', 'dis-phasie'], category: 'clinique' },
  { term: 'dyspraxie', aliases: ['dis praxie', 'dis-praxie'], category: 'clinique' },
  { term: 'dyscalculie', aliases: ['dis calculie', 'dis-calculie'], category: 'clinique' },
  { term: 'dysorthographie', aliases: ['dis orthographie', 'dis-orthographie'], category: 'clinique' },
  { term: 'dyslexie', aliases: ['dis lexie', 'dis-lexie'], category: 'clinique' },
  { term: 'métaphonologie', aliases: ['méta phonologie', 'méta-phonologie'], category: 'clinique' },
  { term: 'phonologique', aliases: ['fonologique'], category: 'clinique' },
  { term: 'phonologie', aliases: ['fonologie'], category: 'clinique' },
  { term: 'orthophonique', aliases: ['ortho phonique'], category: 'clinique' },
  { term: 'orthophoniste', aliases: ['ortho phoniste'], category: 'clinique' },
  { term: 'anamnèse', aliases: ['anam nèse', 'anam-nèse', 'ana mnèse'], category: 'clinique' },
  { term: 'percentile', aliases: ['pour centile', 'pourcentile'], category: 'clinique' },
]

// ============ localStorage layer (user entries) ============

function readUser(): GlossaireEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e): e is GlossaireEntry =>
      e && typeof e === 'object'
      && typeof e.id === 'string'
      && typeof e.term === 'string'
      && Array.isArray(e.aliases)
      && e.aliases.every((a: unknown) => typeof a === 'string'),
    )
  } catch {
    return []
  }
}

function writeUser(entries: GlossaireEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch (err) {
    console.warn('glossaire writeUser failed:', err)
  }
}

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeAliases(aliases: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of aliases) {
    const a = (raw || '').trim()
    if (!a) continue
    const key = a.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

export function listUserGlossaire(): GlossaireEntry[] {
  return readUser()
}

export function listBuiltinGlossaire(): ReadonlyArray<Omit<GlossaireEntry, 'id' | 'createdAt'>> {
  return BUILTIN_GLOSSARY
}

export function createGlossaireEntry(input: {
  term: string
  aliases: string[]
  category?: GlossaireCategory
}): GlossaireEntry | null {
  const term = input.term.trim()
  const aliases = normalizeAliases(input.aliases)
  if (!term || aliases.length === 0) return null
  const all = readUser()
  if (all.some(e => e.term.toLowerCase() === term.toLowerCase())) return null
  const entry: GlossaireEntry = {
    id: genId(),
    term,
    aliases,
    category: input.category ?? 'autre',
    createdAt: new Date().toISOString(),
  }
  writeUser([...all, entry])
  return entry
}

export function updateGlossaireEntry(
  id: string,
  patch: Partial<Pick<GlossaireEntry, 'term' | 'aliases' | 'category'>>,
): GlossaireEntry | null {
  const all = readUser()
  const idx = all.findIndex(e => e.id === id)
  if (idx < 0) return null
  const next: GlossaireEntry = { ...all[idx] }
  if (patch.term !== undefined) {
    const t = patch.term.trim()
    if (!t) return null
    if (all.some(e => e.id !== id && e.term.toLowerCase() === t.toLowerCase())) return null
    next.term = t
  }
  if (patch.aliases !== undefined) {
    const a = normalizeAliases(patch.aliases)
    if (a.length === 0) return null
    next.aliases = a
  }
  if (patch.category !== undefined) {
    next.category = patch.category
  }
  all[idx] = next
  writeUser(all)
  return next
}

export function deleteGlossaireEntry(id: string): boolean {
  const all = readUser()
  const next = all.filter(e => e.id !== id)
  if (next.length === all.length) return false
  writeUser(next)
  return true
}

export function subscribeToGlossaire(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb()
  window.addEventListener('storage', handler)
  window.addEventListener(EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(EVENT, handler)
  }
}

// ============ Application des corrections ============

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Construit une seule regex compilée par entrée (alias[] joints en alternation),
 * mémorisée par signature. Évite de recompiler à chaque appel sur des longs textes.
 */
type CompiledEntry = { re: RegExp; term: string }
const compileCache = new Map<string, CompiledEntry>()

function compileEntry(term: string, aliases: string[]): CompiledEntry | null {
  if (aliases.length === 0) return null
  const sig = `${term}::${aliases.join('|')}`
  const cached = compileCache.get(sig)
  if (cached) return cached
  // On trie par longueur décroissante pour que les alias les plus longs
  // matchent en premier ("ex à lent" avant "ex").
  const sorted = [...aliases].sort((a, b) => b.length - a.length)
  const alternation = sorted.map(escapeRegex).join('|')
  // Bordure de mot Unicode (cf. anonymizer.ts) — gère les accents.
  const pattern = `(?<![\\p{L}\\p{N}])(?:${alternation})(?![\\p{L}\\p{N}])`
  try {
    const re = new RegExp(pattern, 'giu')
    const compiled = { re, term }
    compileCache.set(sig, compiled)
    return compiled
  } catch {
    return null
  }
}

/**
 * Applique le glossaire (built-in + user) à un texte.
 * - Sécuritaire pour des textes vides.
 * - Idempotent : repasser ne change plus rien après la 1re passe.
 */
export function applyGlossaire(
  text: string,
  opts?: { userEntries?: GlossaireEntry[]; skipBuiltin?: boolean },
): string {
  if (!text) return text
  let out = text
  const builtinEntries = opts?.skipBuiltin ? [] : BUILTIN_GLOSSARY
  for (const e of builtinEntries) {
    const c = compileEntry(e.term, e.aliases)
    if (!c) continue
    // Réinitialise lastIndex pour les regex globales (regex partagée via cache)
    c.re.lastIndex = 0
    out = out.replace(c.re, e.term)
  }
  const userEntries = opts?.userEntries ?? readUser()
  for (const e of userEntries) {
    const c = compileEntry(e.term, e.aliases)
    if (!c) continue
    c.re.lastIndex = 0
    out = out.replace(c.re, e.term)
  }
  return out
}

/**
 * Applique le glossaire récursivement à tous les strings d'un objet.
 * Utilisé sur CRBOStructure pour rattraper les mistranscriptions qui
 * auraient survécu jusque dans le draft IA.
 */
export function applyGlossaireToObject<T>(
  obj: T,
  opts?: { userEntries?: GlossaireEntry[]; skipBuiltin?: boolean },
): T {
  return walkAndApply(obj, opts) as T
}

function walkAndApply(
  value: unknown,
  opts?: { userEntries?: GlossaireEntry[]; skipBuiltin?: boolean },
): unknown {
  if (value == null) return value
  if (typeof value === 'string') return applyGlossaire(value, opts)
  if (Array.isArray(value)) return value.map(v => walkAndApply(v, opts))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkAndApply(v, opts)
    }
    return out
  }
  return value
}
