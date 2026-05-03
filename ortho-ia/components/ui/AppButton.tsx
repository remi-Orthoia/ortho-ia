'use client'

import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import Link from 'next/link'

export type AppButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
export type AppButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  children: ReactNode
  variant?: AppButtonVariant
  size?: AppButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  type?: 'button' | 'submit' | 'reset'
  href?: string
  /** Lien externe / ancre — utilise <a>, sinon next/link */
  external?: boolean
  disabled?: boolean
  loading?: boolean
  style?: CSSProperties
  className?: string
  ariaLabel?: string
  title?: string
}

const SIZES: Record<AppButtonSize, CSSProperties> = {
  sm: { padding: '7px 12px', fontSize: 13, borderRadius: 8 },
  md: { padding: '10px 16px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '12px 20px', fontSize: 15, borderRadius: 12 },
}

const VARIANTS: Record<AppButtonVariant, CSSProperties> = {
  primary:   { background: 'var(--ds-primary)', color: 'var(--fg-on-brand)', border: '1px solid transparent' },
  accent:    { background: 'var(--ds-accent)',  color: 'var(--brand-sage-900,#1F2A2A)', border: '1px solid transparent' },
  secondary: { background: 'var(--bg-surface)', color: 'var(--fg-1)', border: '1px solid var(--border-ds-strong)' },
  ghost:     { background: 'transparent', color: 'var(--fg-1)', border: '1px solid transparent' },
  danger:    { background: 'var(--ds-danger-soft)', color: 'var(--ds-danger)', border: '1px solid transparent' },
}

export default function AppButton({
  children, variant = 'primary', size = 'md', icon, iconRight,
  onClick, type = 'button', href, external, disabled, loading,
  style, className, ariaLabel, title,
}: Props) {
  const css: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'background 180ms cubic-bezier(0.32,0.72,0,1)',
    textDecoration: 'none',
    ...SIZES[size], ...VARIANTS[variant], ...style,
  }
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
      {iconRight}
    </>
  )
  if (href && !disabled && !loading) {
    if (external || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
      return <a href={href} style={css} onClick={onClick} className={className} aria-label={ariaLabel} title={title}>{content}</a>
    }
    return <Link href={href} style={css} className={className} aria-label={ariaLabel} title={title}>{content}</Link>
  }
  return (
    <button
      type={type}
      onClick={onClick}
      style={css}
      className={className}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </button>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}
