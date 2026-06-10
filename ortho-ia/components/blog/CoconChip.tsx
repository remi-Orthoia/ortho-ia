/**
 * Chip de cocon affichée sur les cards d'article et dans la nav.
 *
 * Variantes :
 *   - default : chip cliquable (Link vers /blog/categorie/<slug>)
 *   - active  : chip mise en avant (page catégorie en cours)
 *   - static  : juste un span, pas de Link (pour usage in-card sans nested-a)
 */

import Link from 'next/link'
import type { CoconConfig } from '@/lib/cocons'

interface CoconChipProps {
  cocon: CoconConfig
  variant?: 'default' | 'active' | 'static'
}

export function CoconChip({ cocon, variant = 'default' }: CoconChipProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.01em',
    textDecoration: 'none',
    border: '1px solid transparent',
    transition: 'background 160ms ease, border-color 160ms ease',
  }

  const variantStyle: React.CSSProperties =
    variant === 'active'
      ? {
          background: cocon.color,
          color: '#FFFFFF',
          borderColor: cocon.color,
        }
      : {
          background: cocon.bg,
          color: cocon.fg,
          borderColor: cocon.bg,
        }

  const style = { ...baseStyle, ...variantStyle }

  if (variant === 'static') {
    return <span style={style}>{cocon.label}</span>
  }

  return (
    <Link href={`/blog/categorie/${cocon.slug}`} style={style}>
      {cocon.label}
    </Link>
  )
}
