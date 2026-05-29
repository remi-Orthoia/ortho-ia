import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'
import { formatPostDate } from '@/lib/blog'
import { getCocon } from '@/lib/blog-cocons'
import type { LocaleCode } from '@/lib/locales'
import { getArticlePath } from '@/lib/locales'

interface ArticleCardProps {
  post: PostMeta
  locale?: LocaleCode
  featured?: boolean
}

export function ArticleCard({ post, locale = 'fr', featured = false }: ArticleCardProps) {
  const href = getArticlePath(locale, post.slug)
  const cocon = post.cocon ? getCocon(post.cocon) : undefined

  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
      <article
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-ds)',
          borderRadius: 20,
          padding: featured ? 32 : 24,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          boxSizing: 'border-box',
          transition: 'transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms',
        }}
        className="ds-card-interactive"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {cocon && (
            <span style={{
              background: 'var(--ds-primary-soft)',
              color: 'var(--ds-primary)',
              padding: '3px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{cocon.icon} {cocon.label}</span>
          )}
          {post.isPillar && (
            <span style={{
              background: 'var(--ds-accent-soft)',
              color: 'var(--ds-accent)',
              padding: '3px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
            }}>Pilier</span>
          )}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: featured ? 24 : 19,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          margin: '0 0 8px',
          color: 'var(--fg-1)',
        }}>{post.title}</h2>

        <p style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--fg-2)',
          margin: '0 0 16px',
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>{post.description}</p>

        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 12, color: 'var(--fg-3)',
        }}>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min</span>
          {post.tags.slice(0, 2).map((t) => (
            <span key={t} style={{
              background: 'var(--ds-accent-soft)',
              color: 'var(--ds-accent-hover)',
              padding: '2px 7px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
            }}>{t}</span>
          ))}
        </div>
      </article>
    </Link>
  )
}
