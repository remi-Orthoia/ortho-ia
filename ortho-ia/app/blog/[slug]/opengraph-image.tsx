import { ImageResponse } from 'next/og'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { getCocon, type CoconId } from '@/lib/blog-cocons'

export const alt = 'Article Ortho.ia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

// ----- Couleurs (hex en dur — les CSS vars du DS ne marchent pas en @vercel/og) -----
const COLORS = {
  cream: '#FAF6EF',
  paper: '#FFFDF8',
  sageInk: '#1F2A2A',
  sage900: '#1F2A2A',
  sage700: '#2E4A41',
  sage600: '#3F5E52',
  sage300: '#A8BBB1',
  terra600: '#C97B5E',
  terra100: '#F5D9CB',
  terra700: '#A55A3F',
  fg2: '#4A554F',
  fg3: '#74807A',
}

// ----- Label court par cocon, affiché en GROS dans la colonne droite -----
const COCON_BIG_LABEL: Record<CoconId, string> = {
  'redaction-crbo':   'CRBO',
  'logiciels':        'Logiciels',
  'outils-gratuits':  'Outils',
  'ia-innovation':    'IA',
  'vie-libe':         'Cabinet',
}

// Taille adaptive de la typo géante (Fraunces) selon la longueur du label
function bigFontSize(label: string): number {
  const len = label.length
  if (len <= 2) return 240
  if (len <= 4) return 168
  if (len <= 6) return 116
  return 88
}

// ----- Chargement Fraunces depuis Google Fonts (au runtime de la génération OG) -----
// IMPORTANT: Satori (le moteur de @vercel/og) ne supporte QUE TTF/OTF, PAS woff2.
// Sans User-Agent, Google Fonts sert du .ttf direct. Avec un UA Chrome moderne, il
// renverrait du woff2 → crash "Unsupported OpenType signature wOF2" au build.
async function loadFraunces(): Promise<Array<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: 'normal' }> | undefined> {
  try {
    const cssUrl = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap'
    // PAS de User-Agent → Google sert du TTF (compatible Satori)
    const css = await fetch(cssUrl).then(r => r.text())

    // Match strictement les URLs TTF/OTF (rejette woff2 si jamais Google en sert)
    const matches = Array.from(
      css.matchAll(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.(?:ttf|otf))\)\s*format\(['"](?:truetype|opentype)['"]\)/g)
    ).map(m => m[1])

    if (matches.length < 2) return undefined

    const [r500, r600] = await Promise.all([
      fetch(matches[0]).then(r => r.arrayBuffer()),
      fetch(matches[1]).then(r => r.arrayBuffer()),
    ])

    // Double-check: les fichiers TTF commencent par 0x00 0x01 0x00 0x00 (TrueType) ou "OTTO" (OpenType)
    // Les woff2 commencent par "wOF2" (0x77 0x4F 0x46 0x32) → on rejette
    const isValidFont = (buf: ArrayBuffer) => {
      const view = new DataView(buf)
      if (buf.byteLength < 4) return false
      const sig = view.getUint32(0)
      return sig === 0x00010000 || sig === 0x4F54544F // TTF or OTTO
    }
    if (!isValidFont(r500) || !isValidFont(r600)) return undefined

    return [
      { name: 'Fraunces', data: r500, weight: 500, style: 'normal' },
      { name: 'Fraunces', data: r600, weight: 600, style: 'normal' },
    ]
  } catch {
    return undefined
  }
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  // ----- Defaults (fallback si slug introuvable) -----
  let title = 'Le Blog Ortho.ia'
  let description = 'Articles pratiques pour orthophonistes libéraux.'
  let date = ''
  let author = "L'équipe Ortho.ia"
  let bigLabel = 'Ortho.ia'
  let coconSubtitle = 'Le blog pratique des orthophonistes.'

  try {
    const { meta } = getPostBySlug(params.slug)
    // Coupe au ":" pour garder la partie "racine" du titre (sans le sous-titre SEO)
    title = meta.title.split(' : ')[0].trim() || meta.title
    description = meta.description
    author = meta.author || author
    date = new Date(meta.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const cocon = getCocon(meta.cocon as CoconId)
    if (cocon) {
      bigLabel = COCON_BIG_LABEL[meta.cocon as CoconId] ?? cocon.label
      coconSubtitle = cocon.subtitle
    }
  } catch {
    // fallback déjà initialisé
  }

  const fonts = await loadFraunces()

  // ----- Adaptive title sizing -----
  const titleLen = title.length
  const titleSize = titleLen > 70 ? 40 : titleLen > 50 ? 48 : titleLen > 30 ? 56 : 64
  const bigSize = bigFontSize(bigLabel)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: COLORS.cream,
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        {/* ============================================================
            LEFT 60% — content (cream)
           ============================================================ */}
        <div
          style={{
            width: 720,
            height: 630,
            padding: '60px 56px 56px 64px',
            display: 'flex',
            flexDirection: 'column',
            background: COLORS.cream,
            position: 'relative',
          }}
        >
          {/* Top accent gradient bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: `linear-gradient(90deg, ${COLORS.sage600} 0%, ${COLORS.terra600} 100%)`,
              display: 'flex',
            }}
          />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: COLORS.sage600,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: COLORS.sage700,
                letterSpacing: '0.18em',
                display: 'flex',
              }}
            >
              ORTHO.IA
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, display: 'flex' }} />

          {/* Tag pill */}
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: COLORS.terra100,
              color: COLORS.terra700,
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            {bigLabel === 'CRBO' ? 'CRBO' : bigLabel}
          </div>

          {/* Title in Fraunces */}
          <div
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: titleSize,
              fontWeight: 500,
              lineHeight: 1.05,
              color: COLORS.sage900,
              letterSpacing: '-0.02em',
              marginBottom: 22,
              display: 'flex',
              maxWidth: 600,
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              lineHeight: 1.5,
              color: COLORS.fg2,
              maxWidth: 580,
              display: 'flex',
            }}
          >
            {description.length > 150 ? description.slice(0, 147) + '…' : description}
          </div>

          {/* Bottom meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: COLORS.fg3,
              marginTop: 28,
            }}
          >
            <div style={{ display: 'flex' }}>{author}</div>
            {date && (
              <>
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 2,
                    background: COLORS.fg3,
                    display: 'flex',
                  }}
                />
                <div style={{ display: 'flex' }}>{date}</div>
              </>
            )}
          </div>
        </div>

        {/* ============================================================
            RIGHT 40% — branded panel (sage gradient + big serif label)
           ============================================================ */}
        <div
          style={{
            width: 480,
            height: 630,
            background: `linear-gradient(135deg, ${COLORS.sage700} 0%, ${COLORS.sage900} 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Terracotta radial glow top-right */}
          <div
            style={{
              position: 'absolute',
              top: -140,
              right: -140,
              width: 380,
              height: 380,
              borderRadius: 190,
              background: `radial-gradient(circle, ${COLORS.terra600} 0%, transparent 70%)`,
              opacity: 0.32,
              display: 'flex',
            }}
          />

          {/* Sand subtle glow bottom-left */}
          <div
            style={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 260,
              height: 260,
              borderRadius: 130,
              background: `radial-gradient(circle, ${COLORS.sage300} 0%, transparent 70%)`,
              opacity: 0.15,
              display: 'flex',
            }}
          />

          {/* BIG label in Fraunces */}
          <div
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: bigSize,
              fontWeight: 500,
              color: COLORS.cream,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
            }}
          >
            {bigLabel}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 400,
              color: 'rgba(250, 246, 239, 0.72)',
              lineHeight: 1.5,
              textAlign: 'center',
              marginTop: 24,
              maxWidth: 360,
              position: 'relative',
              zIndex: 1,
              display: 'flex',
            }}
          >
            {coconSubtitle.length > 120 ? coconSubtitle.slice(0, 117) + '…' : coconSubtitle}
          </div>

          {/* Small "Ortho.ia" mark at bottom of right panel */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(250, 246, 239, 0.42)',
              letterSpacing: '0.22em',
              display: 'flex',
            }}
          >
            ORTHO·IA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts,
    }
  )
}
