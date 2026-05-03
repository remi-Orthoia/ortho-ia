'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import Logo from '@/components/ui/Logo'

export interface SidebarItem {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  /** Présence d'une pastille / d'un badge à droite. */
  badge?: ReactNode
  /** Met l'item en valeur (style "primary" — utilisé pour "Nouveau bilan"). */
  primary?: boolean
  onClick?: () => void
}

interface Props {
  /** href de la page courante — détermine quel item est actif. */
  activeHref?: string
  /** Items principaux de navigation. */
  items: SidebarItem[]
  /** Bloc d'en-tête custom (logo, titre…). Si omis, le logo Ortho.ia par défaut est rendu. */
  header?: ReactNode
  /** Bloc inférieur (profil utilisateur, quota, logout…). */
  footer?: ReactNode
  /** Largeur (default 240px depuis --sidebar-w). */
  width?: number | string
  /** Force la sidebar fixée à gauche (mobile drawer = false par défaut). */
  fixed?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Sidebar du design system Stéphanie — fond bg-surface, padding 20×14,
 * items radius 10. Garde la flexibilité de l'app existante via items[]
 * et des slots header/footer.
 */
export default function Sidebar({
  activeHref, items, header, footer,
  width = 'var(--sidebar-w, 240px)',
  fixed = false,
  className, style,
}: Props) {
  return (
    <aside
      className={className}
      style={{
        width,
        flex: '0 0 auto',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-ds)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 14px',
        height: fixed ? '100vh' : '100%',
        position: fixed ? 'sticky' : 'static',
        top: fixed ? 0 : undefined,
        ...style,
      }}
    >
      {header ?? <DefaultLogoBlock />}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        {items.map(it => (
          <SidebarLink key={it.id} item={it} active={activeHref === it.href} />
        ))}
      </nav>

      {footer && (
        <div style={{
          marginTop: 'auto', paddingTop: 12,
          borderTop: '1px solid var(--border-ds)',
        }}>
          {footer}
        </div>
      )}
    </aside>
  )
}

function SidebarLink({ item, active }: { item: SidebarItem; active: boolean }) {
  const baseStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 10,
    background: item.primary
      ? 'var(--ds-primary)'
      : active ? 'var(--ds-primary-soft)' : 'transparent',
    color: item.primary
      ? 'var(--fg-on-brand)'
      : active ? 'var(--ds-primary)' : 'var(--fg-2)',
    border: 0, cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-body)', fontSize: 14,
    fontWeight: active || item.primary ? 600 : 500,
    textDecoration: 'none',
    transition: 'background 180ms, color 180ms',
    width: '100%',
  }
  const iconWrap = (
    <span style={{ display: 'grid', placeItems: 'center', width: 18 }}>{item.icon}</span>
  )
  const inner = (
    <>
      {iconWrap}
      <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
      {item.badge}
    </>
  )
  if (item.href) {
    return <Link href={item.href} style={baseStyle} onClick={item.onClick}>{inner}</Link>
  }
  return <button type="button" style={baseStyle} onClick={item.onClick}>{inner}</button>
}

function DefaultLogoBlock() {
  return (
    <Link
      href="/dashboard"
      style={{ display: 'inline-block', padding: '4px 6px 18px', textDecoration: 'none' }}
      aria-label="Ortho.ia"
    >
      <Logo variant="light" height={32} withoutTagline />
    </Link>
  )
}
