import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cgu`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/roadmap`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/beta`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const posts = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'yearly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...posts]
}
