import type { CSSProperties, ReactNode } from 'react'

interface Props {
  /** Sidebar (déjà composé par le caller). */
  sidebar: ReactNode
  /** Bandeau supérieur — généralement <AppHeader …/>. */
  header?: ReactNode
  /** Contenu principal. */
  children: ReactNode
  /** Hauteur min du shell (default 100vh). */
  minHeight?: number | string
  /** Background du canvas (default var(--bg-canvas)). */
  background?: string
  className?: string
  style?: CSSProperties
}

/**
 * Coque applicative — sidebar à gauche fixée, header sticky en haut,
 * zone de contenu scrollable. Pas d'opinion sur les routes / l'auth /
 * les contenus — c'est juste la structure visuelle.
 */
export default function AppShell({
  sidebar, header, children,
  minHeight = '100vh',
  background = 'var(--bg-canvas)',
  className, style,
}: Props) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        height: minHeight,
        minHeight: 720,
        background,
        ...style,
      }}
    >
      {sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
