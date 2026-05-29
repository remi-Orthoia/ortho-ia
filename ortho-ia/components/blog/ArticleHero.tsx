import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'
import { getCocon } from '@/lib/blog-cocons'
import type { LocaleCode } from '@/lib/locales'
import { getBlogBasePath, getCoconPath } from '@/lib/locales'
import { AuthorMeta } from './AuthorMeta'

interface ArticleHeroProps {
  meta: PostMeta
  locale?: LocaleCode
}

export function ArticleHero({ meta, locale = 'fr' }: ArticleHeroProps) {
  const blogPath = getBlogBasePath(locale)
  const cocon = meta.cocon ? getCocon(meta.cocon) : undefined

  return (
    <header style={{ marginBottom: 40 }}>
      <nav
        aria-label="Fil d'Ariane"
        style={{
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 13, color: 'var(--fg-3)', marginBottom: 20,
        }}
      >
        <Link href={blogPath} style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>
          Le Blog
        </Link>
        {cocon && (
          <>
            <span aria-hidden="true">›</span>
            <Link
              href={getCoconPath(locale, cocon.id)}
              style={{ color: 'var(--fg-3)', textDecoration: 'none' }}
            >
              {cocon.label}
            </Link>
          </>
        )}
        <span aria-hidden="true">›</span>
        <span style={{ color: 'var(--fg-2)' }} aria-current="page">Article</span>
      </nav>

      {(meta.tags.length > 0 || (meta.isPillar && cocon)) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {meta.tags.map((t) => (
            <span
              key={t}
              style={{
                background: 'var(--ds-accent-soft)',
                color: 'var(--ds-accent-hover)',
                padding: '2px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
              }}
            >{t}</span>
          ))}
          {meta.isPillar && cocon && (
            <span style={{
              background: 'var(--ds-primary-soft)',
              color: 'var(--ds-primary)',
              padding: '2px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
            }}>{cocon.icon} À lire en premier — {cocon.label}</span>
          )}
        </div>
      )}

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px, 5vw, 44px)',
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          margin: '0 0 16px',
          color: 'var(--fg-1)',
          textWrap: 'balance',
        } as React.CSSProperties}
      >{meta.title}</h1>

      <p style={{
        fontSize: 18, lineHeight: 1.55,
        color: 'var(--fg-2)',
        margin: '0 0 24px',
      }}>{meta.description}</p>

      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border-ds)' }}>
        <AuthorMeta meta={meta} />
      </div>
    </header>
  )
}
