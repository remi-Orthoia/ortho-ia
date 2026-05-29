import { ImageResponse } from 'next/og'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'

export const alt = 'Article Ortho.ia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default function OgImage({ params }: { params: { slug: string } }) {
  let title = 'Le Blog Ortho.ia'
  let description = 'Articles pratiques pour orthophonistes'
  let tags: string[] = []

  try {
    const { meta } = getPostBySlug(params.slug)
    title = meta.title
    description = meta.description
    tags = meta.tags.slice(0, 3)
  } catch {
    // fallback to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px 64px',
          background: '#FAF6EF',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 48, left: 64,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#3F5E52',
          }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#3F5E52', letterSpacing: '0.05em' }}>
            ORTHO.IA
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {tags.map((t) => (
              <span key={t} style={{
                background: '#F5E6DC', color: '#C97B5E',
                padding: '4px 14px', borderRadius: 999,
                fontSize: 14, fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: title.length > 60 ? 38 : 46,
          fontWeight: 700,
          lineHeight: 1.2,
          color: '#1F2A2A',
          marginBottom: 20,
          maxWidth: 900,
        }}>
          {title}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 20,
          color: '#4A5A5A',
          lineHeight: 1.5,
          maxWidth: 800,
        }}>
          {description.length > 120 ? description.slice(0, 117) + '…' : description}
        </div>

        {/* Bottom accent bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 6, background: '#3F5E52',
        }} />
      </div>
    ),
    { ...size }
  )
}
