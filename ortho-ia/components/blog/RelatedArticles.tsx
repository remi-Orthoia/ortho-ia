import type { PostMeta } from '@/lib/blog'
import type { LocaleCode } from '@/lib/locales'
import { ArticleCard } from './ArticleCard'

interface RelatedArticlesProps {
  posts: PostMeta[]
  locale?: LocaleCode
}

export function RelatedArticles({ posts, locale = 'fr' }: RelatedArticlesProps) {
  if (posts.length === 0) return null

  return (
    <section style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border-ds)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 24, fontWeight: 500,
        letterSpacing: '-0.01em',
        margin: '0 0 24px',
        color: 'var(--fg-1)',
      }}>
        Articles liés
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {posts.map((p) => (
          <ArticleCard key={p.slug} post={p} locale={locale} />
        ))}
      </div>
    </section>
  )
}
