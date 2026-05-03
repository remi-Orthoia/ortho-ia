import type { CSSProperties, ReactNode } from 'react'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  /** Slot droit — boutons d'action, theme toggle, profil compact… */
  right?: ReactNode
  /** Bordure inférieure visible (default true). */
  bordered?: boolean
  /** Background — default canvas. */
  background?: string
  className?: string
  style?: CSSProperties
}

/**
 * Bandeau supérieur des écrans applicatifs — hauteur fixe (var(--header-h)),
 * titre serif, sous-titre optionnel, slot droit pour actions.
 */
export default function AppHeader({
  title, subtitle, right,
  bordered = true,
  background = 'var(--bg-canvas)',
  className, style,
}: Props) {
  return (
    <header
      className={className}
      style={{
        height: 'var(--header-h, 72px)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        background,
        borderBottom: bordered ? '1px solid var(--border-ds)' : 'none',
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
          margin: 0, lineHeight: 1.2, color: 'var(--fg-1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--fg-3)' }}>{subtitle}</p>
        )}
      </div>
      {right && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {right}
        </div>
      )}
    </header>
  )
}
