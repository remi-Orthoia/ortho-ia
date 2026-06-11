/**
 * Page d'une catégorie (= cocon) du blog : /blog/categorie/<slug>
 *
 * Liste tous les articles du cocon, avec la même UX que /blog (nav + cards).
 * Generated statiquement à partir de COCON_SLUGS.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container, Eyebrow } from '@/components/landing/Primitives'
import { CoconNav } from '@/components/blog/CoconNav'
import { PostCard } from '@/components/blog/PostCard'
import { getPostsByCocon } from '@/lib/blog'
import { COCON_SLUGS, getCocon } from '@/lib/cocons'

interface PageProps {
  params: { slug: string }
}

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return COCON_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const cocon = getCocon(params.slug)
  if (!cocon) {
    return { title: 'Catégorie introuvable · Ortho.ia' }
  }
  const url = `https://ortho-ia.vercel.app/blog/categorie/${cocon.slug}`
  const title = `${cocon.label} · Le Blog Ortho.ia`
  return {
    title,
    description: cocon.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: cocon.description,
      url,
      type: 'website',
      locale: 'fr_FR',
    },
  }
}

export default function CoconPage({ params }: PageProps) {
  const cocon = getCocon(params.slug)
  if (!cocon) return notFound()

  const posts = getPostsByCocon(cocon.slug)

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <Header />
      <main>
        <section style={{ padding: '80px 0 32px' }}>
          <Container style={{ maxWidth: 880 }}>
            <Eyebrow>Catégorie</Eyebrow>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                margin: '12px 0 16px',
                textWrap: 'balance',
                color: 'var(--fg-1)',
              }}
            >
              {cocon.label}
            </h1>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: 'var(--fg-2)',
                margin: 0,
                maxWidth: 640,
              }}
            >
              {cocon.description}
            </p>
          </Container>
        </section>

        <section style={{ padding: '24px 0 96px' }}>
          <Container style={{ maxWidth: 880 }}>
            <CoconNav activeCocon={cocon.slug} />

            {posts.length === 0 ? (
              <p
                style={{
                  color: 'var(--fg-3)',
                  fontSize: 16,
                  padding: '32px 0',
                  textAlign: 'center',
                }}
              >
                Aucun article publié dans cette catégorie pour le moment.
                <br />
                Les premiers arrivent bientôt.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                {posts.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
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
