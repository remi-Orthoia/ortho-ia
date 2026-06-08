import { getAllPosts, getPostBySlug } from '@/lib/blog'

const BASE_URL = 'https://ortho-ia.com'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts({ locale: 'fr-FR' }).slice(0, 20)

  const items = posts.map((p) => {
    let html = ''
    try {
      html = getPostBySlug(p.slug).html
    } catch {
      html = p.description
    }
    return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${BASE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>
      <description><![CDATA[${p.description}]]></description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <author>noreply@ortho-ia.com (${p.author})</author>
      ${p.tags.map((t) => `<category>${t}</category>`).join('\n      ')}
    </item>`
  }).join('')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Le Blog Ortho.ia</title>
    <link>${BASE_URL}/blog</link>
    <description>Articles pratiques pour orthophonistes : rédaction CRBO, étalonnages, neurosciences cognitives, outils numériques.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/og-default.png</url>
      <title>Le Blog Ortho.ia</title>
      <link>${BASE_URL}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
