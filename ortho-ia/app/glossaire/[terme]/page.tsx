import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container } from '@/components/landing/Primitives'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { getAllTerms, getTermBySlug } from '@/lib/glossaire-data'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

interface PageProps {
  params: { terme: string }
}

export function generateStaticParams() {
  return getAllTerms().map((t) => ({ terme: t.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const term = getTermBySlug(params.terme)
  if (!term) return { title: 'Terme introuvable — Ortho.ia' }
  return {
    title: `${term.label} — Glossaire Ortho.ia`,
    description: term.definition,
    alternates: { canonical: `${BASE_URL}/glossaire/${term.slug}` },
    openGraph: {
      title: `${term.label} — Glossaire orthophonie`,
      description: term.definition,
      url: `${BASE_URL}/glossaire/${term.slug}`,
      type: 'article',
      locale: 'fr_FR',
    },
  }
}

export const dynamic = 'force-static'

export default function TermePage({ params }: PageProps) {
  const term = getTermBySlug(params.terme)
  if (!term) notFound()

  const allPosts = getAllPosts({ locale: 'fr-FR' })
  const relatedPosts = allPosts
    .filter((p) =>
      p.tags.some((t) => t.toLowerCase().includes(term.label.toLowerCase())) ||
      p.title.toLowerCase().includes(term.label.toLowerCase())
    )
    .slice(0, 3)

  const relatedTerms = (term.relatedSlugs ?? [])
    .map((s) => getTermBySlug(s))
    .filter(Boolean) as typeof term[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.label,
    description: term.definition,
    url: `${BASE_URL}/glossaire/${term.slug}`,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossaire Ortho.ia', url: `${BASE_URL}/glossaire` },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Glossaire', item: `${BASE_URL}/glossaire` },
      { '@type': 'ListItem', position: 2, name: term.label, item: `${BASE_URL}/glossaire/${term.slug}` },
    ],
  }

  return (
    <>
      <Header />
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <main>
          <Container style={{ maxWidth: 740, padding: '64px 24px 96px' }}>
            <nav aria-label="Fil d'Ariane" style={{
              display: 'flex', gap: 8, alignItems: 'center',
              fontSize: 13, color: 'var(--fg-3)', marginBottom: 32,
            }}>
              <Link href="/glossaire" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Glossaire</Link>
              <span aria-hidden="true">›</span>
              <span style={{ color: 'var(--fg-2)' }}>{term.label}</span>
            </nav>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 500, lineHeight: 1.15,
              letterSpacing: '-0.015em',
              margin: '0 0 20px', color: 'var(--fg-1)',
            }}>{term.label}</h1>

            <p style={{
              fontSize: 18, lineHeight: 1.65,
              color: 'var(--fg-2)',
              margin: '0 0 24px',
              fontStyle: 'italic',
            }}>{term.definition}</p>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-ds)',
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 40,
            }}>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--fg-1)', margin: 0 }}>
                {term.detail}
              </p>
            </div>

            {relatedTerms.length > 0 && (
              <section style={{ marginBottom: 48 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20, fontWeight: 500,
                  margin: '0 0 16px', color: 'var(--fg-1)',
                }}>Termes associés</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {relatedTerms.map((t) => (
                    <Link key={t.slug} href={`/glossaire/${t.slug}`} style={{
                      padding: '8px 16px', borderRadius: 999,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-ds)',
                      fontSize: 14, color: 'var(--ds-primary)',
                      textDecoration: 'none', fontWeight: 500,
                    }}>{t.label}</Link>
                  ))}
                </div>
              </section>
            )}

            {relatedPosts.length > 0 && (
              <section style={{ marginBottom: 48 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20, fontWeight: 500,
                  margin: '0 0 16px', color: 'var(--fg-1)',
                }}>Articles liés</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {relatedPosts.map((p) => (
                    <ArticleCard key={p.slug} post={p} locale="fr" />
                  ))}
                </div>
              </section>
            )}

            <div style={{
              background: 'var(--ds-primary-soft)',
              borderLeft: '4px solid var(--ds-primary)',
              borderRadius: '0 16px 16px 0',
              padding: '20px 24px',
            }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 500, margin: '0 0 8px', color: 'var(--fg-1)',
              }}>Rédigez votre CRBO sans jargon</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 14px' }}>
                Ortho.ia génère un compte rendu de bilan lisible par les médecins, les familles et les enseignants.
              </p>
              <Link href="/auth/register" style={{
                display: 'inline-block',
                background: 'var(--ds-accent)', color: 'white',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}>Essayer gratuitement</Link>
            </div>
          </Container>
        </main>
      </div>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  )
}
