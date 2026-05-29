import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { CoconPageContent } from '@/components/blog/pages/CoconPageContent'
import { getCoconPosts } from '@/lib/blog'
import { COCONS, getCocon } from '@/lib/blog-cocons'
import type { CoconId } from '@/lib/blog-cocons'

const BASE_URL = 'https://ortho-ia.com'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return COCONS.map((c) => ({ id: c.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const cocon = getCocon(params.id as CoconId)
  if (!cocon) return { title: 'Thème introuvable · Ortho.ia' }
  return {
    title: `${cocon.label} · Blog Ortho.ia`,
    description: `Tous les articles Ortho.ia sur le thème "${cocon.label}" : pratique clinique, outils, rédaction.`,
    alternates: { canonical: `${BASE_URL}/blog/cocon/${cocon.id}` },
    openGraph: {
      title: `${cocon.label} · Blog Ortho.ia`,
      url: `${BASE_URL}/blog/cocon/${cocon.id}`,
      type: 'website',
      locale: 'fr_FR',
    },
  }
}

export const dynamic = 'force-static'

export default function CoconPage({ params }: PageProps) {
  const cocon = getCocon(params.id as CoconId)
  if (!cocon) notFound()

  const posts = getCoconPosts(cocon.id, 'fr-FR')

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 2, name: cocon.label, item: `${BASE_URL}/blog/cocon/${cocon.id}` },
    ],
  }

  return (
    <>
      <Header />
      <CoconPageContent coconId={cocon.id} posts={posts} locale="fr" />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  )
}
