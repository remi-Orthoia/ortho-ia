/**
 * Blog loader — lit les fichiers markdown de `content/blog/` au build,
 * parse leur frontmatter, et expose une API simple :
 *
 *   getAllPosts()      → liste pour la page index, triée par date desc
 *   getPostBySlug(slug)→ {meta, html} pour la page détail
 *   getAllSlugs()      → pour generateStaticParams + sitemap
 *
 * Stocker les articles en markdown (vs en DB) donne :
 *   - SEO parfait (SSG, rendu HTML statique)
 *   - Aucune dépendance runtime (pas d'appel Supabase)
 *   - Versionnage git natif des contenus
 *   - Édition collaborative via PR
 *
 * Convention de fichier : `content/blog/<slug>.md` avec frontmatter :
 *
 *     ---
 *     title: "Titre de l'article"
 *     description: "Description SEO 120-160 chars"
 *     date: 2026-05-12
 *     author: "Rémi Berrio"
 *     tags: ["dyslexie", "exalang"]
 *     coverImage: "/blog/img/dyslexie-1.jpg"   # optionnel
 *     ---
 *
 *     Le corps de l'article en markdown standard.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { COCON_SLUGS } from './cocons'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/**
 * Garde-fou : crie un WARN visible au build (et en dev) si un article n'a
 * pas de champ `cocon` valide. C'est le filet anti-régression du bug
 * "les catégories disparaissent à chaque fois" (cause : rédaction manuelle
 * ou pipeline Make qui n'écrit pas la valeur dans le frontmatter, sans
 * jamais déclencher d'erreur visible).
 *
 * - Cocon absent → WARN "missing cocon" (rouge en terminal)
 * - Cocon inconnu (faute de frappe, valeur retirée) → WARN "unknown cocon"
 * - Cocon valide → silencieux
 *
 * Si tu veux passer en mode strict (build qui fail), remplace `console.warn`
 * par `throw new Error(...)` ci-dessous. Garder en WARN tant que tous les
 * articles legacy n'ont pas été migrés.
 */
function validateCocon(slug: string, cocon: string | undefined): void {
  if (!cocon) {
    // eslint-disable-next-line no-console
    console.warn(
      `\x1b[31m[blog] ⚠ Article "${slug}.md" : champ \`cocon\` manquant.\x1b[0m\n` +
      `  → Ajoute "cocon: <slug>" dans le frontmatter.\n` +
      `  → Valeurs valides : ${COCON_SLUGS.join(', ')}`
    )
    return
  }
  if (!COCON_SLUGS.includes(cocon)) {
    // eslint-disable-next-line no-console
    console.warn(
      `\x1b[31m[blog] ⚠ Article "${slug}.md" : cocon inconnu "${cocon}".\x1b[0m\n` +
      `  → Valeurs valides : ${COCON_SLUGS.join(', ')}`
    )
  }
}

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string         // ISO YYYY-MM-DD
  author: string
  tags: string[]
  /** Slug du cocon éditorial (voir `lib/cocons.ts`). Pilote la nav, la chip
   *  de catégorie sur les cards et les pages /blog/categorie/[slug]. */
  cocon?: string
  coverImage?: string
  /** Texte alternatif de l'image de couverture (SEO + a11y). */
  coverAlt?: string
  /** Dimensions natives de l'image — utilisées pour éviter le CLS. */
  coverWidth?: number
  coverHeight?: number
  /** Article pilier du cocon : affiche un badge "À lire en premier" et reste
   *  systématiquement en tête de liste (page index + page catégorie).
   *  Convention : 1 seul pilier par cocon. Géré par sort code-driven, donc
   *  ne peut PAS être perturbé par un nouveau push d'article daté du jour. */
  isPillar?: boolean
  readingTime: number  // minutes (estimé à 200 wpm)
  /** Q/R optionnelles depuis le frontmatter — alimentent le JSON-LD
   *  FAQPage (éligibilité rich snippets Google). */
  faq?: { question: string; answer: string }[]
}

export interface Post {
  meta: PostMeta
  html: string         // markdown rendu en HTML
}

/** Estime un temps de lecture à 200 mots/min (lecture web standard). */
function estimateReadingTime(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Liste les slugs disponibles (= noms de fichiers .md sans extension). */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
}

/** Lit un article par slug, renvoie meta + html. Throw si introuvable. */
export function getPostBySlug(slug: string): Post {
  const file = path.join(BLOG_DIR, `${slug}.md`)
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)

  marked.setOptions({
    gfm: true,
    breaks: false,
  })
  const html = marked.parse(content) as string

  const meta: PostMeta = {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().slice(0, 10),
    author: data.author ?? 'L\'équipe Ortho.ia',
    tags: Array.isArray(data.tags) ? data.tags : [],
    cocon: (() => {
      const c = typeof data.cocon === 'string' ? data.cocon : undefined
      validateCocon(slug, c)
      return c
    })(),
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    coverAlt: typeof data.coverAlt === 'string' ? data.coverAlt : undefined,
    coverWidth: typeof data.coverWidth === 'number' ? data.coverWidth : undefined,
    coverHeight: typeof data.coverHeight === 'number' ? data.coverHeight : undefined,
    isPillar: data.isPillar === true,
    readingTime: estimateReadingTime(content),
    faq: Array.isArray(data.faq)
      ? data.faq
          .filter((q: any) => q && typeof q.question === 'string' && typeof q.answer === 'string')
          .map((q: any) => ({ question: q.question, answer: q.answer }))
      : undefined,
  }

  return { meta, html }
}

/**
 * Tri canonique de la liste d'articles, code-driven (pas frontmatter-driven) :
 *
 *   1. isPillar === true   → systématiquement en tête
 *   2. date desc           → puis chronologique inverse
 *
 * Pourquoi code-driven : Make pousse régulièrement des articles datés du jour.
 * Si on triait sur la seule date, le pilier "Comment rédiger un CRBO" tomberait
 * à chaque nouveau push (cf incident récurrent "le pilier disparaît"). Ici, la
 * règle est codée → impossible de la perdre via un frontmatter mal rempli.
 *
 * Convention métier : 1 pilier par cocon (5 piliers max au total).
 */
function sortCanonical(a: PostMeta, b: PostMeta): number {
  if (a.isPillar !== b.isPillar) return a.isPillar ? -1 : 1
  return a.date < b.date ? 1 : -1
}

/** Retourne tous les articles triés selon l'ordre canonique (piliers en tête). */
export function getAllPosts(): PostMeta[] {
  return getAllSlugs()
    .map((slug) => getPostBySlug(slug).meta)
    .sort(sortCanonical)
}

/** Retourne les articles d'un cocon donné, triés selon l'ordre canonique. */
export function getPostsByCocon(coconSlug: string): PostMeta[] {
  return getAllPosts().filter((p) => p.cocon === coconSlug)
}

/** Formatte une date ISO en "12 mai 2026" (fr-FR). */
export function formatPostDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
