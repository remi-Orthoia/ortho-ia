import { Container } from '@/components/landing/Primitives'
import { CoconFilter } from '@/components/blog/CoconFilter'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { getCocon } from '@/lib/blog-cocons'
import type { CoconId } from '@/lib/blog-cocons'
import type { PostMeta } from '@/lib/blog'
import type { LocaleCode } from '@/lib/locales'

interface CoconPageContentProps {
  coconId: CoconId
  posts: PostMeta[]
  locale?: LocaleCode
}

export function CoconPageContent({ coconId, posts, locale = 'fr' }: CoconPageContentProps) {
  const cocon = getCocon(coconId)
  const pillar = posts.filter((p) => p.isPillar)
  const satellites = posts.filter((p) => !p.isPillar)

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <main>
        <Container style={{ maxWidth: 900 }}>
          <section style={{ padding: '80px 0 32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--ds-primary-soft)',
              color: 'var(--ds-primary)',
              padding: '6px 14px', borderRadius: 999,
              fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              <span aria-hidden="true">{cocon?.icon}</span>
              {cocon?.label}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 46px)',
              fontWeight: 500, lineHeight: 1.1,
              letterSpacing: '-0.015em',
              margin: '0 0 16px',
              color: 'var(--fg-1)',
              textWrap: 'balance',
            } as React.CSSProperties}>
              {cocon?.label}
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0 }}>
              Tous les articles sur le thème <strong>{cocon?.label}</strong>
              {pillar.length > 0 && " — l'article clé en tête, suivi des articles de fond."}.
            </p>
          </section>

          <div style={{ marginBottom: 32 }}>
            <CoconFilter locale={locale} activeCocon={coconId} />
          </div>

          {pillar.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--fg-3)',
                margin: '0 0 16px',
              }}>À lire en premier</p>
              <ArticleCard post={pillar[0]} locale={locale} featured />
            </section>
          )}

          {satellites.length > 0 && (
            <section style={{ paddingBottom: 96 }}>
              {pillar.length > 0 && (
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--fg-3)',
                  margin: '0 0 16px',
                }}>Articles de fond</p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: 16,
              }}>
                {satellites.map((p) => (
                  <ArticleCard key={p.slug} post={p} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {posts.length === 0 && (
            <p style={{ color: 'var(--fg-3)', fontSize: 16, padding: '40px 0 96px' }}>
              Premiers articles à venir sur ce thème.
            </p>
          )}
        </Container>
      </main>
    </div>
  )
}
