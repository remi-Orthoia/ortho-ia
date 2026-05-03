'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode, MouseEventHandler } from 'react'

// ===== Container — largeur max + padding horizontal cohérents =====
export const Container = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', ...style }}>{children}</div>
)

// ===== Eyebrow — petit label majuscule au-dessus des titres =====
export const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span style={{
    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-2)',
    ...style,
  }}>{children}</span>
)

// ===== Button — versions next/Link (interne) ou <a> (externe / ancre) =====
type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  onClick?: MouseEventHandler<HTMLElement>
  style?: CSSProperties
  type?: 'button' | 'submit' | 'reset'
  /** Lien externe ou ancre — utilise <a> au lieu de <Link>. */
  external?: boolean
  ariaLabel?: string
}

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 13 },
  md: { padding: '12px 20px', fontSize: 15 },
  lg: { padding: '16px 28px', fontSize: 16 },
}

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary:   { background: 'var(--ds-primary)', color: 'var(--fg-on-brand)', border: '1px solid transparent' },
  accent:    { background: 'var(--ds-accent)',  color: 'var(--brand-sage-900, #1F2A2A)', border: '1px solid transparent' },
  secondary: { background: 'var(--bg-surface)', color: 'var(--fg-1)', border: '1px solid var(--border-ds-strong)' },
  ghost:     { background: 'transparent', color: 'var(--fg-1)', border: '1px solid transparent' },
}

export const Button = ({
  children, variant = 'primary', size = 'md', href, onClick, style, type, external, ariaLabel,
}: ButtonProps) => {
  const css: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1,
    borderRadius: 999, cursor: 'pointer', textDecoration: 'none',
    transition: 'background 180ms cubic-bezier(0.32,0.72,0,1), transform 120ms',
    ...SIZES[size], ...VARIANTS[variant], ...style,
  }
  if (href) {
    if (external || href.startsWith('#') || href.startsWith('http')) {
      return <a href={href} style={css} onClick={onClick} aria-label={ariaLabel}>{children}</a>
    }
    return <Link href={href} style={css} aria-label={ariaLabel}>{children}</Link>
  }
  return <button type={type ?? 'button'} style={css} onClick={onClick} aria-label={ariaLabel}>{children}</button>
}
