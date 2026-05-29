import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container, Eyebrow } from '@/components/landing/Primitives'
import { GlossaireIndex } from '@/components/blog/GlossaireIndex'
import { getAllTerms } from '@/lib/glossaire-data'

const BASE_URL = 'https://ortho-ia.com'

export const metadata: Metadata = {
  title: 'Glossaire orthophonie · Ortho.ia',
  description:
    "Définitions précises des termes orthophoniques : CRBO, percentile, dyslexie, boucle phonologique, RAN, MoCA… Rédigées pour les orthophonistes et logopèdes.",
  alternates: { canonical: `${BASE_URL}/glossaire` },
  openGraph: {
    title: 'Glossaire orthophonie · Ortho.ia',
    description: "Définitions des termes clés en orthophonie et logopédie.",
    url: `${BASE_URL}/glossaire`,
    type: 'website',
    locale: 'fr_FR',
  },
}

export const dynamic = 'force-static'

export default function GlossairePage() {
  const terms = getAllTerms()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Glossaire orthophonie Ortho.ia',
    url: `${BASE_URL}/glossaire`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.label,
      description: t.definition,
      url: `${BASE_URL}/glossaire/${t.slug}`,
    })),
  }

  return (
    <>
      <Header />
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <main>
          <Container style={{ maxWidth: 860, padding: '80px 24px 96px' }}>
            <Eyebrow>Glossaire</Eyebrow>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 50px)',
                fontWeight: 500, lineHeight: 1.1,
                letterSpacing: '-0.015em',
                margin: '12px 0 16px',
                textWrap: 'balance',
                color: 'var(--fg-1)',
              } as React.CSSProperties}
            >
              Vocabulaire orthophonique
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 48px', maxWidth: 580 }}>
              {terms.length} termes définis avec précision clinique, pour rédiger, comprendre
              et transmettre sans ambiguïté.
            </p>
            <GlossaireIndex terms={terms} />
          </Container>
        </main>
      </div>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
