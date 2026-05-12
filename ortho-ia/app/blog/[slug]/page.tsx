import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container } from '@/components/landing/Primitives'
import { getAllSlugs, getPostBySlug, formatPostDate } from '@/lib/blog'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  try {
    const { meta } = getPostBySlug(params.slug)
    const canonical = `https://ortho-ia.vercel.app/blog/${meta.slug}`
    return {
      title: `${meta.title} — Le Blog Ortho.ia`,
      description: meta.description,
      authors: [{ name: meta.author }],
      keywords: meta.tags,
      alternates: { canonical },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: canonical,
        type: 'article',
        locale: 'fr_FR',
        publishedTime: meta.date,
        authors: [meta.author],
        tags: meta.tags,
        images: meta.coverImage ? [{ url: meta.coverImage }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: meta.title,
        description: meta.description,
        images: meta.coverImage ? [meta.coverImage] : undefined,
      },
    }
  } catch {
    return { title: 'Article introuvable — Ortho.ia' }
  }
}

export const dynamic = 'force-static'

export default function BlogPostPage({ params }: PageProps) {
  let post
  try {
    post = getPostBySlug(params.slug)
  } catch {
    notFound()
  }
  const { meta, html } = post

  // JSON-LD pour Google Article — structured data.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    author: { '@type': 'Person', name: meta.author },
    publisher: {
      '@type': 'Organization',
      name: 'Ortho.ia',
      url: 'https://ortho-ia.vercel.app',
    },
    image: meta.coverImage ?? undefined,
    mainEntityOfPage: `https://ortho-ia.vercel.app/blog/${meta.slug}`,
  }

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <Header />
      <main>
        <article style={{ padding: '64px 0 96px' }}>
          <Container style={{ maxWidth: 740 }}>
            <Link
              href="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 14, color: 'var(--fg-3)', textDecoration: 'none',
                marginBottom: 24,
              }}
            >
              ← Le Blog
            </Link>

            {meta.tags.length > 0 && (
              <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {meta.tags.map((t) => (
                  <span key={t} style={{
                    background: 'var(--ds-accent-soft)',
                    color: 'var(--ds-accent-hover)',
                    padding: '2px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                  }}>{t}</span>
                ))}
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 44px)',
              fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em',
              margin: '0 0 16px', color: 'var(--fg-1)', textWrap: 'balance',
            }}>{meta.title}</h1>

            <p style={{
              fontSize: 18, lineHeight: 1.55, color: 'var(--fg-2)',
              margin: '0 0 24px', maxWidth: 640,
            }}>{meta.description}</p>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              fontSize: 13, color: 'var(--fg-3)', marginBottom: 40,
              paddingBottom: 24, borderBottom: '1px solid var(--border-ds)',
            }}>
              <span>{meta.author}</span>
              <span aria-hidden="true">·</span>
              <span>{formatPostDate(meta.date)}</span>
              <span aria-hidden="true">·</span>
              <span>{meta.readingTime} min de lecture</span>
            </div>

            <div
              className="prose-blog"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.7,
                color: 'var(--fg-1)',
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div style={{
              marginTop: 64, paddingTop: 32,
              borderTop: '1px solid var(--border-ds)',
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <Link
                href="/blog"
                style={{ fontSize: 14, color: 'var(--ds-primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                ← Lire d'autres articles
              </Link>
              <Link
                href="/auth/register"
                style={{ fontSize: 14, color: 'var(--ds-primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                Essayer Ortho.ia gratuitement →
              </Link>
            </div>
          </Container>
        </article>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
