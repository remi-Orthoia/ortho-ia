import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { BlogListPageContent } from '@/components/blog/pages/BlogListPageContent'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

export const metadata: Metadata = {
  title: 'Le Blog · Ortho.ia Belgique',
  description:
    "Articles pratiques pour logopèdes belges : rédaction de bilans, étalonnages, neurosciences cognitives, outils numériques.",
  alternates: {
    canonical: `${BASE_URL}/be/blog`,
    languages: { 'fr-FR': `${BASE_URL}/blog`, 'fr-BE': `${BASE_URL}/be/blog`, 'fr-CH': `${BASE_URL}/ch/blog` },
  },
  openGraph: {
    title: 'Le Blog · Ortho.ia Belgique',
    url: `${BASE_URL}/be/blog`,
    type: 'website',
    locale: 'fr_BE',
  },
}

export const dynamic = 'force-static'

export default function BeBlogIndexPage() {
  const posts = getAllPosts({ locale: 'fr-BE' })

  return (
    <>
      <Header />
      <BlogListPageContent posts={posts} locale="be" />
      <Footer />
    </>
  )
}
