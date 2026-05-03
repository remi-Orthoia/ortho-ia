'use client'

import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  title?: string
  ariaLabel?: string
  size?: number
  variant?: 'ghost' | 'soft'
  active?: boolean
  disabled?: boolean
  style?: CSSProperties
  className?: string
}

export default function IconButton({
  children, onClick, title, ariaLabel,
  size = 34, variant = 'ghost', active = false, disabled = false,
  style, className,
}: Props) {
  const palette: CSSProperties =
    variant === 'soft'
      ? { background: 'var(--bg-surface-2)', border: '1px solid transparent' }
      : { background: 'transparent', border: '1px solid var(--border-ds)' }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      className={className}
      style={{
        width: size, height: size, borderRadius: 10,
        color: active ? 'var(--ds-primary)' : 'var(--fg-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'grid', placeItems: 'center',
        transition: 'background 180ms, color 180ms',
        ...palette,
        ...(active ? { background: 'var(--ds-primary-soft)', borderColor: 'transparent' } : null),
        ...style,
      }}
    >
      {children}
    </button>
  )
}
