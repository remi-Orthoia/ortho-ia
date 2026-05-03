import type { CSSProperties } from 'react'

/**
 * Logo Ortho.ia — composant SVG inline.
 *
 * Variants :
 *  - variant="light" (défaut) : pour fond clair (canvas / surface). Cercle
 *    sauge 600, "Ortho" sage 900, "." sage 600, "ia" terracotta.
 *  - variant="dark" : pour fond sombre (sidebar inverse, panes auth). Cercle
 *    sage 700, "Ortho" cream, "." sage 300, "ia" terracotta.
 *
 * Modes :
 *  - défaut : symbole + texte + tagline "ORTHOPHONIE · IA"
 *  - withoutTagline : symbole + texte seul (sidebars étroites)
 *  - symbolOnly : juste le cercle + plume (favoris, profile pic, footer compact)
 *
 * Sizing : passer `height` (px). La largeur s'adapte automatiquement via
 * viewBox. Le composant occupe la place réelle du SVG, pas de padding caché.
 */

export type LogoVariant = 'light' | 'dark'

interface LogoProps {
  variant?: LogoVariant
  /** Hauteur en pixels. Défaut : 40 pour horizontal, 32 pour symbolOnly. */
  height?: number
  /** Cache la tagline "ORTHOPHONIE · IA". */
  withoutTagline?: boolean
  /** Affiche uniquement le cercle + plume (carré). */
  symbolOnly?: boolean
  className?: string
  style?: CSSProperties
  /** ARIA label — défaut : "Ortho.ia". */
  ariaLabel?: string
  /** Si true, retire le role/aria-label (logo purement décoratif). */
  decorative?: boolean
}

/**
 * Plume centrale — utilisée à l'intérieur du cercle. Composé du corps,
 * d'une ombre interne, de la nervure, des barbules latérales et de la
 * pointe terracotta.
 *
 * `nervColor` : couleur de la nervure et des barbules (= couleur du cercle).
 */
function Feather({ nervColor }: { nervColor: string }) {
  return (
    <g transform="translate(0 0) rotate(-35)">
      {/* Corps */}
      <path
        d="M0,-22 C5,-16 8,-6 6,6 C4,14 1,19 0,22 C-1,19 -4,14 -6,6 C-8,-6 -5,-16 0,-22Z"
        fill="#FAF6EF" opacity="0.96"
      />
      {/* Ombre interne */}
      <path
        d="M0,-17 C4,-10 5,-2 3,8 C2,13 0,17 0,17 C-1,10 -4,-2 0,-17Z"
        fill="#A8BBB1" opacity="0.38"
      />
      {/* Nervure */}
      <line x1="0" y1="-19" x2="0" y2="19" stroke={nervColor} strokeWidth="1.3" strokeLinecap="round" />
      {/* Barbules gauche */}
      <path d="M0,-12 C-5,-9 -9,-6 -11,-3" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.52" />
      <path d="M0,-4 C-6,-1 -10,2 -12,5" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.52" />
      <path d="M0,5 C-5,8 -9,11 -10,14" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.44" />
      {/* Barbules droite */}
      <path d="M0,-12 C5,-9 9,-6 11,-3" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.52" />
      <path d="M0,-4 C6,-1 10,2 12,5" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.52" />
      <path d="M0,5 C5,8 9,11 10,14" fill="none" stroke={nervColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.44" />
      {/* Pointe terracotta */}
      <path d="M0,19 C3,25 2,31 0,36 C-2,31 -3,25 0,19Z" fill="#C97B5E" />
      <path d="M0,32 C4,35 9,34 13,32" fill="none" stroke="#C97B5E" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

export default function Logo({
  variant = 'light',
  height,
  withoutTagline = false,
  symbolOnly = false,
  className,
  style,
  ariaLabel = 'Ortho.ia',
  decorative = false,
}: LogoProps) {
  const isDark = variant === 'dark'

  // Couleurs selon variant — cercle + couleur de la nervure interne
  const circleFill = isDark ? '#2E4A41' : '#3F5E52'
  const nervColor = isDark ? '#2E4A41' : '#3F5E52'

  // Couleurs du texte
  const orthoColor = isDark ? '#FAF6EF' : '#1F2A2A'
  const dotColor = isDark ? '#A8BBB1' : '#3F5E52'
  const iaColor = '#C97B5E' // terracotta — identique dans les deux modes
  const taglineColor = '#74807A'

  const a11y = decorative
    ? { 'aria-hidden': true as const, role: undefined }
    : { role: 'img' as const, 'aria-label': ariaLabel }

  // ============ Mode symbole seul (favoris, profile pic) ============
  if (symbolOnly) {
    const h = height ?? 32
    return (
      <svg
        width={h}
        height={h}
        viewBox="0 0 64 64"
        className={className}
        style={style}
        {...a11y}
      >
        <circle cx="32" cy="32" r="30" fill={circleFill} />
        <g transform="translate(32 32)">
          <Feather nervColor={nervColor} />
        </g>
      </svg>
    )
  }

  // ============ Mode horizontal complet ============
  // viewBox cale : cercle r=32 cx=40 cy=55, texte commence à x=90, panneau total
  // ~250×110 si avec tagline, ~250×90 sans tagline.
  const h = height ?? 40
  const viewW = withoutTagline ? 250 : 260
  const viewH = withoutTagline ? 90 : 110

  return (
    <svg
      width={(h * viewW) / viewH}
      height={h}
      viewBox={`0 0 ${viewW} ${viewH}`}
      className={className}
      style={style}
      {...a11y}
    >
      {/* Cercle + plume */}
      <circle cx="40" cy="55" r="32" fill={circleFill} />
      <g transform="translate(40 55)">
        <Feather nervColor={nervColor} />
      </g>

      {/* Texte "Ortho.ia" centré verticalement sur le cercle (cy=55) */}
      <text
        x="90"
        y="49"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="400"
        letterSpacing="-0.02em"
        dominantBaseline="middle"
        fill={orthoColor}
      >
        Ortho<tspan fill={dotColor}>.</tspan><tspan fill={iaColor}>ia</tspan>
      </text>

      {/* Tagline "ORTHOPHONIE · IA" sous le texte principal */}
      {!withoutTagline && (
        <text
          x="91"
          y="75"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="10"
          fontWeight="500"
          letterSpacing="0.14em"
          fill={taglineColor}
        >
          ORTHOPHONIE · IA
        </text>
      )}
    </svg>
  )
}
