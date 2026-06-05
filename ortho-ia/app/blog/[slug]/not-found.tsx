import Link from 'next/link'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container } from '@/components/landing/Primitives'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { getAllPosts } from '@/lib/blog'

export default function BlogPostNotFound() {
  const suggestions = getAllPosts({ locale: 'fr-FR' }).slice(0, 3)

  return (
    <>
      <Header />
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <main>
          <Container style={{ maxWidth: 740, padding: '80px 24px 96px', textAlign: 'center' }}>
            <p style={{
              fontSize: 64, margin: '0 0 16px', lineHeight: 1,
            }}>404</p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 500, margin: '0 0 12px', color: 'var(--fg-1)',
            }}>Cet article est introuvable</h1>
            <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: '0 0 32px' }}>
              Il a peut-être été déplacé ou supprimé. Voici quelques articles récents.
            </p>
            <Link href="/blog" style={{
              display: 'inline-block',
              background: 'var(--ds-primary)', color: 'white',
              padding: '12px 24px', borderRadius: 12,
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              marginBottom: 56,
            }}>
              ← Retour au blog
            </Link>

            {suggestions.length > 0 && (
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--fg-3)',
                  margin: '0 0 16px',
                }}>Articles récents</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {suggestions.map((p) => (
                    <ArticleCard key={p.slug} post={p} locale="fr" />
                  ))}
                </div>
              </div>
            )}
          </Container>
        </main>
      </div>
      <Footer />
    </>
  )
}
