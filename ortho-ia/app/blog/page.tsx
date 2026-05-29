import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { BlogListPageContent } from '@/components/blog/pages/BlogListPageContent'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

export const metadata: Metadata = {
  title: 'Le Blog · Ortho.ia',
  description:
    "Articles pratiques pour orthophonistes : rédaction CRBO, étalonnages, neurosciences cognitives, outils numériques. Par des orthophonistes en exercice.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Le Blog · Ortho.ia',
    description: "Articles pratiques pour orthophonistes : rédaction CRBO, étalonnages, neurosciences cognitives, outils numériques.",
    url: `${BASE_URL}/blog`,
    type: 'website',
    locale: 'fr_FR',
  },
}

export const dynamic = 'force-static'

export default function BlogIndexPage() {
  const posts = getAllPosts({ locale: 'fr-FR' })

  return (
    <>
      <Header />
      <BlogListPageContent posts={posts} locale="fr" />
      <Footer />
    </>
  )
}
