import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { BlogPostPageContent } from '@/components/blog/pages/BlogPostPageContent'
import { getAllSlugs, getPostBySlug, getRelatedPosts, getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllPosts({ locale: 'fr-FR' }).map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  try {
    const { meta } = getPostBySlug(params.slug)
    const canonical = `${BASE_URL}/blog/${meta.slug}`
    const hreflangAlts: Record<string, string> = { 'fr-FR': canonical }
    if (meta.canonicalSlug) {
      hreflangAlts['fr-BE'] = `${BASE_URL}/be/blog/${meta.canonicalSlug}`
      hreflangAlts['fr-CH'] = `${BASE_URL}/ch/blog/${meta.canonicalSlug}`
    }
    return {
      title: `${meta.title} · Ortho.ia`,
      description: meta.description,
      authors: [{ name: meta.author }],
      keywords: meta.tags,
      alternates: {
        canonical,
        languages: hreflangAlts,
      },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: canonical,
        type: 'article',
        locale: 'fr_FR',
        publishedTime: meta.date,
        modifiedTime: meta.dateModified,
        authors: [meta.author],
        tags: meta.tags,
        images: meta.coverImage ? [{ url: meta.coverImage, alt: meta.coverAlt ?? meta.title }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: meta.title,
        description: meta.description,
        images: meta.coverImage ? [meta.coverImage] : undefined,
      },
    }
  } catch {
    return { title: 'Article introuvable · Ortho.ia' }
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

  if (post.meta.locale !== 'fr-FR') notFound()

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
    image: post.meta.coverImage ?? undefined,
    mainEntityOfPage: `${BASE_URL}/blog/${post.meta.slug}`,
    keywords: post.meta.tags.join(', '),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 2, name: post.meta.title, item: `${BASE_URL}/blog/${post.meta.slug}` },
    ],
  }

  return (
    <>
      <Header />
      <BlogPostPageContent post={post} related={related} locale="fr" />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  )
}
