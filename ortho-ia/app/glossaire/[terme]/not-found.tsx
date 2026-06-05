import Link from 'next/link'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container } from '@/components/landing/Primitives'
import { getAllTerms } from '@/lib/glossaire-data'

export default function TermeNotFound() {
  const suggestions = getAllTerms().slice(0, 6)

  return (
    <>
      <Header />
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <main>
          <Container style={{ maxWidth: 640, padding: '80px 24px 96px', textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 500, margin: '0 0 12px', color: 'var(--fg-1)',
            }}>Terme introuvable</h1>
            <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: '0 0 32px' }}>
              Ce terme n'est pas encore dans notre glossaire.
            </p>
            <Link href="/glossaire" style={{
              display: 'inline-block',
              background: 'var(--ds-primary)', color: 'white',
              padding: '12px 24px', borderRadius: 12,
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              marginBottom: 48,
            }}>
              ← Retour au glossaire
            </Link>

            <div style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--fg-3)',
                margin: '0 0 16px',
              }}>Quelques termes du glossaire</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map((t) => (
                  <Link key={t.slug} href={`/glossaire/${t.slug}`} style={{
                    padding: '8px 16px', borderRadius: 999,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-ds)',
                    fontSize: 14, color: 'var(--ds-primary)',
                    textDecoration: 'none', fontWeight: 500,
                  }}>{t.label}</Link>
                ))}
              </div>
            </div>
          </Container>
        </main>
      </div>
      <Footer />
    </>
  )
}
