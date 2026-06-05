/**
 * Blog loader — lit les fichiers markdown de `content/blog/` au build,
 * parse leur frontmatter, et expose une API simple.
 *
 * Convention de fichier : `content/blog/<slug>.md` avec frontmatter :
 *
 *     ---
 *     title: "Titre de l'article"
 *     description: "Description SEO 120-160 chars"
 *     date: 2026-05-12
 *     dateModified: 2026-05-20        # optionnel
 *     author: "Rémi Berrio"
 *     tags: ["dyslexie", "exalang"]
 *     coverImage: "/blog/img/dyslexie-1.jpg"   # optionnel
 *     coverAlt: "Description alt de l'image"   # optionnel
 *     cocon: "redaction-crbo"                  # optionnel (CoconId)
 *     locale: "fr-FR"                          # optionnel, défaut fr-FR
 *     canonicalSlug: "ecrire-un-crbo"          # optionnel (slug commun multi-locale)
 *     isPillar: false                          # optionnel, true = article pilier du cocon
 *     ---
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import type { CoconId } from './blog-cocons'
import type { Locale } from './locales'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface FaqItem {
  question: string
  answer: string
}

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string          // ISO YYYY-MM-DD
  dateModified?: string // ISO YYYY-MM-DD
  author: string
  tags: string[]
  coverImage?: string
  coverAlt?: string
  readingTime: number   // minutes (estimé à 200 wpm)
  wordCount: number
  cocon?: CoconId
  locale: Locale        // défaut: 'fr-FR'
  canonicalSlug?: string
  isPillar: boolean     // défaut: false
  /** Q/R optionnelles depuis le frontmatter — alimentent le JSON-LD
   *  FAQPage (éligibilité rich snippets Google). */
  faq?: FaqItem[]
}

export interface Post {
  meta: PostMeta
  html: string
}

function estimateReadingTime(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
}

export function getPostBySlug(slug: string): Post {
  const file = path.join(BLOG_DIR, `${slug}.md`)
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)

  marked.setOptions({ gfm: true, breaks: false })
  const html = marked.parse(content) as string

  const meta: PostMeta = {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().slice(0, 10),
    dateModified: data.dateModified
      ? (typeof data.dateModified === 'string' ? data.dateModified : new Date(data.dateModified).toISOString().slice(0, 10))
      : undefined,
    author: data.author ?? "L'équipe Ortho.ia",
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    coverAlt: typeof data.coverAlt === 'string' ? data.coverAlt : undefined,
    readingTime: estimateReadingTime(content),
    wordCount: countWords(content),
    cocon: data.cocon ?? undefined,
    locale: (['fr-FR', 'fr-BE', 'fr-CH'].includes(data.locale) ? data.locale : 'fr-FR') as Locale,
    canonicalSlug: typeof data.canonicalSlug === 'string' ? data.canonicalSlug : undefined,
    isPillar: data.isPillar === true,
    faq: Array.isArray(data.faq)
      ? data.faq
          .filter((q: unknown): q is FaqItem =>
            !!q && typeof (q as FaqItem).question === 'string' && typeof (q as FaqItem).answer === 'string'
          )
          .map((q: FaqItem) => ({ question: q.question, answer: q.answer }))
      : undefined,
  }

  return { meta, html }
}

/** Tous les articles, triés par date desc. Filtrable par locale et cocon. */
export function getAllPosts(opts?: { locale?: Locale; cocon?: CoconId }): PostMeta[] {
  let posts = getAllSlugs()
    .map((slug) => getPostBySlug(slug).meta)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  if (opts?.locale) {
    posts = posts.filter((p) => p.locale === opts.locale)
  }
  if (opts?.cocon) {
    posts = posts.filter((p) => p.cocon === opts.cocon)
  }
  return posts
}

/** Articles d'un cocon : pilier en premier, puis satellites par date desc. */
export function getCoconPosts(cocon: CoconId, locale?: Locale): PostMeta[] {
  const posts = getAllPosts({ locale, cocon })
  const pillar = posts.filter((p) => p.isPillar)
  const satellites = posts.filter((p) => !p.isPillar)
  return [...pillar, ...satellites]
}

/** Articles liés : même cocon en priorité, sinon les plus récents. */
export function getRelatedPosts(current: PostMeta, limit = 3): PostMeta[] {
  const all = getAllPosts({ locale: current.locale })
  const sameCocon = all.filter((p) => p.slug !== current.slug && p.cocon === current.cocon)
  const others = all.filter((p) => p.slug !== current.slug && p.cocon !== current.cocon)
  return [...sameCocon, ...others].slice(0, limit)
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
