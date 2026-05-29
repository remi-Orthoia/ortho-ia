import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { BlogPostPageContent } from '@/components/blog/pages/BlogPostPageContent'
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllPosts({ locale: 'fr-CH' }).map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  try {
    const { meta } = getPostBySlug(params.slug)
    const canonical = `${BASE_URL}/ch/blog/${meta.slug}`
    return {
      title: `${meta.title} — Ortho.ia Suisse`,
      description: meta.description,
      authors: [{ name: meta.author }],
      alternates: {
        canonical,
        languages: {
          'fr-CH': canonical,
          'fr-FR': `${BASE_URL}/blog/${meta.canonicalSlug ?? meta.slug}`,
          'fr-BE': `${BASE_URL}/be/blog/${meta.canonicalSlug ?? meta.slug}`,
        },
      },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: canonical,
        type: 'article',
        locale: 'fr_CH',
        publishedTime: meta.date,
        modifiedTime: meta.dateModified,
      },
    }
  } catch {
    return { title: 'Article introuvable — Ortho.ia' }
  }
}

export const dynamic = 'force-static'

export default function ChBlogPostPage({ params }: PageProps) {
  let post
  try {
    post = getPostBySlug(params.slug)
  } catch {
    notFound()
  }

  if (post.meta.locale !== 'fr-CH') notFound()

  const related = getRelatedPosts(post.meta, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.meta.date,
    dateModified: post.meta.dateModified ?? post.meta.date,
    author: { '@type': 'Person', name: post.meta.author },
    publisher: { '@type': 'Organization', name: 'Ortho.ia', url: BASE_URL },
    mainEntityOfPage: `${BASE_URL}/ch/blog/${post.meta.slug}`,
  }

  return (
    <>
      <Header />
      <BlogPostPageContent post={post} related={related} locale="ch" />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
