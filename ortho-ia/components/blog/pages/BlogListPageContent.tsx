import { Container } from '@/components/landing/Primitives'
import { BlogHero } from '@/components/blog/BlogHero'
import { CoconFilter } from '@/components/blog/CoconFilter'
import { ArticleCard } from '@/components/blog/ArticleCard'
import type { PostMeta } from '@/lib/blog'
import type { CoconId } from '@/lib/blog-cocons'
import type { LocaleCode } from '@/lib/locales'

interface BlogListPageContentProps {
  posts: PostMeta[]
  locale?: LocaleCode
  activeCocon?: CoconId
}

export function BlogListPageContent({ posts, locale = 'fr', activeCocon }: BlogListPageContentProps) {
  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <main>
        <Container style={{ maxWidth: 900 }}>
          <BlogHero />

          <div style={{ marginBottom: 32 }}>
            <CoconFilter locale={locale} activeCocon={activeCocon} />
          </div>

          {posts.length === 0 ? (
            <p style={{ color: 'var(--fg-3)', fontSize: 16, padding: '40px 0' }}>
              Premiers articles à venir. Revenez très bientôt !
            </p>
          ) : (
            <div style={{ paddingBottom: 96 }}>
              {/* Featured first article */}
              {posts.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <ArticleCard post={posts[0]} locale={locale} featured />
                </div>
              )}
              {/* Grid for the rest */}
              {posts.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {posts.slice(1).map((p) => (
                    <ArticleCard key={p.slug} post={p} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </main>
    </div>
  )
}
