import type { CSSProperties, ReactNode } from 'react'

/**
 * Wrapper SVG minimal — équivalent du Icon helper du design system Stéphanie.
 * Préfère lucide-react quand un icône existe ; ce composant est utile pour des
 * SVG custom (logo Ortho, marques de section, etc.).
 */
interface Props {
  children: ReactNode
  size?: number
  strokeWidth?: number
  style?: CSSProperties
  className?: string
  ariaLabel?: string
}

export default function Icon({
  children, size = 18, strokeWidth = 1.75, style, className, ariaLabel,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      style={style}
      className={className}
    >
      {children}
    </svg>
  )
}
