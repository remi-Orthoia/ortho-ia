import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { COCONS } from '@/lib/blog-cocons'
import { getAllTerms } from '@/lib/glossaire-data'

const BASE_URL = 'https://ortho-ia.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/blog`,          changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/glossaire`,     changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/outils`,        changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/be/blog`,       changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/ch/blog`,       changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cgu`,           changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/roadmap`,       changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE_URL}/beta`,          changeFrequency: 'monthly', priority: 0.4 },
  ]

  const coconRoutes: MetadataRoute.Sitemap = COCONS.flatMap((c) => [
    { url: `${BASE_URL}/blog/theme/${c.id}`,    changeFrequency: 'weekly' as const, priority: 0.75 },
    { url: `${BASE_URL}/be/blog/theme/${c.id}`, changeFrequency: 'weekly' as const, priority: 0.65 },
    { url: `${BASE_URL}/ch/blog/theme/${c.id}`, changeFrequency: 'weekly' as const, priority: 0.65 },
  ])

  const frPosts = getAllPosts({ locale: 'fr-FR' }).map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.dateModified ?? p.date),
    changeFrequency: 'yearly' as const,
    priority: p.isPillar ? 0.85 : 0.75,
  }))

  const bePosts = getAllPosts({ locale: 'fr-BE' }).map((p) => ({
    url: `${BASE_URL}/be/blog/${p.slug}`,
    lastModified: new Date(p.dateModified ?? p.date),
    changeFrequency: 'yearly' as const,
    priority: p.isPillar ? 0.75 : 0.65,
  }))

  const chPosts = getAllPosts({ locale: 'fr-CH' }).map((p) => ({
    url: `${BASE_URL}/ch/blog/${p.slug}`,
    lastModified: new Date(p.dateModified ?? p.date),
    changeFrequency: 'yearly' as const,
    priority: p.isPillar ? 0.75 : 0.65,
  }))

  const glossaireRoutes = getAllTerms().map((t) => ({
    url: `${BASE_URL}/glossaire/${t.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...coconRoutes,
    ...frPosts,
    ...bePosts,
    ...chPosts,
    ...glossaireRoutes,
  ]
}
