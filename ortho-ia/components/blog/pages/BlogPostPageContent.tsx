import Link from 'next/link'
import { Container } from '@/components/landing/Primitives'
import { ArticleHero } from '@/components/blog/ArticleHero'
import { ArticleCTA } from '@/components/blog/ArticleCTA'
import { RelatedArticles } from '@/components/blog/RelatedArticles'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { LocaleSwitcher } from '@/components/blog/LocaleSwitcher'
import type { Post, PostMeta } from '@/lib/blog'
import type { LocaleCode } from '@/lib/locales'
import { getBlogBasePath } from '@/lib/locales'

interface BlogPostPageContentProps {
  post: Post
  related: PostMeta[]
  locale?: LocaleCode
}

export function BlogPostPageContent({ post, related, locale = 'fr' }: BlogPostPageContentProps) {
  const { meta, html } = post
  const blogPath = getBlogBasePath(locale)
  const hasToc = meta.wordCount >= 1500

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <main>
        <article style={{ padding: '64px 0 0' }}>
          <Container style={{ maxWidth: hasToc ? 1100 : 740 }}>
            {hasToc ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 220px',
                gap: 64,
                alignItems: 'start',
              }}>
                <div style={{ minWidth: 0 }}>
                  <ArticleHero meta={meta} locale={locale} />
                  <div
                    className="prose-blog"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.75, color: 'var(--fg-1)' }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                  <ArticleCTA />
                  <RelatedArticles posts={related} locale={locale} />
                </div>
                <aside>
                  <TableOfContents wordCount={meta.wordCount} />
                </aside>
              </div>
            ) : (
              <>
                <ArticleHero meta={meta} locale={locale} />
                <div
                  className="prose-blog"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.75, color: 'var(--fg-1)' }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                <ArticleCTA />
                <RelatedArticles posts={related} locale={locale} />
              </>
            )}

            <footer style={{
              marginTop: 48, paddingTop: 24, paddingBottom: 96,
              borderTop: '1px solid var(--border-ds)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 16,
            }}>
              <Link
                href={blogPath}
                style={{ fontSize: 14, color: 'var(--ds-primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                ← Lire d'autres articles
              </Link>
              {meta.canonicalSlug && (
                <LocaleSwitcher
                  currentLocale={locale}
                  slug={meta.slug}
                  canonicalSlug={meta.canonicalSlug}
                />
              )}
            </footer>
          </Container>
        </article>
      </main>
    </div>
  )
}
