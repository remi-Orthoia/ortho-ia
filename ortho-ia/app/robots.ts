import type { MetadataRoute } from 'next'

const BASE_URL = 'https://ortho-ia.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/auth', '/ref', '/dev', '/share'] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
