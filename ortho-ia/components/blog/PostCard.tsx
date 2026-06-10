/**
 * Card d'article utilisée sur /blog et /blog/categorie/[slug].
 *
 * Note importante sur les liens imbriqués :
 *   La card entière est un <Link> vers /blog/<slug>. La chip de cocon DOIT donc
 *   être en variante "static" (un span, pas un Link) pour ne pas générer de
 *   <a> nested invalide.
 */

import Link from 'next/link'
import { formatPostDate, type PostMeta } from '@/lib/blog'
import { getCocon } from '@/lib/cocons'
import { CoconChip } from './CoconChip'

export function PostCard({ post }: { post: PostMeta }) {
  const cocon = getCocon(post.cocon)

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds)',
        borderRadius: 20,
        padding: 24,
        transition: 'transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms',
      }}
      className="ds-card-interactive"
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          fontSize: 13,
          color: 'var(--fg-3)',
          marginBottom: 12,
        }}
      >
        {cocon && <CoconChip cocon={cocon} variant="static" />}
        <span>{formatPostDate(post.date)}</span>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min de lecture</span>
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          margin: '0 0 8px',
          color: 'var(--fg-1)',
          letterSpacing: '-0.01em',
        }}
      >
        {post.title}
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>
        {post.description}
      </p>
    </Link>
  )
}
