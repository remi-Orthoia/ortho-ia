import type { CSSProperties, ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<BadgeTone, CSSProperties> = {
  neutral: { background: 'var(--bg-surface-2)',  color: 'var(--fg-2)' },
  primary: { background: 'var(--ds-primary-soft)', color: 'var(--ds-primary)' },
  accent:  { background: 'var(--ds-accent-soft)',  color: 'var(--ds-accent-hover)' },
  success: { background: 'var(--ds-success-soft)', color: 'var(--ds-success)' },
  warning: { background: 'var(--ds-warning-soft)', color: 'var(--ds-warning)' },
  danger:  { background: 'var(--ds-danger-soft)',  color: 'var(--ds-danger)' },
  info:    { background: 'var(--ds-info-soft)',    color: 'var(--ds-info)' },
}

interface Props {
  children: ReactNode
  tone?: BadgeTone
  icon?: ReactNode
  style?: CSSProperties
  className?: string
}

export default function Badge({ children, tone = 'neutral', icon, style, className }: Props) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 999,
        fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        ...TONES[tone],
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  )
}
