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
  if (!cocon) return { title: 'Thème introuvable — Ortho.ia' }
  return {
    title: `${cocon.label} — Blog Ortho.ia Belgique`,
    alternates: { canonical: `${BASE_URL}/be/blog/cocon/${cocon.id}` },
  }
}

export const dynamic = 'force-static'

export default function BeCoconPage({ params }: PageProps) {
  const cocon = getCocon(params.id as CoconId)
  if (!cocon) notFound()

  const posts = getCoconPosts(cocon.id, 'fr-BE')

  return (
    <>
      <Header />
      <CoconPageContent coconId={cocon.id} posts={posts} locale="be" />
      <Footer />
    </>
  )
}
