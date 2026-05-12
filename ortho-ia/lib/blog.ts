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

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string         // ISO YYYY-MM-DD
  author: string
  tags: string[]
  coverImage?: string
  readingTime: number  // minutes (estimé à 200 wpm)
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
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    readingTime: estimateReadingTime(content),
  }

  return { meta, html }
}

/** Retourne tous les articles triés par date desc (plus récent en premier). */
export function getAllPosts(): PostMeta[] {
  return getAllSlugs()
    .map((slug) => getPostBySlug(slug).meta)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** Formatte une date ISO en "12 mai 2026" (fr-FR). */
export function formatPostDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
