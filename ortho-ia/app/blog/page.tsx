import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container, Eyebrow } from '@/components/landing/Primitives'
import { getAllPosts, formatPostDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Le Blog — Ortho.ia',
  description:
    "Articles, retours d'expérience et conseils pratiques pour les orthophonistes : rédaction du CRBO, étalonnages, neurosciences cognitives, outils numériques.",
  alternates: { canonical: 'https://ortho-ia.vercel.app/blog' },
  openGraph: {
    title: 'Le Blog — Ortho.ia',
    description:
      "Articles, retours d'expérience et conseils pratiques pour les orthophonistes.",
    url: 'https://ortho-ia.vercel.app/blog',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const dynamic = 'force-static'

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <Header />
      <main>
        <section style={{ padding: '80px 0 32px' }}>
          <Container style={{ maxWidth: 880 }}>
            <Eyebrow>Le Blog</Eyebrow>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.015em',
              margin: '12px 0 16px', textWrap: 'balance', color: 'var(--fg-1)',
            }}>
              Penser, écrire, transmettre.
            </h1>
            <p style={{
              fontSize: 18, lineHeight: 1.6, color: 'var(--fg-2)',
              margin: 0, maxWidth: 640,
            }}>
              Pratique clinique, étalonnages, neurosciences cognitives, écriture du CRBO,
              outils numériques en cabinet. Sans bullshit, par des orthophonistes en exercice.
            </p>
          </Container>
        </section>

        <section style={{ padding: '24px 0 96px' }}>
          <Container style={{ maxWidth: 880 }}>
            {posts.length === 0 ? (
              <p style={{ color: 'var(--fg-3)', fontSize: 16 }}>
                Premiers articles à venir. Revenez très bientôt !
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {posts.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      style={{
                        display: 'block', textDecoration: 'none', color: 'inherit',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-ds)',
                        borderRadius: 20,
                        padding: 24,
                        transition: 'transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms',
                      }}
                      className="ds-card-interactive"
                    >
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
                        fontSize: 13, color: 'var(--fg-3)', marginBottom: 10,
                      }}>
                        <span>{formatPostDate(p.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.readingTime} min de lecture</span>
                        {p.tags.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                              {p.tags.slice(0, 3).map((t) => (
                                <span key={t} style={{
                                  background: 'var(--ds-accent-soft)',
                                  color: 'var(--ds-accent-hover)',
                                  padding: '2px 8px', borderRadius: 999,
                                  fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                                }}>{t}</span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
                        margin: '0 0 8px', color: 'var(--fg-1)', letterSpacing: '-0.01em',
                      }}>{p.title}</h2>
                      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>
                        {p.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  )
}
